import type { Metadata } from "next";
import { PersonalFoodForm } from "@/components/personal-food-form";
import { getSession } from "@/lib/data";
import { todayISO } from "@/lib/utils";

export const metadata: Metadata = { title: "New personal food" };

export default async function NewFoodPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { profile } = await getSession();
  const params = await searchParams;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(params.date ?? "")
    ? params.date!
    : todayISO(profile.timezone);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Create a food</h1>
      <PersonalFoodForm date={date} />
    </div>
  );
}
