import { cn } from "@/lib/utils";

interface ProgressProps {
  /** 0–100. Values above 100 are clamped visually. */
  value: number;
  className?: string;
  barClassName?: string;
  "aria-label"?: string;
}

/**
 * Neutral progress bar. Deliberately never turns red — going past 100% keeps
 * the same calm palette per the no-shaming principle.
 */
function Progress({ value, className, barClassName, ...props }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}
      {...props}
    >
      <div
        className={cn("h-full rounded-full bg-primary transition-all", barClassName)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export { Progress };
