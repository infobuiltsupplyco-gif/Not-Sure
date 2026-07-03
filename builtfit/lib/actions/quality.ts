import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { computeQualityScore } from "@/lib/quality-score";
import type { Nutrients } from "@/lib/types";

interface EntryLite {
  nutrition: Nutrients;
  verified: boolean;
  food_id: string;
  whole_food: boolean;
}

/**
 * Recompute and persist the daily Food Quality Score. Called after any diary
 * mutation for the affected date.
 */
export async function recomputeQualityScore(
  supabase: SupabaseClient,
  userId: string,
  date: string
): Promise<void> {
  const [{ data: entries }, { data: profile }] = await Promise.all([
    supabase
      .from("diary_entries")
      .select("nutrition, verified, food_id, whole_food")
      .eq("user_id", userId)
      .eq("date", date),
    supabase
      .from("profiles")
      .select("protein_target_g, sex")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const list = (entries ?? []) as EntryLite[];
  const proteinTarget = profile?.protein_target_g ?? 100;
  const fiberTarget = profile?.sex === "male" ? 38 : 25;

  const score = computeQualityScore(
    list,
    list.map((e) => e.whole_food),
    proteinTarget,
    fiberTarget
  );

  await supabase.from("food_quality_scores").upsert(
    {
      user_id: userId,
      date,
      whole_food_pct: score.wholeFoodPct,
      protein_adequacy: score.proteinAdequacy,
      fiber_g: score.fiberG,
      micro_coverage_pct: score.microCoveragePct,
      overall: score.overall,
    },
    { onConflict: "user_id,date" }
  );
}
