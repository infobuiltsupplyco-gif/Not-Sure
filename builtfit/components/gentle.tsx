"use client";

import * as React from "react";

/**
 * Gentle Mode: a global, wellbeing-first display mode that removes every raw
 * calorie numeral from the UI and replaces quantitative feedback with
 * qualitative language. All calorie displays in the app MUST go through
 * <CalorieValue /> (or useGentle()) so the mode can never leak a number.
 */

interface GentleContextValue {
  gentle: boolean;
}

const GentleContext = React.createContext<GentleContextValue>({ gentle: false });

export function GentleProvider({
  gentle,
  children,
}: {
  gentle: boolean;
  children: React.ReactNode;
}) {
  return (
    <GentleContext.Provider value={{ gentle }}>{children}</GentleContext.Provider>
  );
}

export function useGentle(): boolean {
  return React.useContext(GentleContext).gentle;
}

/** Qualitative wording for an amount relative to a reference target. */
export function gentleDescription(value: number, target: number | null): string {
  if (!target || target <= 0) return "logged";
  const ratio = value / target;
  if (ratio < 0.25) return "a light amount";
  if (ratio < 0.6) return "a moderate amount";
  if (ratio < 0.9) return "a satisfying amount";
  if (ratio <= 1.1) return "right around your usual";
  return "a generous amount";
}

/**
 * Renders a calorie amount — or, in Gentle Mode, qualitative wording with no
 * numerals at all.
 */
export function CalorieValue({
  value,
  target = null,
  suffix = " kcal",
  gentleText,
  className,
}: {
  value: number;
  target?: number | null;
  suffix?: string;
  /** Override the qualitative wording used in Gentle Mode. */
  gentleText?: string;
  className?: string;
}) {
  const gentle = useGentle();
  if (gentle) {
    return (
      <span className={className}>{gentleText ?? gentleDescription(value, target)}</span>
    );
  }
  return (
    <span className={className}>
      {Math.round(value).toLocaleString()}
      {suffix}
    </span>
  );
}

/** Hides arbitrary numeric content entirely while Gentle Mode is on. */
export function HideInGentle({ children }: { children: React.ReactNode }) {
  const gentle = useGentle();
  if (gentle) return null;
  return <>{children}</>;
}

/** Renders only while Gentle Mode is on. */
export function OnlyInGentle({ children }: { children: React.ReactNode }) {
  const gentle = useGentle();
  if (!gentle) return null;
  return <>{children}</>;
}
