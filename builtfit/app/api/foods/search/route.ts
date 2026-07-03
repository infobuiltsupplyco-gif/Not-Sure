import { NextResponse } from "next/server";
import { z } from "zod";
import { searchVerifiedFoods } from "@/lib/food-sources";
import { createClient } from "@/lib/supabase/server";
import type { FoodItem, Nutrients, ServingOption } from "@/lib/types";

const querySchema = z.object({
  q: z.string().min(1).max(120),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({ q: searchParams.get("q") ?? "" });
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a search term" }, { status: 400 });
  }
  const q = parsed.data.q;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  // Personal foods and recipes are scoped to the signed-in user by RLS and
  // never mix into the global verified list.
  const [verified, personalRes, recipesRes] = await Promise.all([
    searchVerifiedFoods(q),
    supabase
      .from("personal_foods")
      .select("id, name, brand, per_100g, servings")
      .eq("user_id", user.id)
      .ilike("name", `%${q}%`)
      .limit(10),
    supabase
      .from("recipes")
      .select("id, name, per_serving, serving_grams")
      .eq("user_id", user.id)
      .ilike("name", `%${q}%`)
      .limit(10),
  ]);

  const personal: FoodItem[] = (personalRes.data ?? []).map((row) => ({
    id: `personal:${row.id}`,
    source: "personal",
    sourceId: row.id as string,
    name: row.name as string,
    brand: (row.brand as string | null) ?? null,
    barcode: null,
    per100g: row.per_100g as Nutrients,
    servings: row.servings as ServingOption[],
    verified: false,
    confidence: 0.3,
    wholeFood: false,
  }));

  const recipes: FoodItem[] = (recipesRes.data ?? []).map((row) => {
    const servingGrams = Number(row.serving_grams) || 100;
    const perServing = row.per_serving as Nutrients;
    // Convert per-serving back to per-100g so logging math stays uniform.
    const factor = 100 / servingGrams;
    const per100g = { ...perServing };
    for (const key of Object.keys(per100g) as (keyof Nutrients)[]) {
      per100g[key] = Math.round(perServing[key] * factor * 10) / 10;
    }
    return {
      id: `recipe:${row.id}`,
      source: "recipe" as const,
      sourceId: row.id as string,
      name: row.name as string,
      brand: "My recipe",
      barcode: null,
      per100g,
      servings: [
        { label: "1 serving", grams: servingGrams },
        { label: "100 g", grams: 100 },
      ],
      verified: false,
      confidence: 0.5,
      wholeFood: false,
    };
  });

  return NextResponse.json({ verified, personal, recipes });
}
