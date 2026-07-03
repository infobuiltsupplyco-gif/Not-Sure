import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "@/components/onboarding-wizard";

export const metadata: Metadata = { title: "Welcome" };

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarded, display_name")
    .eq("user_id", user.id)
    .maybeSingle();
  if (profile?.onboarded) redirect("/dashboard");

  return (
    <OnboardingWizard
      initialName={profile?.display_name ?? user.email?.split("@")[0] ?? ""}
    />
  );
}
