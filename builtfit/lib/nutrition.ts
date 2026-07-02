import type { ActivityLevel, GoalType, Sex } from "@/lib/types";

/**
 * Hard safety floor for adult calorie targets. BuiltFit never sets or accepts
 * a goal below this, per the wellbeing-first North Star principle.
 */
export const CALORIE_FLOOR = 1200;

/** Max conservative rate options, kg/week. Nothing more aggressive is offered. */
export const GOAL_RATES = [0.25, 0.5, 0.75] as const;

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Sedentary (desk job, little exercise)",
  light: "Lightly active (1–3 workouts/week)",
  moderate: "Moderately active (3–5 workouts/week)",
  active: "Active (6–7 workouts/week)",
  very_active: "Very active (physical job + training)",
};

export function ageFromDob(dobISO: string): number {
  const dob = new Date(dobISO);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age -= 1;
  return age;
}

/**
 * Mifflin-St Jeor resting metabolic rate. This is the equation we show and
 * explain to users during onboarding — no black box.
 */
export function mifflinStJeor(
  sex: Sex,
  weightKg: number,
  heightCm: number,
  ageYears: number
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  return Math.round(sex === "male" ? base + 5 : base - 161);
}

export interface TargetInput {
  sex: Sex;
  weightKg: number;
  heightCm: number;
  ageYears: number;
  activityLevel: ActivityLevel;
  goalType: GoalType;
  /** kg per week; only conservative values are offered. */
  goalRate: number;
}

export interface TargetResult {
  bmr: number;
  tdee: number;
  calorieTarget: number;
  /** True if the raw target fell below the safety floor and was clamped. */
  clampedToFloor: boolean;
  proteinTargetG: number;
  fiberTargetG: number;
}

/**
 * Compute a daily calorie + protein target. 1 kg of body mass ≈ 7700 kcal, so
 * a weekly rate maps to a daily adjustment of rate * 7700 / 7 = rate * 1100.
 * The result is always clamped to the CALORIE_FLOOR.
 */
export function computeTargets(input: TargetInput): TargetResult {
  const bmr = mifflinStJeor(
    input.sex,
    input.weightKg,
    input.heightCm,
    input.ageYears
  );
  const tdee = Math.round(bmr * ACTIVITY_MULTIPLIERS[input.activityLevel]);
  const dailyDelta = Math.round(input.goalRate * 1100);
  let target = tdee;
  if (input.goalType === "lose") target = tdee - dailyDelta;
  if (input.goalType === "gain") target = tdee + dailyDelta;

  const clampedToFloor = target < CALORIE_FLOOR;
  if (clampedToFloor) target = CALORIE_FLOOR;

  // 1.6 g/kg is a well-supported protein intake for body-composition goals.
  const proteinTargetG = Math.round(input.weightKg * 1.6);
  const fiberTargetG = input.sex === "male" ? 38 : 25;

  return {
    bmr,
    tdee,
    calorieTarget: target,
    clampedToFloor,
    proteinTargetG,
    fiberTargetG,
  };
}

/** Neutral, non-shaming language for calorie position vs target. */
export function calorieStatusLabel(consumed: number, target: number): string {
  const diff = consumed - target;
  if (diff > 25) return "above target";
  if (diff < -25) return "below target";
  return "on target";
}
