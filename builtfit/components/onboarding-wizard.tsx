"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { HeartHandshake, Info, Sparkles } from "lucide-react";
import { completeOnboarding, type OnboardingInput } from "@/lib/actions/profile";
import {
  ACTIVITY_LABELS,
  CALORIE_FLOOR,
  GOAL_RATES,
  ageFromDob,
  computeTargets,
} from "@/lib/nutrition";
import type { ActivityLevel, GoalType, Sex, Units } from "@/lib/types";
import { ftInToCm, kgToLb, lbToKg, round } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

type Step = 0 | 1 | 2;

export function OnboardingWizard({ initialName }: { initialName: string }) {
  const router = useRouter();
  const [step, setStep] = React.useState<Step>(0);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [name, setName] = React.useState(initialName);
  const [dob, setDob] = React.useState("");
  const [sex, setSex] = React.useState<Sex>("female");
  const [units, setUnits] = React.useState<Units>("metric");
  const [heightCm, setHeightCm] = React.useState(170);
  const [weightKg, setWeightKg] = React.useState(70);
  const [activity, setActivity] = React.useState<ActivityLevel>("light");
  const [goalType, setGoalType] = React.useState<GoalType>("maintain");
  const [goalRate, setGoalRate] = React.useState<0.25 | 0.5 | 0.75>(0.25);
  const [gentleMode, setGentleMode] = React.useState(false);

  const age = dob ? ageFromDob(dob) : null;
  const preview =
    age !== null && age >= 18 && age <= 120
      ? computeTargets({
          sex,
          weightKg,
          heightCm,
          ageYears: age,
          activityLevel: activity,
          goalType,
          goalRate,
        })
      : null;

  const stepOneValid = name.trim().length > 0 && dob !== "" && heightCm > 0 && weightKg > 0;

  const submit = async () => {
    setBusy(true);
    setError(null);
    const input: OnboardingInput = {
      display_name: name.trim(),
      dob,
      sex,
      height_cm: heightCm,
      weight_kg: weightKg,
      activity_level: activity,
      goal_type: goalType,
      goal_rate: goalRate,
      gentle_mode: gentleMode,
      units,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC",
    };
    const result = await completeOnboarding(input);
    if (!result.ok) {
      setError(result.error);
      setBusy(false);
      return;
    }
    router.push("/dashboard");
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-6 py-10">
      <div className="mb-6 flex items-center justify-center gap-2">
        <Sparkles className="size-6 text-primary" />
        <span className="text-xl font-bold">BuiltFit</span>
      </div>
      <div className="mb-4 flex gap-1.5" aria-label={`Step ${step + 1} of 3`}>
        {[0, 1, 2].map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full ${s <= step ? "bg-primary" : "bg-muted"}`}
          />
        ))}
      </div>

      {step === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>About you</CardTitle>
            <CardDescription>
              We use this only to calculate your energy needs. Nothing here is shared.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="dob">Date of birth</Label>
                <Input id="dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sex">Sex (for the formula)</Label>
                <Select id="sex" value={sex} onChange={(e) => setSex(e.target.value as Sex)}>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="units">Units</Label>
              <Select
                id="units"
                value={units}
                onChange={(e) => setUnits(e.target.value as Units)}
              >
                <option value="metric">Metric (kg, cm)</option>
                <option value="imperial">Imperial (lb, ft/in)</option>
              </Select>
            </div>
            {units === "metric" ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    min={90}
                    max={260}
                    value={heightCm}
                    onChange={(e) => setHeightCm(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    min={25}
                    max={400}
                    step={0.1}
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                  />
                </div>
              </div>
            ) : (
              <ImperialInputs
                heightCm={heightCm}
                weightKg={weightKg}
                onHeight={setHeightCm}
                onWeight={setWeightKg}
              />
            )}
            <Button className="w-full" disabled={!stepOneValid} onClick={() => setStep(1)}>
              Continue
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {step === 1 ? (
        <Card>
          <CardHeader>
            <CardTitle>Your goal</CardTitle>
            <CardDescription>
              Only sustainable rates are offered — crash targets don&apos;t last and we
              won&apos;t pretend they do.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="activity">Activity level</Label>
              <Select
                id="activity"
                value={activity}
                onChange={(e) => setActivity(e.target.value as ActivityLevel)}
              >
                {Object.entries(ACTIVITY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="goal">Goal</Label>
              <Select
                id="goal"
                value={goalType}
                onChange={(e) => setGoalType(e.target.value as GoalType)}
              >
                <option value="lose">Lose weight gently</option>
                <option value="maintain">Maintain</option>
                <option value="gain">Gain weight gradually</option>
              </Select>
            </div>
            {goalType !== "maintain" ? (
              <div className="space-y-1.5">
                <Label htmlFor="rate">Weekly rate</Label>
                <Select
                  id="rate"
                  value={goalRate}
                  onChange={(e) => setGoalRate(Number(e.target.value) as 0.25 | 0.5 | 0.75)}
                >
                  {GOAL_RATES.map((r) => (
                    <option key={r} value={r}>
                      {units === "metric" ? `${r} kg / week` : `${round(kgToLb(r), 1)} lb / week`}
                      {r === 0.25 ? " (recommended)" : ""}
                    </option>
                  ))}
                </Select>
              </div>
            ) : null}

            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              <p className="mb-1 flex items-center gap-1.5 font-medium">
                <Info className="size-4 text-primary" /> How we calculate this
              </p>
              <p className="text-muted-foreground">
                We use the Mifflin-St Jeor equation — the same one dietitians use — to
                estimate your resting metabolism from your height, weight, age, and sex,
                then multiply by your activity level. It&apos;s an estimate, not a verdict:
                real needs vary ±10% or more.
              </p>
              {preview ? (
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Resting</p>
                    <p className="font-semibold">{preview.bmr.toLocaleString()} kcal</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Maintenance</p>
                    <p className="font-semibold">{preview.tdee.toLocaleString()} kcal</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Daily target</p>
                    <p className="font-semibold text-primary">
                      {preview.calorieTarget.toLocaleString()} kcal
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">
                  Fill in your date of birth on the previous step to see your numbers.
                </p>
              )}
              {preview?.clampedToFloor ? (
                <p className="mt-3 rounded-md bg-primary-soft p-2 text-xs">
                  Your selected rate would put you below {CALORIE_FLOOR.toLocaleString()}{" "}
                  kcal/day, which isn&apos;t something we&apos;ll set — eating enough matters
                  more than losing fast. We&apos;ve set your target to the minimum instead.
                  If you feel you need a lower target, please talk to a registered
                  dietitian or doctor first.
                </p>
              ) : null}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(0)}>
                Back
              </Button>
              <Button className="flex-1" onClick={() => setStep(2)} disabled={!preview}>
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {step === 2 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HeartHandshake className="size-5 text-primary" /> How do you want numbers
              to feel?
            </CardTitle>
            <CardDescription>
              You can change this anytime in Settings — no judgment either way.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between gap-4 rounded-md border p-4">
              <div>
                <p className="font-medium">Gentle Mode</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Hides all calorie numbers across the app and shows qualitative feedback
                  instead — nutrient balance colors, consistency streaks, and food quality.
                  Great if numbers tend to take up more headspace than they deserve.
                </p>
              </div>
              <Switch checked={gentleMode} onCheckedChange={setGentleMode} aria-label="Gentle Mode" />
            </div>
            <div className="rounded-md border bg-muted/40 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Two defaults worth knowing</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>
                  Exercise calories are <span className="font-medium">not</span> added back to
                  your daily budget by default — burn estimates are ranges, not promises.
                </li>
                <li>
                  Your streak counts days you <span className="font-medium">log</span>, never
                  whether you hit a number.
                </li>
              </ul>
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button className="flex-1" onClick={submit} disabled={busy}>
                {busy ? "Setting up…" : "Start tracking"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </main>
  );
}

function ImperialInputs({
  heightCm,
  weightKg,
  onHeight,
  onWeight,
}: {
  heightCm: number;
  weightKg: number;
  onHeight: (cm: number) => void;
  onWeight: (kg: number) => void;
}) {
  const totalIn = heightCm / 2.54;
  const ft = Math.floor(totalIn / 12);
  const inches = Math.round(totalIn - ft * 12);

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="space-y-1.5">
        <Label htmlFor="ft">Height (ft)</Label>
        <Input
          id="ft"
          type="number"
          min={3}
          max={8}
          value={ft}
          onChange={(e) => onHeight(ftInToCm(Number(e.target.value), inches))}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="in">(in)</Label>
        <Input
          id="in"
          type="number"
          min={0}
          max={11}
          value={inches}
          onChange={(e) => onHeight(ftInToCm(ft, Number(e.target.value)))}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="lb">Weight (lb)</Label>
        <Input
          id="lb"
          type="number"
          min={55}
          max={880}
          value={round(kgToLb(weightKg), 1)}
          onChange={(e) => onWeight(round(lbToKg(Number(e.target.value)), 1))}
        />
      </div>
    </div>
  );
}
