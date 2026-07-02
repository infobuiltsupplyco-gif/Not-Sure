import type { DiaryEntryRow, Nutrients } from "@/lib/types";
import { sumNutrients } from "@/lib/types";

/**
 * The Food Quality Score is BuiltFit's headline metric — it sits above the
 * calorie ring on purpose. It rewards food quality and adequacy, never
 * deficit size.
 *
 * Components (each 0–100, weighted):
 *  - whole-food share of calories        (35%)
 *  - protein adequacy vs personal target (25%)
 *  - fiber vs target                     (20%)
 *  - micronutrient coverage              (20%)
 */

export interface QualityBreakdown {
  wholeFoodPct: number;
  proteinAdequacy: number;
  fiberG: number;
  fiberScore: number;
  microCoveragePct: number;
  overall: number;
}

interface MicroTarget {
  key: keyof Nutrients;
  target: number;
}

const MICRO_TARGETS: MicroTarget[] = [
  { key: "potassium_mg", target: 3400 },
  { key: "calcium_mg", target: 1000 },
  { key: "iron_mg", target: 12 },
  { key: "vitamin_c_mg", target: 80 },
  { key: "vitamin_a_ug", target: 800 },
];

function clampPct(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)));
}

export function computeQualityScore(
  entries: Pick<DiaryEntryRow, "nutrition" | "verified" | "food_id">[],
  wholeFoodFlags: boolean[],
  proteinTargetG: number,
  fiberTargetG: number
): QualityBreakdown {
  if (entries.length === 0) {
    return {
      wholeFoodPct: 0,
      proteinAdequacy: 0,
      fiberG: 0,
      fiberScore: 0,
      microCoveragePct: 0,
      overall: 0,
    };
  }

  const totals = sumNutrients(entries.map((e) => e.nutrition));

  const totalCals = entries.reduce((s, e) => s + e.nutrition.calories, 0);
  const wholeCals = entries.reduce(
    (s, e, i) => s + (wholeFoodFlags[i] ? e.nutrition.calories : 0),
    0
  );
  const wholeFoodPct = clampPct(totalCals > 0 ? (wholeCals / totalCals) * 100 : 0);

  const proteinAdequacy = clampPct(
    proteinTargetG > 0 ? (totals.protein_g / proteinTargetG) * 100 : 0
  );

  const fiberScore = clampPct(
    fiberTargetG > 0 ? (totals.fiber_g / fiberTargetG) * 100 : 0
  );

  const microCoveragePct = clampPct(
    (MICRO_TARGETS.reduce(
      (s, m) => s + Math.min(1, totals[m.key] / m.target),
      0
    ) /
      MICRO_TARGETS.length) *
      100
  );

  const overall = clampPct(
    wholeFoodPct * 0.35 +
      proteinAdequacy * 0.25 +
      fiberScore * 0.2 +
      microCoveragePct * 0.2
  );

  return {
    wholeFoodPct,
    proteinAdequacy,
    fiberG: totals.fiber_g,
    fiberScore,
    microCoveragePct,
    overall,
  };
}

/** Supportive, neutral wording only. */
export function qualityLabel(overall: number): string {
  if (overall >= 80) return "Excellent balance today";
  if (overall >= 60) return "Solid, well-rounded day";
  if (overall >= 40) return "A good base — room to add variety";
  if (overall > 0) return "Every log is useful data";
  return "Log a meal to see your quality score";
}
