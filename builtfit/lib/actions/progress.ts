"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser, fail, OK, type ActionResult } from "@/lib/actions/helpers";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export async function logWeight(input: { date: string; weightKg: number }): Promise<ActionResult> {
  const parsed = z
    .object({ date: dateSchema, weightKg: z.number().min(25).max(400) })
    .safeParse(input);
  if (!parsed.success) return fail("Enter a weight between 25 and 400 kg");
  const { supabase, user } = await requireUser();

  const { error } = await supabase.from("weight_logs").upsert(
    {
      user_id: user.id,
      date: parsed.data.date,
      weight_kg: parsed.data.weightKg,
    },
    { onConflict: "user_id,date" }
  );
  if (error) return fail(error.message);

  // Keep the profile weight current so MET math stays honest.
  await supabase
    .from("profiles")
    .update({ weight_kg: parsed.data.weightKg })
    .eq("user_id", user.id);

  revalidatePath("/progress");
  revalidatePath("/dashboard");
  return OK;
}

const SITES = [
  "waist",
  "hips",
  "chest",
  "left_arm",
  "right_arm",
  "left_thigh",
  "right_thigh",
  "neck",
] as const;

export async function logMeasurement(input: {
  date: string;
  site: string;
  valueCm: number;
}): Promise<ActionResult> {
  const parsed = z
    .object({
      date: dateSchema,
      site: z.enum(SITES),
      valueCm: z.number().min(10).max(300),
    })
    .safeParse(input);
  if (!parsed.success) return fail("Enter a measurement between 10 and 300 cm");
  const { supabase, user } = await requireUser();

  const { error } = await supabase.from("measurement_logs").insert({
    user_id: user.id,
    date: parsed.data.date,
    site: parsed.data.site,
    value_cm: parsed.data.valueCm,
  });
  if (error) return fail(error.message);
  revalidatePath("/progress");
  return OK;
}

export async function deleteProgressPhoto(id: string): Promise<ActionResult> {
  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) return fail("Invalid photo reference");
  const { supabase, user } = await requireUser();

  const { data: photo } = await supabase
    .from("progress_photos")
    .select("storage_path")
    .eq("id", parsed.data)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!photo) return fail("Photo not found");

  await supabase.storage.from("progress-photos").remove([photo.storage_path as string]);
  const { error } = await supabase
    .from("progress_photos")
    .delete()
    .eq("id", parsed.data)
    .eq("user_id", user.id);
  if (error) return fail(error.message);

  revalidatePath("/progress");
  return OK;
}

export async function savePhotoRecord(input: {
  date: string;
  storagePath: string;
  note?: string;
}): Promise<ActionResult> {
  const parsed = z
    .object({
      date: dateSchema,
      storagePath: z.string().min(1).max(500),
      note: z.string().max(500).optional(),
    })
    .safeParse(input);
  if (!parsed.success) return fail("Invalid photo details");
  const { supabase, user } = await requireUser();

  // Only allow paths inside the caller's own folder.
  if (!parsed.data.storagePath.startsWith(`${user.id}/`)) {
    return fail("Invalid storage path");
  }

  const { error } = await supabase.from("progress_photos").insert({
    user_id: user.id,
    date: parsed.data.date,
    storage_path: parsed.data.storagePath,
    note: parsed.data.note ?? null,
  });
  if (error) return fail(error.message);
  revalidatePath("/progress");
  return OK;
}
