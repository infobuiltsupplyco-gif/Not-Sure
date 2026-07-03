"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser, fail, OK, type ActionResult } from "@/lib/actions/helpers";
import {
  scaleNutrients,
  sumNutrients,
  type Nutrients,
} from "@/lib/types";

const nutrientsSchema = z.object({
  calories: z.number().min(0),
  protein_g: z.number().min(0),
  carbs_g: z.number().min(0),
  fat_g: z.number().min(0),
  fiber_g: z.number().min(0),
  sugar_g: z.number().min(0),
  saturated_fat_g: z.number().min(0),
  sodium_mg: z.number().min(0),
  potassium_mg: z.number().min(0),
  calcium_mg: z.number().min(0),
  iron_mg: z.number().min(0),
  vitamin_c_mg: z.number().min(0),
  vitamin_a_ug: z.number().min(0),
}) satisfies z.ZodType<Nutrients>;

const ingredientSchema = z.object({
  foodId: z.string().min(1),
  foodName: z.string().min(1).max(300),
  quantity: z.number().positive().max(100),
  servingLabel: z.string().min(1),
  servingGrams: z.number().positive().max(5000),
  per100g: nutrientsSchema,
});

const createRecipeSchema = z.object({
  name: z.string().min(1).max(120),
  servingsCount: z.number().positive().max(100),
  ingredients: z.array(ingredientSchema).min(1).max(50),
});

export type CreateRecipeInput = z.infer<typeof createRecipeSchema>;

/** Create a recipe; per-serving nutrition is auto-computed from ingredients. */
export async function createRecipe(input: CreateRecipeInput): Promise<ActionResult> {
  const parsed = createRecipeSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Check the recipe");
  const { supabase, user } = await requireUser();
  const d = parsed.data;

  const ingredientNutrition = d.ingredients.map((ing) =>
    scaleNutrients(ing.per100g, ing.quantity * ing.servingGrams)
  );
  const total = sumNutrients(ingredientNutrition);
  const totalGrams = d.ingredients.reduce(
    (s, ing) => s + ing.quantity * ing.servingGrams,
    0
  );

  const perServing = { ...total };
  for (const key of Object.keys(perServing) as (keyof Nutrients)[]) {
    perServing[key] = Math.round((total[key] / d.servingsCount) * 10) / 10;
  }
  const servingGrams = Math.round((totalGrams / d.servingsCount) * 10) / 10;

  const { data: recipe, error } = await supabase
    .from("recipes")
    .insert({
      user_id: user.id,
      name: d.name,
      servings_count: d.servingsCount,
      per_serving: perServing,
      serving_grams: servingGrams,
    })
    .select("id")
    .single();
  if (error || !recipe) return fail(error?.message ?? "Could not save recipe");

  const { error: ingError } = await supabase.from("recipe_ingredients").insert(
    d.ingredients.map((ing, i) => ({
      recipe_id: recipe.id as string,
      food_id: ing.foodId,
      food_name: ing.foodName,
      quantity: ing.quantity,
      serving_label: ing.servingLabel,
      serving_grams: ing.servingGrams,
      nutrition: ingredientNutrition[i],
    }))
  );
  if (ingError) return fail(ingError.message);

  revalidatePath("/recipes");
  return OK;
}

export async function deleteRecipe(id: string): Promise<ActionResult> {
  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) return fail("Invalid recipe reference");
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("recipes")
    .delete()
    .eq("id", parsed.data)
    .eq("user_id", user.id);
  if (error) return fail(error.message);
  revalidatePath("/recipes");
  return OK;
}

const personalFoodSchema = z.object({
  name: z.string().min(1).max(200),
  brand: z.string().max(200).optional(),
  servingLabel: z.string().min(1).max(100),
  servingGrams: z.number().positive().max(5000),
  /** Nutrients for ONE serving as entered by the user. */
  perServing: nutrientsSchema,
});

export type PersonalFoodInput = z.infer<typeof personalFoodSchema>;

/**
 * Personal foods are sandboxed to the creating user and always marked
 * unverified. They never appear in anyone else's search.
 */
export async function createPersonalFood(input: PersonalFoodInput): Promise<ActionResult> {
  const parsed = personalFoodSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Check the food details");
  const { supabase, user } = await requireUser();
  const d = parsed.data;

  // Convert entered per-serving values to per-100g for storage.
  const factor = 100 / d.servingGrams;
  const per100g = { ...d.perServing };
  for (const key of Object.keys(per100g) as (keyof Nutrients)[]) {
    per100g[key] = Math.round(d.perServing[key] * factor * 10) / 10;
  }

  const { error } = await supabase.from("personal_foods").insert({
    user_id: user.id,
    name: d.name,
    brand: d.brand ?? null,
    per_100g: per100g,
    servings: [
      { label: d.servingLabel, grams: d.servingGrams },
      { label: "100 g", grams: 100 },
    ],
  });
  if (error) return fail(error.message);

  revalidatePath("/foods");
  return OK;
}

export async function deletePersonalFood(id: string): Promise<ActionResult> {
  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) return fail("Invalid food reference");
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("personal_foods")
    .delete()
    .eq("id", parsed.data)
    .eq("user_id", user.id);
  if (error) return fail(error.message);
  revalidatePath("/foods");
  return OK;
}
