"use client";

import * as React from "react";
import Link from "next/link";
import { BadgeCheck, Trash2 } from "lucide-react";
import { deleteDiaryEntry } from "@/lib/actions/diary";
import type { DiaryEntryRow, Meal } from "@/lib/types";
import { CalorieValue } from "@/components/gentle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const MEALS: { key: Meal; label: string }[] = [
  { key: "breakfast", label: "Breakfast" },
  { key: "lunch", label: "Lunch" },
  { key: "dinner", label: "Dinner" },
  { key: "snack", label: "Snacks" },
];

export function DiaryList({
  date,
  entries,
  compact = false,
}: {
  date: string;
  entries: DiaryEntryRow[];
  compact?: boolean;
}) {
  const [pending, startTransition] = React.useTransition();

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            Nothing logged {compact ? "yet today" : "on this day"}. A single entry is a
            great start — your streak counts showing up, not perfection.
          </p>
          <Link href={`/foods/search?date=${date}`}>
            <Button size="sm">Add your first food</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {MEALS.map(({ key, label }) => {
        const mealEntries = entries.filter((e) => e.meal === key);
        if (mealEntries.length === 0 && compact) return null;
        const mealCals = mealEntries.reduce((s, e) => s + e.nutrition.calories, 0);
        return (
          <Card key={key}>
            <CardContent className="pt-4 sm:pt-5">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold">{label}</h3>
                <div className="flex items-center gap-3">
                  {mealEntries.length > 0 ? (
                    <span className="text-xs text-muted-foreground">
                      <CalorieValue value={mealCals} gentleText="" />
                    </span>
                  ) : null}
                  <Link
                    href={`/foods/search?date=${date}&meal=${key}`}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    + Add
                  </Link>
                </div>
              </div>
              {mealEntries.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nothing yet.</p>
              ) : (
                <ul className="divide-y">
                  {mealEntries.map((entry) => (
                    <li key={entry.id} className="flex items-center gap-3 py-2">
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1.5 truncate text-sm">
                          {entry.food_name}
                          {entry.verified ? (
                            <BadgeCheck className="size-3.5 shrink-0 text-primary" aria-label="Verified" />
                          ) : (
                            <Badge variant="unverified" className="shrink-0 text-[10px]">
                              unverified
                            </Badge>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {entry.quantity} × {entry.serving_label}
                          {entry.food_brand ? ` · ${entry.food_brand}` : ""}
                        </p>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        <CalorieValue value={entry.nutrition.calories} gentleText="✓" />
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground"
                        aria-label={`Remove ${entry.food_name}`}
                        disabled={pending}
                        onClick={() =>
                          startTransition(async () => {
                            await deleteDiaryEntry(entry.id, date);
                          })
                        }
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
