"use client";

import * as React from "react";
import Link from "next/link";
import { Droplets, Flame, Leaf, Plus } from "lucide-react";
import { addWater } from "@/lib/actions/diary";
import { calorieStatusLabel } from "@/lib/nutrition";
import { qualityLabel } from "@/lib/quality-score";
import type { Nutrients, QualityScoreRow, StreakRow } from "@/lib/types";
import { CalorieValue, useGentle } from "@/components/gentle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

/* ------------------------------------------------------------------ */
/* Food Quality Score — the headline metric, above the calorie ring.   */
/* ------------------------------------------------------------------ */

export function QualityScoreCard({ quality }: { quality: QualityScoreRow | null }) {
  const overall = quality ? Math.round(Number(quality.overall)) : 0;
  const components = [
    { label: "Whole foods", value: quality ? Math.round(Number(quality.whole_food_pct)) : 0 },
    { label: "Protein", value: quality ? Math.round(Number(quality.protein_adequacy)) : 0 },
    {
      label: "Fiber",
      value: quality ? Math.min(100, Math.round((Number(quality.fiber_g) / 30) * 100)) : 0,
    },
    { label: "Micros", value: quality ? Math.round(Number(quality.micro_coverage_pct)) : 0 },
  ];

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary-soft/60 to-card">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Leaf className="size-5 text-primary" /> Food Quality
          </CardTitle>
          <CardDescription>{qualityLabel(overall)}</CardDescription>
        </div>
        <ScoreRing value={overall} />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
          {components.map((c) => (
            <div key={c.label}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{c.label}</span>
                <span className="font-medium">{c.value}%</span>
              </div>
              <Progress value={c.value} aria-label={c.label} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ScoreRing({ value }: { value: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" role="img" aria-label={`Quality score ${value} out of 100`}>
      <circle cx="36" cy="36" r={r} fill="none" stroke="var(--muted)" strokeWidth="7" />
      <circle
        cx="36"
        cy="36"
        r={r}
        fill="none"
        stroke="var(--primary)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={`${(value / 100) * c} ${c}`}
        transform="rotate(-90 36 36)"
      />
      <text
        x="36"
        y="41"
        textAnchor="middle"
        className="fill-foreground text-lg font-bold"
        style={{ fontSize: 18 }}
      >
        {value}
      </text>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Calorie ring — replaced by a qualitative balance wheel in Gentle    */
/* Mode. No numeral renders while gentle is on.                        */
/* ------------------------------------------------------------------ */

export function EnergyCard({
  totals,
  target,
  exerciseLow,
  exerciseHigh,
  caloriesBack,
}: {
  totals: Nutrients;
  target: number | null;
  exerciseLow: number;
  exerciseHigh: number;
  caloriesBack: boolean;
}) {
  const gentle = useGentle();
  const effectiveTarget =
    target !== null && caloriesBack ? target + exerciseLow : target;

  if (gentle) return <BalanceWheel totals={totals} />;

  const consumed = Math.round(totals.calories);
  const pct = effectiveTarget ? Math.min(100, (consumed / effectiveTarget) * 100) : 0;
  const status = effectiveTarget ? calorieStatusLabel(consumed, effectiveTarget) : "";

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Flame className="size-5 text-primary" /> Energy
          </CardTitle>
          <CardDescription>
            {effectiveTarget ? (
              <>
                {consumed.toLocaleString()} of {effectiveTarget.toLocaleString()} kcal —{" "}
                {status}
              </>
            ) : (
              "No target set"
            )}
          </CardDescription>
        </div>
        <ScoreRing value={Math.round(pct)} />
      </CardHeader>
      {exerciseLow > 0 ? (
        <CardContent className="text-xs text-muted-foreground">
          Exercise today: ~{exerciseLow.toLocaleString()}–{exerciseHigh.toLocaleString()} kcal.{" "}
          {caloriesBack
            ? "The low end has been added to your budget (you can turn this off in Settings)."
            : "Not added to your budget — your setting keeps the estimate honest."}
        </CardContent>
      ) : null}
    </Card>
  );
}

/** Gentle Mode replacement: color-coded nutrient balance, zero numerals. */
function BalanceWheel({ totals }: { totals: Nutrients }) {
  const totalMacros = totals.protein_g + totals.carbs_g + totals.fat_g;
  const segments =
    totalMacros > 0
      ? [
          { label: "Protein", frac: totals.protein_g / totalMacros, color: "var(--chart-1)" },
          { label: "Carbs", frac: totals.carbs_g / totalMacros, color: "var(--chart-3)" },
          { label: "Fat", frac: totals.fat_g / totalMacros, color: "var(--chart-4)" },
        ]
      : [];

  const balanceNote = (() => {
    if (totalMacros === 0) return "Log a meal and this wheel will fill with your balance.";
    const proteinFrac = totals.protein_g / totalMacros;
    if (proteinFrac >= 0.25) return "Nicely protein-anchored today.";
    if (totals.fiber_g >= 15) return "Lovely fiber intake so far.";
    return "A balanced spread — keep listening to your appetite.";
  })();

  let offset = 0;
  const r = 26;
  const c = 2 * Math.PI * r;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Flame className="size-5 text-primary" /> Balance
          </CardTitle>
          <CardDescription>{balanceNote}</CardDescription>
        </div>
        <svg width="72" height="72" viewBox="0 0 72 72" role="img" aria-label="Nutrient balance wheel">
          <circle cx="36" cy="36" r={r} fill="none" stroke="var(--muted)" strokeWidth="7" />
          {segments.map((s) => {
            const dash = s.frac * c;
            const el = (
              <circle
                key={s.label}
                cx="36"
                cy="36"
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth="7"
                strokeDasharray={`${dash} ${c}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 36 36)"
              />
            );
            offset += dash;
            return el;
          })}
        </svg>
      </CardHeader>
      <CardContent className="flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ background: "var(--chart-1)" }} /> Protein
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ background: "var(--chart-3)" }} /> Carbs
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ background: "var(--chart-4)" }} /> Fat
        </span>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */

export function MacroBars({
  totals,
  proteinTarget,
}: {
  totals: Nutrients;
  proteinTarget: number | null;
}) {
  const gentle = useGentle();
  const rows = [
    {
      label: "Protein",
      value: totals.protein_g,
      target: proteinTarget ?? 100,
      unit: "g",
    },
    { label: "Fiber", value: totals.fiber_g, target: 30, unit: "g" },
    { label: "Carbs", value: totals.carbs_g, target: null, unit: "g" },
    { label: "Fat", value: totals.fat_g, target: null, unit: "g" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nutrients</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.map((row) => {
          const pct = row.target ? Math.min(100, (row.value / row.target) * 100) : null;
          return (
            <div key={row.label}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span>{row.label}</span>
                <span className="text-muted-foreground">
                  {gentle ? (
                    pct === null ? "logged" : pct >= 90 ? "plenty" : pct >= 50 ? "on the way" : "room for more"
                  ) : (
                    <>
                      {Math.round(row.value)}
                      {row.target ? ` / ${row.target}` : ""} {row.unit}
                    </>
                  )}
                </span>
              </div>
              <Progress
                value={pct ?? (row.value > 0 ? 100 : 0)}
                aria-label={row.label}
                barClassName={pct === null ? "bg-chart-3" : undefined}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export function WeeklyAverageCard({
  avgCalories,
  avgProtein,
  avgFiber,
  avgQuality,
  days,
  target,
}: {
  avgCalories: number;
  avgProtein: number;
  avgFiber: number;
  avgQuality: number;
  days: number;
  target: number | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>This week, on average</CardTitle>
        <CardDescription>
          {days > 0
            ? `Across ${days} logged ${days === 1 ? "day" : "days"} — weekly patterns matter more than any single day.`
            : "Log a few days and your weekly picture will appear here."}
        </CardDescription>
      </CardHeader>
      {days > 0 ? (
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Energy</p>
            <p className="font-semibold">
              <CalorieValue value={avgCalories} target={target} suffix=" kcal" />
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Protein</p>
            <p className="font-semibold">{avgProtein} g</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Fiber</p>
            <p className="font-semibold">{avgFiber} g</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Quality</p>
            <p className="font-semibold">{avgQuality}/100</p>
          </div>
        </CardContent>
      ) : null}
    </Card>
  );
}

export function WaterCard({ date, waterMl }: { date: string; waterMl: number }) {
  const [pending, startTransition] = React.useTransition();
  const glasses = Math.round(waterMl / 250);
  const targetMl = 2000;

  const add = (ml: number) =>
    startTransition(async () => {
      await addWater({ date, ml });
    });

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="size-5 text-chart-3" /> Water
          </CardTitle>
          <CardDescription>
            {waterMl > 0
              ? `${(waterMl / 1000).toFixed(1)} L today (${glasses} ${glasses === 1 ? "glass" : "glasses"})`
              : "Nothing logged yet today"}
          </CardDescription>
        </div>
        <div className="flex gap-1.5">
          <Button size="sm" variant="secondary" disabled={pending} onClick={() => add(250)}>
            <Plus /> Glass
          </Button>
          <Button size="sm" variant="secondary" disabled={pending} onClick={() => add(500)}>
            <Plus /> Bottle
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Progress value={(waterMl / targetMl) * 100} aria-label="Water" barClassName="bg-chart-3" />
      </CardContent>
    </Card>
  );
}

export function StreakCard({ streak }: { streak: StreakRow | null }) {
  const current = streak?.current_streak ?? 0;
  const longest = streak?.longest_streak ?? 0;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Logging streak</CardTitle>
        <CardDescription>
          Counts days you showed up and logged — never whether you hit a number.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-baseline gap-6">
        <div>
          <p className="text-3xl font-bold text-primary">{current}</p>
          <p className="text-xs text-muted-foreground">
            {current === 1 ? "day" : "days"} current
          </p>
        </div>
        <div>
          <p className="text-3xl font-bold">{longest}</p>
          <p className="text-xs text-muted-foreground">best ever</p>
        </div>
        {current === 0 ? (
          <Link href="/diary" className="ml-auto self-center">
            <Button size="sm">Log something</Button>
          </Link>
        ) : null}
      </CardContent>
    </Card>
  );
}
