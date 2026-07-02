import type { FoodItem, Nutrients, ServingOption } from "@/lib/types";
import { EMPTY_NUTRIENTS } from "@/lib/types";
import { isLikelyWholeFood } from "@/lib/food-sources/whole-food";

/**
 * USDA FoodData Central adapter. https://fdc.nal.usda.gov/api-guide.html
 * Free API key from https://fdc.nal.usda.gov/api-key-signup.html
 * (DEMO_KEY works for light development use.)
 */

const BASE = "https://api.nal.usda.gov/fdc/v1";

function apiKey(): string {
  return process.env.USDA_API_KEY ?? "DEMO_KEY";
}

interface UsdaNutrient {
  nutrientId?: number;
  nutrientNumber?: string;
  value?: number;
  nutrient?: { id?: number; number?: string };
  amount?: number;
}

interface UsdaFood {
  fdcId: number;
  description: string;
  brandOwner?: string;
  brandName?: string;
  gtinUpc?: string;
  dataType?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  householdServingFullText?: string;
  foodNutrients?: UsdaNutrient[];
}

interface UsdaSearchResponse {
  foods?: UsdaFood[];
}

/** FDC nutrient ids → our normalized keys. */
const NUTRIENT_MAP: Record<number, keyof Nutrients> = {
  1008: "calories", // Energy kcal
  2047: "calories", // Energy (Atwater general)
  1003: "protein_g",
  1005: "carbs_g",
  1004: "fat_g",
  1079: "fiber_g",
  2000: "sugar_g",
  1258: "saturated_fat_g",
  1093: "sodium_mg",
  1092: "potassium_mg",
  1087: "calcium_mg",
  1089: "iron_mg",
  1162: "vitamin_c_mg",
  1106: "vitamin_a_ug",
};

function extractNutrients(raw: UsdaNutrient[] | undefined): Nutrients {
  const out: Nutrients = { ...EMPTY_NUTRIENTS };
  if (!raw) return out;
  for (const n of raw) {
    const id = n.nutrientId ?? n.nutrient?.id;
    const value = n.value ?? n.amount;
    if (id === undefined || value === undefined) continue;
    const key = NUTRIENT_MAP[id];
    // First value wins (1008 preferred over 2047 by API ordering).
    if (key && out[key] === 0) out[key] = Math.round(value * 10) / 10;
  }
  return out;
}

function extractServings(food: UsdaFood): ServingOption[] {
  const servings: ServingOption[] = [{ label: "100 g", grams: 100 }];
  if (
    food.servingSize &&
    food.servingSizeUnit &&
    ["g", "GRM", "ml", "MLT"].includes(food.servingSizeUnit)
  ) {
    const label =
      food.householdServingFullText?.trim() ||
      `1 serving (${Math.round(food.servingSize)} ${food.servingSizeUnit.toLowerCase().startsWith("m") ? "ml" : "g"})`;
    servings.unshift({ label, grams: Math.round(food.servingSize * 10) / 10 });
  }
  return servings;
}

function confidenceFor(dataType: string | undefined): number {
  switch (dataType) {
    case "Foundation":
    case "SR Legacy":
      return 0.98;
    case "Survey (FNDDS)":
      return 0.92;
    case "Branded":
      return 0.88;
    default:
      return 0.85;
  }
}

export function normalizeUsdaFood(food: UsdaFood): FoodItem {
  const brand = food.brandName || food.brandOwner || null;
  return {
    id: `usda:${food.fdcId}`,
    source: "usda",
    sourceId: String(food.fdcId),
    name: food.description,
    brand,
    barcode: food.gtinUpc ?? null,
    per100g: extractNutrients(food.foodNutrients),
    servings: extractServings(food),
    verified: true,
    confidence: confidenceFor(food.dataType),
    wholeFood: isLikelyWholeFood(food.description, brand),
  };
}

export async function searchUsda(
  query: string,
  limit = 15
): Promise<FoodItem[]> {
  const url = new URL(`${BASE}/foods/search`);
  url.searchParams.set("api_key", apiKey());
  url.searchParams.set("query", query);
  url.searchParams.set("pageSize", String(limit));
  url.searchParams.set(
    "dataType",
    "Foundation,SR Legacy,Branded,Survey (FNDDS)"
  );

  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return [];
  const data = (await res.json()) as UsdaSearchResponse;
  return (data.foods ?? [])
    .map(normalizeUsdaFood)
    .filter((f) => f.per100g.calories > 0 || f.per100g.protein_g > 0);
}
