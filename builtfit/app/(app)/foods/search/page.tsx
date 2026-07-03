import type { Metadata } from "next";
import { FoodSearch } from "@/components/food-search";
import { getRecentFoods, getSession } from "@/lib/data";
import type { Meal } from "@/lib/types";
import { todayISO } from "@/lib/utils";

export const metadata: Metadata = { title: "Add food" };

const MEALS: Meal[] = ["breakfast", "lunch", "dinner", "snack"];

export default async function FoodSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; meal?: string }>;
}) {
  const { supabase, userId, profile } = await getSession();
  const params = await searchParams;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(params.date ?? "")
    ? params.date!
    : todayISO(profile.timezone);
  const meal = MEALS.includes(params.meal as Meal) ? (params.meal as Meal) : "snack";
  const recents = await getRecentFoods(supabase, userId);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Add food</h1>
      <FoodSearch date={date} meal={meal} recents={recents} />
    </div>
  );
}
