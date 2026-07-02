import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DiaryList } from "@/components/diary-list";
import { DiaryToolbar } from "@/components/diary-toolbar";
import { CalorieValue } from "@/components/gentle";
import { Button } from "@/components/ui/button";
import { getDayData, getSession } from "@/lib/data";
import { addDays, todayISO } from "@/lib/utils";

export const metadata: Metadata = { title: "Diary" };

export default async function DiaryPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { supabase, userId, profile } = await getSession();
  const params = await searchParams;
  const today = todayISO(profile.timezone);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(params.date ?? "") ? params.date! : today;
  const day = await getDayData(supabase, userId, date);

  const label =
    date === today
      ? "Today"
      : new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
        });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Diary</h1>
        <div className="flex items-center gap-1">
          <Link href={`/diary?date=${addDays(date, -1)}`}>
            <Button variant="ghost" size="icon" aria-label="Previous day">
              <ChevronLeft />
            </Button>
          </Link>
          <span className="min-w-24 text-center text-sm font-medium">{label}</span>
          <Link href={`/diary?date=${addDays(date, 1)}`}>
            <Button variant="ghost" size="icon" aria-label="Next day">
              <ChevronRight />
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 text-sm">
        <span className="text-muted-foreground">Day total</span>
        <span className="font-semibold">
          <CalorieValue
            value={day.totals.calories}
            target={profile.calorie_target}
          />
        </span>
      </div>

      <DiaryToolbar date={date} />

      <DiaryList date={date} entries={day.entries} />
    </div>
  );
}
