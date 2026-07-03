"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Download, LogOut, Trash2 } from "lucide-react";
import { deleteAccount, signOut, updateSettings } from "@/lib/actions/profile";
import { CALORIE_FLOOR } from "@/lib/nutrition";
import type { ActivityLevel, GoalType, ProfileRow, Units } from "@/lib/types";
import { ACTIVITY_LABELS, GOAL_RATES } from "@/lib/nutrition";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const EXPORT_KINDS = ["diary", "weight", "measurements", "exercise", "water", "quality"];

export function SettingsForm({ profile }: { profile: ProfileRow }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [message, setMessage] = React.useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const [displayName, setDisplayName] = React.useState(profile.display_name ?? "");
  const [gentle, setGentle] = React.useState(profile.gentle_mode);
  const [caloriesBack, setCaloriesBack] = React.useState(profile.exercise_calories_back);
  const [units, setUnits] = React.useState<Units>(profile.units);
  const [goalType, setGoalType] = React.useState<GoalType>(profile.goal_type);
  const [goalRate, setGoalRate] = React.useState(Number(profile.goal_rate));
  const [activity, setActivity] = React.useState<ActivityLevel>(profile.activity_level);

  const save = (input: Parameters<typeof updateSettings>[0], note = "Saved.") =>
    startTransition(async () => {
      setMessage(null);
      const result = await updateSettings(input);
      if (!result.ok) {
        setMessage(result.error ?? "Something went wrong");
        return;
      }
      setMessage(
        result.floorApplied
          ? `Saved — your target was adjusted up to ${CALORIE_FLOOR.toLocaleString()} kcal/day. We don't set targets below that; if you feel you need less, please talk to a dietitian or doctor. You matter more than a number.`
          : note
      );
      router.refresh();
    });

  return (
    <div className="space-y-4">
      {message ? (
        <p className="rounded-md bg-primary-soft p-3 text-sm">{message}</p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="st-name">Display name</Label>
            <div className="flex gap-2">
              <Input
                id="st-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
              <Button
                variant="secondary"
                disabled={pending || !displayName.trim()}
                onClick={() => save({ display_name: displayName.trim() })}
              >
                Save
              </Button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="st-units">Units</Label>
            <Select
              id="st-units"
              value={units}
              onChange={(e) => {
                const next = e.target.value as Units;
                setUnits(next);
                save({ units: next });
              }}
            >
              <option value="metric">Metric (kg, cm)</option>
              <option value="imperial">Imperial (lb, ft/in)</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Wellbeing</CardTitle>
          <CardDescription>These switches exist so the app fits you, not the other way around.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Gentle Mode</p>
              <p className="text-xs text-muted-foreground">
                Hides every calorie number app-wide and shows qualitative feedback instead.
              </p>
            </div>
            <Switch
              checked={gentle}
              onCheckedChange={(v) => {
                setGentle(v);
                save({ gentle_mode: v }, v ? "Gentle Mode is on. Numbers off, kindness on." : "Gentle Mode is off.");
              }}
              aria-label="Gentle Mode"
            />
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Add exercise calories back</p>
              <p className="text-xs text-muted-foreground">
                Off by default. When on, only the LOW end of the burn range is added to
                your budget — estimates are ranges, not rewards.
              </p>
            </div>
            <Switch
              checked={caloriesBack}
              onCheckedChange={(v) => {
                setCaloriesBack(v);
                save({ exercise_calories_back: v });
              }}
              aria-label="Add exercise calories back"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Goals</CardTitle>
          <CardDescription>
            Changing these recalculates your target with the Mifflin-St Jeor equation.
            Targets never go below {CALORIE_FLOOR.toLocaleString()} kcal/day.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="st-goal">Goal</Label>
            <Select
              id="st-goal"
              value={goalType}
              onChange={(e) => {
                const next = e.target.value as GoalType;
                setGoalType(next);
                save({ goal_type: next });
              }}
            >
              <option value="lose">Lose gently</option>
              <option value="maintain">Maintain</option>
              <option value="gain">Gain gradually</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="st-rate">Weekly rate</Label>
            <Select
              id="st-rate"
              value={goalRate}
              onChange={(e) => {
                const next = Number(e.target.value) as 0.25 | 0.5 | 0.75;
                setGoalRate(next);
                save({ goal_rate: next });
              }}
            >
              {GOAL_RATES.map((r) => (
                <option key={r} value={r}>
                  {r} kg / week
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="st-activity">Activity</Label>
            <Select
              id="st-activity"
              value={activity}
              onChange={(e) => {
                const next = e.target.value as ActivityLevel;
                setActivity(next);
                save({ activity_level: next });
              }}
            >
              {Object.entries(ACTIVITY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <p className="text-xs text-muted-foreground sm:col-span-3">
            Current daily target:{" "}
            <span className="font-medium text-foreground">
              {gentle
                ? "hidden while Gentle Mode is on"
                : `${profile.calorie_target?.toLocaleString() ?? "—"} kcal · ${profile.protein_target_g ?? "—"} g protein`}
            </span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your data</CardTitle>
          <CardDescription>
            Export everything as CSV, free, forever. It&apos;s your data — we just hold it
            for you.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {EXPORT_KINDS.map((kind) => (
            <a key={kind} href={`/api/export?kind=${kind}`} download>
              <Button variant="outline" size="sm" className="w-full capitalize">
                <Download /> {kind}
              </Button>
            </a>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="secondary"
            onClick={() => startTransition(async () => signOut())}
            disabled={pending}
          >
            <LogOut /> Sign out
          </Button>
          <Button variant="destructive" onClick={() => setDeleteOpen(true)} disabled={pending}>
            <Trash2 /> Delete account & all data
          </Button>
        </CardContent>
      </Card>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogTitle>Delete your account?</DialogTitle>
        <DialogDescription>
          This permanently deletes your account, diary, recipes, photos, and every
          other record — a real deletion, not a soft hide. Consider exporting your
          CSVs first. This cannot be undone.
        </DialogDescription>
        <div className="mt-4 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => setDeleteOpen(false)}>
            Keep my account
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await deleteAccount();
                // Only returns on failure — success redirects.
                if (result && !result.ok) {
                  setMessage(result.error);
                  setDeleteOpen(false);
                }
              })
            }
          >
            {pending ? "Deleting…" : "Delete everything"}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
