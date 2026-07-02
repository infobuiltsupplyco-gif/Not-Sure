import type { Metadata } from "next";
import { SettingsForm } from "@/components/settings-form";
import { getSession } from "@/lib/data";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { profile } = await getSession();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Settings</h1>
      <SettingsForm profile={profile} />
    </div>
  );
}
