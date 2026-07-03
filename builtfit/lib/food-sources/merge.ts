import type { FoodItem } from "@/lib/types";

/**
 * Merge + rank layer. Preference order per North Star #1:
 *   USDA > OFF branded > OFF generic.
 * Deduplicates by barcode and near-identical name+brand, then ranks by
 * source preference, confidence, and query relevance.
 */

function sourceRank(item: FoodItem): number {
  if (item.source === "usda") return 3;
  if (item.source === "off" && item.brand) return 2;
  if (item.source === "off") return 1;
  return 0;
}

function normKey(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function relevance(item: FoodItem, query: string): number {
  const q = normKey(query);
  const name = normKey(item.name);
  if (!q) return 0;
  if (name === q) return 3;
  if (name.startsWith(q)) return 2;
  if (name.includes(q)) return 1;
  const words = q.split(" ").filter(Boolean);
  const hit = words.filter((w) => name.includes(w)).length;
  return words.length > 0 ? hit / words.length : 0;
}

export function mergeAndRank(
  query: string,
  ...lists: FoodItem[][]
): FoodItem[] {
  const byBarcode = new Map<string, FoodItem>();
  const byNameBrand = new Map<string, FoodItem>();
  const out: FoodItem[] = [];

  const all = lists.flat();
  // Process better sources first so duplicates keep the preferred record.
  all.sort((a, b) => sourceRank(b) - sourceRank(a));

  for (const item of all) {
    if (item.barcode && byBarcode.has(item.barcode)) continue;
    const nameKey = `${normKey(item.name)}|${normKey(item.brand ?? "")}`;
    if (byNameBrand.has(nameKey)) continue;
    if (item.barcode) byBarcode.set(item.barcode, item);
    byNameBrand.set(nameKey, item);
    out.push(item);
  }

  return out.sort((a, b) => {
    const rel = relevance(b, query) - relevance(a, query);
    if (Math.abs(rel) > 0.25) return rel > 0 ? 1 : -1;
    const src = sourceRank(b) - sourceRank(a);
    if (src !== 0) return src;
    return b.confidence - a.confidence;
  });
}
