import type { Metadata } from "next";
import Link from "next/link";
import { Plus, ScanBarcode } from "lucide-react";
import {
  EnergyCard,
  MacroBars,
  QualityScoreCard,
  StreakCard,
  WaterCard,
  WeeklyAverageCard,
} from "@/components/dashboard";
import { DiaryList } from "@/components/diary-list";
import { Button } from "@/components/ui/button";
import { getDayData, getSession, getWeekAverages } from "@/lib/data";
import { todayISO } from "@/lib/utils";

export const metadata: Metadata = { title: "Today" };

export default async function DashboardPage() {
  const { supabase, userId, profile } = await getSession();
  const date = todayISO(profile.timezone);
  const [day, week] = await Promise.all([
    getDayData(supabase, userId, date),
    getWeekAverages(supabase, userId, date),
  ]);

  const exerciseLow = day.exercise.reduce((s, e) => s + e.computed_burn_low, 0);
  const exerciseHigh = day.exercise.reduce((s, e) => s + e.computed_burn_high, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Hey{profile.display_name ? `, ${profile.display_name}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground">
            {new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/foods/scan">
            <Button variant="outline" size="icon" aria-label="Scan barcode">
              <ScanBarcode />
            </Button>
          </Link>
          <Link href="/foods/search">
            <Button>
              <Plus /> Log food
            </Button>
          </Link>
        </div>
      </div>

      {/* Quality score deliberately sits above the calorie ring. */}
      <QualityScoreCard quality={day.quality} />

      <EnergyCard
        totals={day.totals}
        target={profile.calorie_target}
        exerciseLow={exerciseLow}
        exerciseHigh={exerciseHigh}
        caloriesBack={profile.exercise_calories_back}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <MacroBars totals={day.totals} proteinTarget={profile.protein_target_g} />
        <div className="space-y-4">
          <WaterCard date={date} waterMl={day.waterMl} />
          <StreakCard streak={day.streak} />
        </div>
      </div>

      <WeeklyAverageCard {...week} target={profile.calorie_target} />

      <section>
        <h2 className="mb-2 text-lg font-semibold">Today&apos;s diary</h2>
        <DiaryList date={date} entries={day.entries} compact />
      </section>
    </div>
  );
}
