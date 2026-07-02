import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { Nutrients } from "@/lib/types";

/**
 * Free CSV export of the user's own data. Data portability is a core feature
 * and is never paywalled.
 */

const kindSchema = z.enum(["diary", "weight", "measurements", "exercise", "water", "quality"]);

function csvEscape(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(headers: string[], rows: unknown[][]): string {
  return [
    headers.join(","),
    ...rows.map((r) => r.map(csvEscape).join(",")),
  ].join("\n");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = kindSchema.safeParse(searchParams.get("kind"));
  if (!parsed.success) {
    return NextResponse.json({ error: "Unknown export kind" }, { status: 400 });
  }
  const kind = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  let csv = "";

  if (kind === "diary") {
    const { data } = await supabase
      .from("diary_entries")
      .select("date, meal, food_name, food_brand, verified, quantity, serving_label, nutrition")
      .eq("user_id", user.id)
      .order("date");
    csv = toCsv(
      ["date", "meal", "food", "brand", "verified", "quantity", "serving", "calories", "protein_g", "carbs_g", "fat_g", "fiber_g", "sugar_g", "sodium_mg"],
      (data ?? []).map((r) => {
        const n = r.nutrition as Nutrients;
        return [r.date, r.meal, r.food_name, r.food_brand, r.verified, r.quantity, r.serving_label, n.calories, n.protein_g, n.carbs_g, n.fat_g, n.fiber_g, n.sugar_g, n.sodium_mg];
      })
    );
  } else if (kind === "weight") {
    const { data } = await supabase
      .from("weight_logs")
      .select("date, weight_kg")
      .eq("user_id", user.id)
      .order("date");
    csv = toCsv(["date", "weight_kg"], (data ?? []).map((r) => [r.date, r.weight_kg]));
  } else if (kind === "measurements") {
    const { data } = await supabase
      .from("measurement_logs")
      .select("date, site, value_cm")
      .eq("user_id", user.id)
      .order("date");
    csv = toCsv(["date", "site", "value_cm"], (data ?? []).map((r) => [r.date, r.site, r.value_cm]));
  } else if (kind === "exercise") {
    const { data } = await supabase
      .from("exercise_entries")
      .select("date, activity, met_value, duration_min, computed_burn_low, computed_burn_high")
      .eq("user_id", user.id)
      .order("date");
    csv = toCsv(
      ["date", "activity", "met", "duration_min", "burn_low_kcal", "burn_high_kcal"],
      (data ?? []).map((r) => [r.date, r.activity, r.met_value, r.duration_min, r.computed_burn_low, r.computed_burn_high])
    );
  } else if (kind === "water") {
    const { data } = await supabase
      .from("water_logs")
      .select("date, ml")
      .eq("user_id", user.id)
      .order("date");
    csv = toCsv(["date", "ml"], (data ?? []).map((r) => [r.date, r.ml]));
  } else {
    const { data } = await supabase
      .from("food_quality_scores")
      .select("date, whole_food_pct, protein_adequacy, fiber_g, micro_coverage_pct, overall")
      .eq("user_id", user.id)
      .order("date");
    csv = toCsv(
      ["date", "whole_food_pct", "protein_adequacy", "fiber_g", "micro_coverage_pct", "overall"],
      (data ?? []).map((r) => [r.date, r.whole_food_pct, r.protein_adequacy, r.fiber_g, r.micro_coverage_pct, r.overall])
    );
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="builtfit-${kind}.csv"`,
    },
  });
}
