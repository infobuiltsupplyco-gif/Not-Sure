/** Shared domain types for BuiltFit. */

export type Sex = "male" | "female";
export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";
export type GoalType = "lose" | "maintain" | "gain";
/** Conservative-only weekly rates, kg/week. */
export type GoalRate = 0.25 | 0.5 | 0.75;
export type Units = "metric" | "imperial";
export type Meal = "breakfast" | "lunch" | "dinner" | "snack";
export type FoodSource = "usda" | "off";

/** Per-100g (or per-100ml) nutrient values. All grams unless noted. */
export interface Nutrients {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  saturated_fat_g: number;
  sodium_mg: number;
  potassium_mg: number;
  calcium_mg: number;
  iron_mg: number;
  vitamin_c_mg: number;
  vitamin_a_ug: number;
}

export const EMPTY_NUTRIENTS: Nutrients = {
  calories: 0,
  protein_g: 0,
  carbs_g: 0,
  fat_g: 0,
  fiber_g: 0,
  sugar_g: 0,
  saturated_fat_g: 0,
  sodium_mg: 0,
  potassium_mg: 0,
  calcium_mg: 0,
  iron_mg: 0,
  vitamin_c_mg: 0,
  vitamin_a_ug: 0,
};

export interface ServingOption {
  /** Display label, e.g. "1 cup", "1 slice (28g)". */
  label: string;
  /** Grams per one serving of this option. */
  grams: number;
}

/** Normalized food item used across the whole app, regardless of source. */
export interface FoodItem {
  /** Stable id: `usda:<fdcId>`, `off:<barcode>`, `personal:<uuid>`, `recipe:<uuid>`. */
  id: string;
  source: FoodSource | "personal" | "recipe";
  sourceId: string;
  name: string;
  brand: string | null;
  barcode: string | null;
  /** Nutrients per 100 g. */
  per100g: Nutrients;
  servings: ServingOption[];
  verified: boolean;
  /** 0–1. How much we trust the nutrition data. */
  confidence: number;
  /** Heuristic: is this a whole/minimally-processed food? */
  wholeFood: boolean;
}

export interface ProfileRow {
  user_id: string;
  display_name: string | null;
  dob: string | null;
  sex: Sex | null;
  height_cm: number | null;
  weight_kg: number | null;
  activity_level: ActivityLevel;
  goal_type: GoalType;
  goal_rate: number;
  gentle_mode: boolean;
  exercise_calories_back: boolean;
  units: Units;
  timezone: string;
  calorie_target: number | null;
  protein_target_g: number | null;
  onboarded: boolean;
  created_at: string;
}

export interface DiaryEntryRow {
  id: string;
  user_id: string;
  date: string;
  meal: Meal;
  food_id: string;
  food_name: string;
  food_brand: string | null;
  verified: boolean;
  quantity: number;
  serving_label: string;
  serving_grams: number;
  nutrition: Nutrients;
  created_at: string;
}

export interface ExerciseEntryRow {
  id: string;
  user_id: string;
  date: string;
  activity: string;
  met_value: number;
  duration_min: number;
  computed_burn_low: number;
  computed_burn_high: number;
  created_at: string;
}

export interface WeightLogRow {
  id: string;
  user_id: string;
  date: string;
  weight_kg: number;
  created_at: string;
}

export interface MeasurementLogRow {
  id: string;
  user_id: string;
  date: string;
  site: string;
  value_cm: number;
  created_at: string;
}

export interface WaterLogRow {
  id: string;
  user_id: string;
  date: string;
  ml: number;
  created_at: string;
}

export interface StreakRow {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_logged_date: string | null;
}

export interface QualityScoreRow {
  id: string;
  user_id: string;
  date: string;
  whole_food_pct: number;
  protein_adequacy: number;
  fiber_g: number;
  micro_coverage_pct: number;
  overall: number;
}

export interface PersonalFoodRow {
  id: string;
  user_id: string;
  name: string;
  brand: string | null;
  per_100g: Nutrients;
  servings: ServingOption[];
  created_at: string;
}

export interface RecipeRow {
  id: string;
  user_id: string;
  name: string;
  servings_count: number;
  per_serving: Nutrients;
  serving_grams: number;
  created_at: string;
}

export interface RecipeIngredientRow {
  id: string;
  recipe_id: string;
  food_id: string;
  food_name: string;
  quantity: number;
  serving_label: string;
  serving_grams: number;
  nutrition: Nutrients;
}

export interface ProgressPhotoRow {
  id: string;
  user_id: string;
  date: string;
  storage_path: string;
  note: string | null;
  created_at: string;
}

/** Scale per-100g nutrients to an eaten amount. */
export function scaleNutrients(
  per100g: Nutrients,
  grams: number
): Nutrients {
  const f = grams / 100;
  const out = { ...EMPTY_NUTRIENTS };
  for (const key of Object.keys(out) as (keyof Nutrients)[]) {
    out[key] = Math.round(per100g[key] * f * 10) / 10;
  }
  return out;
}

export function sumNutrients(items: Nutrients[]): Nutrients {
  const out = { ...EMPTY_NUTRIENTS };
  for (const n of items) {
    for (const key of Object.keys(out) as (keyof Nutrients)[]) {
      out[key] = Math.round((out[key] + (n[key] ?? 0)) * 10) / 10;
    }
  }
  return out;
}
