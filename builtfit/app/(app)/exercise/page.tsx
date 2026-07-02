import type { Metadata } from "next";
import { ExerciseForm, ExerciseList } from "@/components/exercise-form";
import { getSession } from "@/lib/data";
import type { ExerciseEntryRow } from "@/lib/types";
import { todayISO } from "@/lib/utils";

export const metadata: Metadata = { title: "Exercise" };

export default async function ExercisePage() {
  const { supabase, userId, profile } = await getSession();
  const date = todayISO(profile.timezone);

  const { data } = await supabase
    .from("exercise_entries")
    .select("*")
    .eq("user_id", userId)
    .eq("date", date)
    .order("created_at");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Exercise</h1>
      <ExerciseForm
        date={date}
        weightKg={Number(profile.weight_kg ?? 70)}
        caloriesBack={profile.exercise_calories_back}
      />
      <section>
        <h2 className="mb-2 text-lg font-semibold">Today</h2>
        <ExerciseList entries={(data ?? []) as ExerciseEntryRow[]} />
      </section>
    </div>
  );
}
