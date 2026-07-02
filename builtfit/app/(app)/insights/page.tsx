import type { Metadata } from "next";
import { InsightsCharts } from "@/components/insights-charts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/data";
import type { QualityScoreRow } from "@/lib/types";
import { sumNutrients, type Nutrients } from "@/lib/types";
import { addDays, todayISO } from "@/lib/utils";

export const metadata: Metadata = { title: "Insights" };

export default async function InsightsPage() {
  const { supabase, userId, profile } = await getSession();
  const end = todayISO(profile.timezone);
  const start = addDays(end, -27);

  const [qualityRes, entriesRes, streakRes] = await Promise.all([
    supabase
      .from("food_quality_scores")
      .select("*")
      .eq("user_id", userId)
      .gte("date", start)
      .lte("date", end)
      .order("date"),
    supabase
      .from("diary_entries")
      .select("date, nutrition")
      .eq("user_id", userId)
      .gte("date", start)
      .lte("date", end),
    supabase.from("streaks").select("*").eq("user_id", userId).maybeSingle(),
  ]);

  const scores = (qualityRes.data ?? []) as QualityScoreRow[];

  // Per-day totals for protein/fiber adequacy.
  const byDate = new Map<string, Nutrients[]>();
  for (const row of entriesRes.data ?? []) {
    const list = byDate.get(row.date as string) ?? [];
    list.push(row.nutrition as Nutrients);
    byDate.set(row.date as string, list);
  }
  const dayRows = [...byDate.entries()]
    .map(([date, list]) => ({ date, totals: sumNutrients(list) }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const loggedDays = dayRows.length;
  const proteinTarget = profile.protein_target_g ?? 100;
  const fiberTarget = profile.sex === "male" ? 38 : 25;
  const proteinDays = dayRows.filter((d) => d.totals.protein_g >= proteinTarget * 0.8).length;
  const fiberDays = dayRows.filter((d) => d.totals.fiber_g >= fiberTarget * 0.8).length;
  const avgQuality = scores.length
    ? Math.round(scores.reduce((s, q) => s + Number(q.overall), 0) / scores.length)
    : 0;

  const consistencyNote =
    loggedDays >= 20
      ? "You've logged nearly every day — that consistency is the single best predictor of reaching your goals."
      : loggedDays >= 10
        ? "You're logging regularly. Every entry sharpens your picture — keep going at your own pace."
        : loggedDays > 0
          ? "You've made a start, and starts count. Even a few logged days reveal useful patterns."
          : "No data in the last four weeks yet. Whenever you're ready, one logged meal is all it takes to begin.";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Insights</h1>
        <p className="text-sm text-muted-foreground">Your last four weeks, without judgment.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Consistency</CardTitle>
          <CardDescription>{consistencyNote}</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-2xl font-bold text-primary">{loggedDays}</p>
            <p className="text-xs text-muted-foreground">days logged (of 28)</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{streakRes.data?.current_streak ?? 0}</p>
            <p className="text-xs text-muted-foreground">current streak</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{avgQuality}</p>
            <p className="text-xs text-muted-foreground">avg quality score</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{streakRes.data?.longest_streak ?? 0}</p>
            <p className="text-xs text-muted-foreground">longest streak</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Protein & fiber adequacy</CardTitle>
          <CardDescription>
            Days reaching at least 80% of your targets. Adequacy beats restriction —
            these are the numbers we&apos;d love to see climb.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-2xl font-bold">
              {loggedDays > 0 ? Math.round((proteinDays / loggedDays) * 100) : 0}%
            </p>
            <p className="text-xs text-muted-foreground">
              of logged days near your protein target
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold">
              {loggedDays > 0 ? Math.round((fiberDays / loggedDays) * 100) : 0}%
            </p>
            <p className="text-xs text-muted-foreground">
              of logged days near your fiber target
            </p>
          </div>
        </CardContent>
      </Card>

      <InsightsCharts
        scores={scores.map((s) => ({
          date: s.date,
          overall: Number(s.overall),
          wholeFood: Number(s.whole_food_pct),
        }))}
      />
    </div>
  );
}
