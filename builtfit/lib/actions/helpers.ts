import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";

export interface ActionContext {
  supabase: SupabaseClient;
  user: User;
}

/** Resolve the signed-in user or bounce to /login. */
export async function requireUser(): Promise<ActionContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string };

export function fail(error: string): ActionResult {
  return { ok: false, error };
}

export const OK: ActionResult = { ok: true };
