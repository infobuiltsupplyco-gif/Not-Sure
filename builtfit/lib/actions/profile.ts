"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser, fail, OK, type ActionResult } from "@/lib/actions/helpers";
import { CALORIE_FLOOR, computeTargets, ageFromDob } from "@/lib/nutrition";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const onboardingSchema = z.object({
  display_name: z.string().min(1).max(60),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sex: z.enum(["male", "female"]),
  height_cm: z.number().min(90).max(260),
  weight_kg: z.number().min(25).max(400),
  activity_level: z.enum(["sedentary", "light", "moderate", "active", "very_active"]),
  goal_type: z.enum(["lose", "maintain", "gain"]),
  goal_rate: z.union([z.literal(0.25), z.literal(0.5), z.literal(0.75)]),
  gentle_mode: z.boolean(),
  units: z.enum(["metric", "imperial"]),
  timezone: z.string().max(64),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;

export async function completeOnboarding(input: OnboardingInput): Promise<ActionResult> {
  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Check your details");
  const { supabase, user } = await requireUser();
  const d = parsed.data;

  const age = ageFromDob(d.dob);
  if (age < 18) {
    return fail(
      "BuiltFit's targets are designed for adults (18+). We'd rather be honest than guess — please talk to a healthcare professional about nutrition guidance for your age."
    );
  }
  if (age > 120) return fail("Please double-check your date of birth.");

  const targets = computeTargets({
    sex: d.sex,
    weightKg: d.weight_kg,
    heightCm: d.height_cm,
    ageYears: age,
    activityLevel: d.activity_level,
    goalType: d.goal_type,
    goalRate: d.goal_rate,
  });

  const { error } = await supabase
    .from("profiles")
    .upsert(
      {
        user_id: user.id,
        display_name: d.display_name,
        dob: d.dob,
        sex: d.sex,
        height_cm: d.height_cm,
        weight_kg: d.weight_kg,
        activity_level: d.activity_level,
        goal_type: d.goal_type,
        goal_rate: d.goal_rate,
        gentle_mode: d.gentle_mode,
        units: d.units,
        timezone: d.timezone,
        calorie_target: targets.calorieTarget,
        protein_target_g: targets.proteinTargetG,
        onboarded: true,
      },
      { onConflict: "user_id" }
    );
  if (error) return fail(error.message);

  // Seed the first weight log so progress charts start immediately.
  await supabase.from("weight_logs").upsert(
    {
      user_id: user.id,
      date: new Date().toISOString().slice(0, 10),
      weight_kg: d.weight_kg,
    },
    { onConflict: "user_id,date" }
  );

  revalidatePath("/", "layout");
  return OK;
}

const settingsSchema = z.object({
  display_name: z.string().min(1).max(60).optional(),
  gentle_mode: z.boolean().optional(),
  exercise_calories_back: z.boolean().optional(),
  units: z.enum(["metric", "imperial"]).optional(),
  goal_type: z.enum(["lose", "maintain", "gain"]).optional(),
  goal_rate: z.union([z.literal(0.25), z.literal(0.5), z.literal(0.75)]).optional(),
  activity_level: z
    .enum(["sedentary", "light", "moderate", "active", "very_active"])
    .optional(),
  weight_kg: z.number().min(25).max(400).optional(),
  calorie_target: z.number().int().max(10000).optional(),
});

export interface SettingsResult {
  ok: boolean;
  error?: string;
  /** Set when a requested calorie target was below the safety floor. */
  floorApplied?: boolean;
}

export async function updateSettings(
  input: z.infer<typeof settingsSchema>
): Promise<SettingsResult> {
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid settings" };
  }
  const { supabase, user } = await requireUser();
  const d = { ...parsed.data };

  // Safety floor: never store a target below 1200 kcal. Instead of an error
  // we clamp and tell the user supportively — the DB constraint backs this up.
  let floorApplied = false;
  if (d.calorie_target !== undefined && d.calorie_target < CALORIE_FLOOR) {
    d.calorie_target = CALORIE_FLOOR;
    floorApplied = true;
  }

  // If goal parameters changed, recompute the calorie target honestly.
  if (d.goal_type || d.goal_rate || d.activity_level || d.weight_kg) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("sex, dob, height_cm, weight_kg, activity_level, goal_type, goal_rate")
      .eq("user_id", user.id)
      .maybeSingle();
    if (profile?.sex && profile.dob && profile.height_cm) {
      const targets = computeTargets({
        sex: profile.sex,
        weightKg: d.weight_kg ?? Number(profile.weight_kg),
        heightCm: Number(profile.height_cm),
        ageYears: ageFromDob(profile.dob),
        activityLevel: d.activity_level ?? profile.activity_level,
        goalType: d.goal_type ?? profile.goal_type,
        goalRate: d.goal_rate ?? Number(profile.goal_rate),
      });
      d.calorie_target = targets.calorieTarget;
      floorApplied = targets.clampedToFloor;
    }
  }

  const { error } = await supabase.from("profiles").update(d).eq("user_id", user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/", "layout");
  return { ok: true, floorApplied };
}

/**
 * Real account deletion: removes the auth user, which cascades through every
 * table via foreign keys, plus stored progress photos.
 */
export async function deleteAccount(): Promise<ActionResult> {
  const { supabase, user } = await requireUser();

  if (!hasServiceRole()) {
    return fail(
      "Account deletion requires the server to be configured with a Supabase service-role key. Contact support or the operator of this instance."
    );
  }

  const admin = createAdminClient();

  // Remove progress photos from storage first (no cascade for storage objects).
  const { data: photos } = await supabase
    .from("progress_photos")
    .select("storage_path")
    .eq("user_id", user.id);
  if (photos && photos.length > 0) {
    await admin.storage
      .from("progress-photos")
      .remove(photos.map((p) => p.storage_path as string));
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return fail(error.message);

  const client = await createClient();
  await client.auth.signOut();
  redirect("/");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
