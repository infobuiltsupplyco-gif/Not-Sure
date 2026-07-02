import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  DiaryEntryRow,
  ExerciseEntryRow,
  ProfileRow,
  QualityScoreRow,
  StreakRow,
  WeightLogRow,
} from "@/lib/types";
import { sumNutrients, EMPTY_NUTRIENTS, type Nutrients } from "@/lib/types";
import { addDays, todayISO } from "@/lib/utils";

export interface SessionData {
  supabase: SupabaseClient;
  userId: string;
  profile: ProfileRow;
}

/** Load the signed-in user + profile, redirecting through auth/onboarding. */
export async function getSession(): Promise<SessionData> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) {
    // Profile trigger hasn't fired or was removed — create a bare profile.
    await supabase.from("profiles").insert({ user_id: user.id }).select().maybeSingle();
    redirect("/onboarding");
  }
  if (!(profile as ProfileRow).onboarded) redirect("/onboarding");

  return { supabase, userId: user.id, profile: profile as ProfileRow };
}

export interface DayData {
  date: string;
  entries: DiaryEntryRow[];
  exercise: ExerciseEntryRow[];
  waterMl: number;
  totals: Nutrients;
  quality: QualityScoreRow | null;
  streak: StreakRow | null;
}

export async function getDayData(
  supabase: SupabaseClient,
  userId: string,
  date: string
): Promise<DayData> {
  const [entriesRes, exerciseRes, waterRes, qualityRes, streakRes] = await Promise.all([
    supabase
      .from("diary_entries")
      .select("*")
      .eq("user_id", userId)
      .eq("date", date)
      .order("created_at"),
    supabase
      .from("exercise_entries")
      .select("*")
      .eq("user_id", userId)
      .eq("date", date)
      .order("created_at"),
    supabase.from("water_logs").select("ml").eq("user_id", userId).eq("date", date),
    supabase
      .from("food_quality_scores")
      .select("*")
      .eq("user_id", userId)
      .eq("date", date)
      .maybeSingle(),
    supabase.from("streaks").select("*").eq("user_id", userId).maybeSingle(),
  ]);

  const entries = (entriesRes.data ?? []) as DiaryEntryRow[];
  return {
    date,
    entries,
    exercise: (exerciseRes.data ?? []) as ExerciseEntryRow[],
    waterMl: (waterRes.data ?? []).reduce((s, w) => s + (w.ml as number), 0),
    totals: entries.length
      ? sumNutrients(entries.map((e) => e.nutrition))
      : { ...EMPTY_NUTRIENTS },
    quality: (qualityRes.data as QualityScoreRow | null) ?? null,
    streak: (streakRes.data as StreakRow | null) ?? null,
  };
}

export interface WeekAverages {
  days: number;
  avgCalories: number;
  avgProtein: number;
  avgFiber: number;
  avgQuality: number;
}

/** Weekly averages over the trailing 7 days — the view we prioritize. */
export async function getWeekAverages(
  supabase: SupabaseClient,
  userId: string,
  endDate: string
): Promise<WeekAverages> {
  const startDate = addDays(endDate, -6);
  const [entriesRes, qualityRes] = await Promise.all([
    supabase
      .from("diary_entries")
      .select("date, nutrition")
      .eq("user_id", userId)
      .gte("date", startDate)
      .lte("date", endDate),
    supabase
      .from("food_quality_scores")
      .select("overall")
      .eq("user_id", userId)
      .gte("date", startDate)
      .lte("date", endDate),
  ]);

  const byDate = new Map<string, Nutrients[]>();
  for (const row of entriesRes.data ?? []) {
    const list = byDate.get(row.date as string) ?? [];
    list.push(row.nutrition as Nutrients);
    byDate.set(row.date as string, list);
  }
  const dayTotals = [...byDate.values()].map((list) => sumNutrients(list));
  const days = dayTotals.length;
  const qualities = (qualityRes.data ?? []).map((q) => Number(q.overall));

  return {
    days,
    avgCalories: days ? Math.round(dayTotals.reduce((s, t) => s + t.calories, 0) / days) : 0,
    avgProtein: days
      ? Math.round(dayTotals.reduce((s, t) => s + t.protein_g, 0) / days)
      : 0,
    avgFiber: days ? Math.round(dayTotals.reduce((s, t) => s + t.fiber_g, 0) / days) : 0,
    avgQuality: qualities.length
      ? Math.round(qualities.reduce((s, q) => s + q, 0) / qualities.length)
      : 0,
  };
}

export async function getWeightLogs(
  supabase: SupabaseClient,
  userId: string,
  limitDays = 365
): Promise<WeightLogRow[]> {
  const { data } = await supabase
    .from("weight_logs")
    .select("*")
    .eq("user_id", userId)
    .gte("date", addDays(todayISO(), -limitDays))
    .order("date");
  return (data ?? []) as WeightLogRow[];
}

/** Recent + frequent foods for quick logging. */
export async function getRecentFoods(
  supabase: SupabaseClient,
  userId: string
): Promise<
  { food_id: string; food_name: string; food_brand: string | null; verified: boolean; serving_label: string; serving_grams: number; nutrition: Nutrients; whole_food: boolean; count: number }[]
> {
  const { data } = await supabase
    .from("diary_entries")
    .select("food_id, food_name, food_brand, verified, serving_label, serving_grams, nutrition, whole_food")
    .eq("user_id", userId)
    .neq("food_id", "quick-add")
    .order("created_at", { ascending: false })
    .limit(120);

  const seen = new Map<
    string,
    { food_id: string; food_name: string; food_brand: string | null; verified: boolean; serving_label: string; serving_grams: number; nutrition: Nutrients; whole_food: boolean; count: number }
  >();
  for (const row of data ?? []) {
    const key = row.food_id as string;
    const existing = seen.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      seen.set(key, {
        food_id: row.food_id as string,
        food_name: row.food_name as string,
        food_brand: row.food_brand as string | null,
        verified: row.verified as boolean,
        serving_label: row.serving_label as string,
        serving_grams: Number(row.serving_grams),
        nutrition: row.nutrition as Nutrients,
        whole_food: row.whole_food as boolean,
        count: 1,
      });
    }
  }
  return [...seen.values()].sort((a, b) => b.count - a.count).slice(0, 12);
}
