"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Info, Trash2 } from "lucide-react";
import { addExerciseEntry, deleteExerciseEntry } from "@/lib/actions/exercise";
import { ACTIVITIES, computeBurnRange } from "@/lib/mets";
import type { ExerciseEntryRow } from "@/lib/types";
import { HideInGentle } from "@/components/gentle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const CATEGORIES = [...new Set(ACTIVITIES.map((a) => a.category))];

export function ExerciseForm({
  date,
  weightKg,
  caloriesBack,
}: {
  date: string;
  weightKg: number;
  caloriesBack: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [slug, setSlug] = React.useState(ACTIVITIES[0].slug);
  const [duration, setDuration] = React.useState("30");

  const activity = ACTIVITIES.find((a) => a.slug === slug) ?? ACTIVITIES[0];
  const mins = Math.max(0, Number(duration) || 0);
  const burn = mins > 0 ? computeBurnRange(activity.met, weightKg, mins) : null;

  const submit = () =>
    startTransition(async () => {
      setError(null);
      const result = await addExerciseEntry({
        date,
        activitySlug: slug,
        durationMin: mins,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log activity</CardTitle>
        <CardDescription>
          Estimates use the Compendium of Physical Activities (MET values) and are
          shown as a range — burn math is honest here, not motivational.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="ex-activity">Activity</Label>
            <Select id="ex-activity" value={slug} onChange={(e) => setSlug(e.target.value)}>
              {CATEGORIES.map((cat) => (
                <optgroup key={cat} label={cat}>
                  {ACTIVITIES.filter((a) => a.category === cat).map((a) => (
                    <option key={a.slug} value={a.slug}>
                      {a.name} ({a.met} MET)
                    </option>
                  ))}
                </optgroup>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ex-duration">Minutes</Label>
            <Input
              id="ex-duration"
              type="number"
              min={1}
              max={1440}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>
        </div>
        <HideInGentle>
          {burn ? (
            <div className="flex items-start gap-2 rounded-md bg-muted/50 p-3 text-sm">
              <Info className="mt-0.5 size-4 shrink-0 text-primary" />
              <p>
                Estimated burn:{" "}
                <span className="font-semibold">
                  {burn.low.toLocaleString()}–{burn.high.toLocaleString()} kcal
                </span>
                .{" "}
                <span className="text-muted-foreground">
                  {caloriesBack
                    ? "The low end will be added to your calorie budget."
                    : "Not added to your budget (your setting) — most apps overestimate this number."}
                </span>
              </p>
            </div>
          ) : null}
        </HideInGentle>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button className="w-full" disabled={pending || mins <= 0} onClick={submit}>
          {pending ? "Logging…" : "Log activity"}
        </Button>
      </CardContent>
    </Card>
  );
}

export function ExerciseList({ entries }: { entries: ExerciseEntryRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Nothing logged today. Movement counts even when it&apos;s not a workout.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-4 sm:pt-5">
        <ul className="divide-y">
          {entries.map((e) => (
            <li key={e.id} className="flex items-center gap-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{e.activity}</p>
                <p className="text-xs text-muted-foreground">
                  {e.duration_min} min · {Number(e.met_value)} MET
                </p>
              </div>
              <HideInGentle>
                <span className="text-sm text-muted-foreground">
                  {e.computed_burn_low.toLocaleString()}–{e.computed_burn_high.toLocaleString()} kcal
                </span>
              </HideInGentle>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground"
                aria-label={`Remove ${e.activity}`}
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await deleteExerciseEntry(e.id);
                    router.refresh();
                  })
                }
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
