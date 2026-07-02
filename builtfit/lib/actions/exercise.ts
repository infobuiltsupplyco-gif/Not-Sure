"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser, fail, OK, type ActionResult } from "@/lib/actions/helpers";
import { computeBurnRange, findActivity } from "@/lib/mets";

const addExerciseSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  activitySlug: z.string().min(1),
  durationMin: z.number().int().min(1).max(1440),
});

export async function addExerciseEntry(input: {
  date: string;
  activitySlug: string;
  durationMin: number;
}): Promise<ActionResult> {
  const parsed = addExerciseSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid entry");
  const { supabase, user } = await requireUser();

  const activity = findActivity(parsed.data.activitySlug);
  if (!activity) return fail("Unknown activity");

  const { data: profile } = await supabase
    .from("profiles")
    .select("weight_kg")
    .eq("user_id", user.id)
    .maybeSingle();
  const weightKg = Number(profile?.weight_kg ?? 70);

  const burn = computeBurnRange(activity.met, weightKg, parsed.data.durationMin);

  const { error } = await supabase.from("exercise_entries").insert({
    user_id: user.id,
    date: parsed.data.date,
    activity: activity.name,
    met_value: activity.met,
    duration_min: parsed.data.durationMin,
    computed_burn_low: burn.low,
    computed_burn_high: burn.high,
  });
  if (error) return fail(error.message);

  revalidatePath("/exercise");
  revalidatePath("/dashboard");
  return OK;
}

export async function deleteExerciseEntry(id: string): Promise<ActionResult> {
  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) return fail("Invalid entry reference");
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("exercise_entries")
    .delete()
    .eq("id", parsed.data)
    .eq("user_id", user.id);
  if (error) return fail(error.message);
  revalidatePath("/exercise");
  revalidatePath("/dashboard");
  return OK;
}
