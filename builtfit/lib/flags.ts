/**
 * Feature-flag system. Core tracking features are marked `free_forever: true`
 * as a permanent contract — nothing in this file may ever gate them behind a
 * subscription, and `assertNeverPaywalled` enforces that at runtime.
 */

export interface FeatureFlag {
  key: string;
  name: string;
  /** Permanent contract: this feature can never be paywalled. */
  free_forever: boolean;
  /** Which plan unlocks it, when subscriptions are ever enabled. */
  plan: "free" | "plus";
  enabled: boolean;
}

export const SUBSCRIPTIONS_ENABLED =
  process.env.NEXT_PUBLIC_SUBSCRIPTIONS_ENABLED === "true";

export const FEATURES: Record<string, FeatureFlag> = {
  food_logging: { key: "food_logging", name: "Food diary", free_forever: true, plan: "free", enabled: true },
  barcode_scanning: { key: "barcode_scanning", name: "Barcode scanning", free_forever: true, plan: "free", enabled: true },
  macro_breakdown: { key: "macro_breakdown", name: "Macro breakdowns", free_forever: true, plan: "free", enabled: true },
  custom_goals: { key: "custom_goals", name: "Custom goals", free_forever: true, plan: "free", enabled: true },
  data_export: { key: "data_export", name: "CSV data export", free_forever: true, plan: "free", enabled: true },
  progress_charts: { key: "progress_charts", name: "Progress charts", free_forever: true, plan: "free", enabled: true },
  recipes: { key: "recipes", name: "Recipes & meals", free_forever: true, plan: "free", enabled: true },
  exercise_logging: { key: "exercise_logging", name: "Exercise logging", free_forever: true, plan: "free", enabled: true },
  gentle_mode: { key: "gentle_mode", name: "Gentle Mode", free_forever: true, plan: "free", enabled: true },
  insights: { key: "insights", name: "Weekly insights", free_forever: true, plan: "free", enabled: true },
  // Future BuiltFit+ extras — non-core only. Disabled at launch.
  ai_meal_suggestions: { key: "ai_meal_suggestions", name: "AI meal suggestions", free_forever: false, plan: "plus", enabled: false },
  advanced_themes: { key: "advanced_themes", name: "Advanced analytics themes", free_forever: false, plan: "plus", enabled: false },
};

export function isFeatureEnabled(key: keyof typeof FEATURES): boolean {
  const flag = FEATURES[key];
  if (!flag) return false;
  if (flag.free_forever) return true;
  if (!SUBSCRIPTIONS_ENABLED) return flag.enabled;
  return flag.enabled;
}

/**
 * Guard used by any future paywall code path: throws if someone tries to gate
 * a free-forever feature.
 */
export function assertNeverPaywalled(key: keyof typeof FEATURES): void {
  const flag = FEATURES[key];
  if (flag?.free_forever) {
    throw new Error(
      `BuiltFit contract violation: "${flag.name}" is free forever and cannot be paywalled.`
    );
  }
}
