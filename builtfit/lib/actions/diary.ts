"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser, fail, OK, type ActionResult } from "@/lib/actions/helpers";
import { recomputeQualityScore } from "@/lib/actions/quality";
import { scaleNutrients, type FoodItem, type Nutrients } from "@/lib/types";
import { isLikelyWholeFood } from "@/lib/food-sources/whole-food";

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

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date");
const mealSchema = z.enum(["breakfast", "lunch", "dinner", "snack"]);

const addEntrySchema = z.object({
  date: dateSchema,
  meal: mealSchema,
  food: z.object({
    id: z.string().min(1),
    source: z.enum(["usda", "off", "personal", "recipe"]),
    sourceId: z.string(),
    name: z.string().min(1).max(300),
    brand: z.string().max(200).nullable(),
    barcode: z.string().max(64).nullable(),
    per100g: nutrientsSchema,
    servings: z.array(z.object({ label: z.string(), grams: z.number().positive() })).min(1),
    verified: z.boolean(),
    confidence: z.number().min(0).max(1),
    wholeFood: z.boolean(),
  }),
  quantity: z.number().positive().max(100),
  servingLabel: z.string().min(1),
  servingGrams: z.number().positive().max(5000),
});

export async function addDiaryEntry(input: {
  date: string;
  meal: string;
  food: FoodItem;
  quantity: number;
  servingLabel: string;
  servingGrams: number;
}): Promise<ActionResult> {
  const parsed = addEntrySchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid entry");
  const { supabase, user } = await requireUser();
  const d = parsed.data;

  const grams = d.quantity * d.servingGrams;
  const nutrition = scaleNutrients(d.food.per100g, grams);

  const { error } = await supabase.from("diary_entries").insert({
    user_id: user.id,
    date: d.date,
    meal: d.meal,
    food_id: d.food.id,
    food_name: d.food.name,
    food_brand: d.food.brand,
    verified: d.food.verified,
    quantity: d.quantity,
    serving_label: d.servingLabel,
    serving_grams: d.servingGrams,
    nutrition,
    whole_food: d.food.wholeFood,
  });
  if (error) return fail(error.message);

  await recomputeQualityScore(supabase, user.id, d.date);
  revalidatePath("/dashboard");
  revalidatePath("/diary");
  return OK;
}

const quickAddSchema = z.object({
  date: dateSchema,
  meal: mealSchema,
  name: z.string().min(1).max(200),
  calories: z.number().min(0).max(10000),
  protein_g: z.number().min(0).max(1000),
  carbs_g: z.number().min(0).max(1000),
  fat_g: z.number().min(0).max(1000),
});

/** Quick add: log calories/macros without a food record. Marked unverified. */
export async function quickAddEntry(input: z.infer<typeof quickAddSchema>): Promise<ActionResult> {
  const parsed = quickAddSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid entry");
  const { supabase, user } = await requireUser();
  const d = parsed.data;

  const nutrition: Nutrients = {
    calories: d.calories,
    protein_g: d.protein_g,
    carbs_g: d.carbs_g,
    fat_g: d.fat_g,
    fiber_g: 0,
    sugar_g: 0,
    saturated_fat_g: 0,
    sodium_mg: 0,
    potassium_mg: 0,
    calcium_mg: 0,
    iron_mg: 0,
    vitamin_c_mg: 0,
    vitamin_a_ug: 0,
  };

  const { error } = await supabase.from("diary_entries").insert({
    user_id: user.id,
    date: d.date,
    meal: d.meal,
    food_id: "quick-add",
    food_name: d.name,
    food_brand: null,
    verified: false,
    quantity: 1,
    serving_label: "1 entry",
    serving_grams: 0,
    nutrition,
    whole_food: isLikelyWholeFood(d.name, null),
  });
  if (error) return fail(error.message);

  await recomputeQualityScore(supabase, user.id, d.date);
  revalidatePath("/dashboard");
  revalidatePath("/diary");
  return OK;
}

export async function deleteDiaryEntry(id: string, date: string): Promise<ActionResult> {
  const parsed = z.object({ id: z.string().uuid(), date: dateSchema }).safeParse({ id, date });
  if (!parsed.success) return fail("Invalid entry reference");
  const { supabase, user } = await requireUser();

  const { error } = await supabase
    .from("diary_entries")
    .delete()
    .eq("id", parsed.data.id)
    .eq("user_id", user.id);
  if (error) return fail(error.message);

  await recomputeQualityScore(supabase, user.id, parsed.data.date);
  revalidatePath("/dashboard");
  revalidatePath("/diary");
  return OK;
}

/** Copy all of yesterday's entries (or one meal) onto a target date. */
export async function copyFromDate(input: {
  fromDate: string;
  toDate: string;
  meal?: string;
}): Promise<ActionResult> {
  const parsed = z
    .object({ fromDate: dateSchema, toDate: dateSchema, meal: mealSchema.optional() })
    .safeParse(input);
  if (!parsed.success) return fail("Invalid dates");
  const { supabase, user } = await requireUser();

  let query = supabase
    .from("diary_entries")
    .select(
      "meal, food_id, food_name, food_brand, verified, quantity, serving_label, serving_grams, nutrition, whole_food"
    )
    .eq("user_id", user.id)
    .eq("date", parsed.data.fromDate);
  if (parsed.data.meal) query = query.eq("meal", parsed.data.meal);

  const { data: rows, error } = await query;
  if (error) return fail(error.message);
  if (!rows || rows.length === 0) return fail("Nothing logged on that day to copy.");

  const { error: insertError } = await supabase.from("diary_entries").insert(
    rows.map((r) => ({ ...r, user_id: user.id, date: parsed.data.toDate }))
  );
  if (insertError) return fail(insertError.message);

  await recomputeQualityScore(supabase, user.id, parsed.data.toDate);
  revalidatePath("/dashboard");
  revalidatePath("/diary");
  return OK;
}

const waterSchema = z.object({ date: dateSchema, ml: z.number().int().min(1).max(10000) });

export async function addWater(input: { date: string; ml: number }): Promise<ActionResult> {
  const parsed = waterSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid amount");
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("water_logs").insert({
    user_id: user.id,
    date: parsed.data.date,
    ml: parsed.data.ml,
  });
  if (error) return fail(error.message);
  revalidatePath("/dashboard");
  return OK;
}
