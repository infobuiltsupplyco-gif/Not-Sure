import type { FoodItem, Nutrients, ServingOption } from "@/lib/types";
import { EMPTY_NUTRIENTS } from "@/lib/types";
import { isLikelyWholeFood } from "@/lib/food-sources/whole-food";

/**
 * Open Food Facts adapter. https://openfoodfacts.github.io/openfoodfacts-server/api/
 * Free, no API key. We identify ourselves via User-Agent per their policy.
 */

const SEARCH_BASE = "https://world.openfoodfacts.org";
const USER_AGENT = "BuiltFit/1.0 (nutrition tracker; contact via repo)";

interface OffNutriments {
  "energy-kcal_100g"?: number;
  proteins_100g?: number;
  carbohydrates_100g?: number;
  fat_100g?: number;
  fiber_100g?: number;
  sugars_100g?: number;
  "saturated-fat_100g"?: number;
  sodium_100g?: number;
  potassium_100g?: number;
  calcium_100g?: number;
  iron_100g?: number;
  "vitamin-c_100g"?: number;
  "vitamin-a_100g"?: number;
}

interface OffProduct {
  code?: string;
  product_name?: string;
  brands?: string;
  serving_quantity?: number | string;
  serving_size?: string;
  nutriments?: OffNutriments;
  categories_tags?: string[];
  data_quality_tags?: string[];
  completeness?: number;
}

interface OffSearchResponse {
  products?: OffProduct[];
}

interface OffProductResponse {
  status: number;
  product?: OffProduct;
}

function extractNutrients(n: OffNutriments | undefined): Nutrients {
  const out: Nutrients = { ...EMPTY_NUTRIENTS };
  if (!n) return out;
  const r = (v: number | undefined, f = 1) =>
    v === undefined ? 0 : Math.round(v * f * 10) / 10;
  out.calories = r(n["energy-kcal_100g"]);
  out.protein_g = r(n.proteins_100g);
  out.carbs_g = r(n.carbohydrates_100g);
  out.fat_g = r(n.fat_100g);
  out.fiber_g = r(n.fiber_100g);
  out.sugar_g = r(n.sugars_100g);
  out.saturated_fat_g = r(n["saturated-fat_100g"]);
  out.sodium_mg = r(n.sodium_100g, 1000); // OFF stores grams
  out.potassium_mg = r(n.potassium_100g, 1000);
  out.calcium_mg = r(n.calcium_100g, 1000);
  out.iron_mg = r(n.iron_100g, 1000);
  out.vitamin_c_mg = r(n["vitamin-c_100g"], 1000);
  out.vitamin_a_ug = r(n["vitamin-a_100g"], 1_000_000);
  return out;
}

function extractServings(p: OffProduct): ServingOption[] {
  const servings: ServingOption[] = [{ label: "100 g", grams: 100 }];
  const qty = Number(p.serving_quantity);
  if (Number.isFinite(qty) && qty > 0) {
    servings.unshift({
      label: p.serving_size?.trim() || `1 serving (${Math.round(qty)} g)`,
      grams: Math.round(qty * 10) / 10,
    });
  }
  return servings;
}

export function normalizeOffProduct(p: OffProduct): FoodItem | null {
  const name = p.product_name?.trim();
  const code = p.code;
  if (!name || !code) return null;
  const nutrients = extractNutrients(p.nutriments);
  if (nutrients.calories === 0 && nutrients.protein_g === 0) return null;
  const brand = p.brands?.split(",")[0]?.trim() || null;
  const completeness = p.completeness ?? 0.5;

  return {
    id: `off:${code}`,
    source: "off",
    sourceId: code,
    name,
    brand,
    barcode: code,
    per100g: nutrients,
    servings: extractServings(p),
    // OFF is crowd-sourced from label photos; verified-with-caveats. We show
    // it as verified only when the record is reasonably complete.
    verified: completeness >= 0.5,
    confidence: Math.max(0.4, Math.min(0.85, 0.4 + completeness * 0.45)),
    wholeFood: isLikelyWholeFood(name, brand),
  };
}

const SEARCH_FIELDS =
  "code,product_name,brands,serving_quantity,serving_size,nutriments,completeness";

export async function searchOff(query: string, limit = 15): Promise<FoodItem[]> {
  const url = new URL(`${SEARCH_BASE}/cgi/search.pl`);
  url.searchParams.set("search_terms", query);
  url.searchParams.set("search_simple", "1");
  url.searchParams.set("action", "process");
  url.searchParams.set("json", "1");
  url.searchParams.set("page_size", String(limit));
  url.searchParams.set("fields", SEARCH_FIELDS);

  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    next: { revalidate: 3600 },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as OffSearchResponse;
  return (data.products ?? [])
    .map(normalizeOffProduct)
    .filter((f): f is FoodItem => f !== null);
}

export async function getOffByBarcode(barcode: string): Promise<FoodItem | null> {
  const res = await fetch(
    `${SEARCH_BASE}/api/v2/product/${encodeURIComponent(barcode)}.json?fields=${SEARCH_FIELDS}`,
    { headers: { "User-Agent": USER_AGENT }, next: { revalidate: 86400 } }
  );
  if (!res.ok) return null;
  const data = (await res.json()) as OffProductResponse;
  if (data.status !== 1 || !data.product) return null;
  return normalizeOffProduct(data.product);
}
