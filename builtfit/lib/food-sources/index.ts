import type { FoodItem, Nutrients, ServingOption } from "@/lib/types";
import { searchUsda } from "@/lib/food-sources/usda";
import { searchOff, getOffByBarcode } from "@/lib/food-sources/openfoodfacts";
import { mergeAndRank } from "@/lib/food-sources/merge";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export interface FoodsCacheRow {
  id: string;
  source: string;
  source_id: string;
  name: string;
  brand: string | null;
  barcode: string | null;
  servings: ServingOption[];
  per_100g: Nutrients;
  verified: boolean;
  confidence: number;
  whole_food: boolean;
}

export function cacheRowToFoodItem(row: FoodsCacheRow): FoodItem {
  return {
    id: `${row.source}:${row.source_id}`,
    source: row.source as FoodItem["source"],
    sourceId: row.source_id,
    name: row.name,
    brand: row.brand,
    barcode: row.barcode,
    per100g: row.per_100g,
    servings: row.servings,
    verified: row.verified,
    confidence: row.confidence,
    wholeFood: row.whole_food,
  };
}

function foodItemToCacheRow(item: FoodItem): Omit<FoodsCacheRow, "id"> {
  return {
    source: item.source,
    source_id: item.sourceId,
    name: item.name,
    brand: item.brand,
    barcode: item.barcode,
    servings: item.servings,
    per_100g: item.per100g,
    verified: item.verified,
    confidence: item.confidence,
    whole_food: item.wholeFood,
  };
}

/** Fire-and-forget upsert of API results into foods_cache (service role only). */
async function cacheResults(items: FoodItem[]): Promise<void> {
  if (!hasServiceRole() || items.length === 0) return;
  try {
    const admin = createAdminClient();
    await admin
      .from("foods_cache")
      .upsert(
        items.filter((i) => i.source === "usda" || i.source === "off").map(foodItemToCacheRow),
        { onConflict: "source,source_id" }
      );
  } catch {
    // Caching is best-effort; never fail a search because of it.
  }
}

async function searchCache(query: string, limit: number): Promise<FoodItem[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("foods_cache")
      .select(
        "id, source, source_id, name, brand, barcode, servings, per_100g, verified, confidence, whole_food"
      )
      .ilike("name", `%${query}%`)
      .order("confidence", { ascending: false })
      .limit(limit);
    return ((data ?? []) as FoodsCacheRow[]).map(cacheRowToFoodItem);
  } catch {
    return [];
  }
}

/**
 * Search verified sources: local cache first (fast, works offline from the
 * APIs), then USDA + Open Food Facts in parallel. External results are merged,
 * ranked USDA > OFF-branded > OFF-generic, and written back to the cache.
 */
export async function searchVerifiedFoods(
  query: string,
  limit = 25
): Promise<FoodItem[]> {
  const [cached, usda, off] = await Promise.all([
    searchCache(query, 10),
    searchUsda(query, 12).catch(() => [] as FoodItem[]),
    searchOff(query, 12).catch(() => [] as FoodItem[]),
  ]);

  void cacheResults([...usda, ...off]);
  return mergeAndRank(query, cached, usda, off).slice(0, limit);
}

/** Barcode lookup: cache → Open Food Facts → cache write-back. */
export async function lookupBarcode(barcode: string): Promise<FoodItem | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("foods_cache")
      .select(
        "id, source, source_id, name, brand, barcode, servings, per_100g, verified, confidence, whole_food"
      )
      .eq("barcode", barcode)
      .limit(1)
      .maybeSingle();
    if (data) return cacheRowToFoodItem(data as FoodsCacheRow);
  } catch {
    // fall through to API
  }

  const item = await getOffByBarcode(barcode).catch(() => null);
  if (item) void cacheResults([item]);
  return item;
}
