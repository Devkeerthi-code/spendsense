import type { BudgetProgress } from "@/lib/budget";

const FILL: Record<BudgetProgress["state"], string> = {
  ok: "bg-ink/80",
  warn: "bg-warn",
  over: "bg-danger",
};

/**
 * Progress against a limit. Past 100% the fill spills out beyond the track's end cap (up to 24px) and nudges
 * once, so going over reads as physically breaking the limit rather than just a colour change.
 */
export function BudgetBar({ progress, label }: { progress: BudgetProgress; label: string }) {
  const within = Math.min(progress.percent, 100);
  const spill = progress.state === "over" ? Math.min(24, 6 + (progress.percent - 100) / 4) : 0;
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.min(progress.percent, 999)}
      aria-valuetext={`${progress.percent}% used`}
      className={`relative h-2.5 ${spill ? "mr-6" : ""}`}
    >
      <div className="absolute inset-0 rounded-full bg-sunken" />
      <div
        className={`bar-grow-x absolute inset-y-0 left-0 rounded-full ${FILL[progress.state]}`}
        style={{ width: `${within}%` }}
      />
      <span aria-hidden className="absolute -inset-y-1 right-0 w-0.5 rounded-full bg-line-strong" />
      {spill > 0 && (
        <span
          aria-hidden
          className="animate-nudge absolute inset-y-0 rounded-r-full bg-danger"
          style={{ left: "100%", width: `${spill}px` }}
        />
      )}
    </div>
  );
}
