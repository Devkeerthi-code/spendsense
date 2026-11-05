import type { BudgetProgress } from "@/lib/budget";
import { formatINR } from "@/lib/money";

/** One plain sentence about where this budget stands and where it's heading. */
export function BudgetStatus({ progress, isCurrentMonth }: { progress: BudgetProgress; isCurrentMonth: boolean }) {
  if (progress.state === "over") {
    return <p className="text-sm font-medium text-danger">Over by {formatINR(-progress.remainingPaise)} ({progress.percent}% used)</p>;
  }
  const left = `${formatINR(progress.remainingPaise)} left`;
  const perDay = isCurrentMonth && progress.perDayLeftPaise !== null ? ` · ${formatINR(progress.perDayLeftPaise)}/day for the rest of the month` : "";
  if (isCurrentMonth && progress.projectedOverPaise > 0) {
    return (
      <p className={`text-sm ${progress.state === "warn" ? "text-warn" : "text-muted"}`}>
        {left}. On track for {formatINR(progress.projectedPaise)} by month-end, {formatINR(progress.projectedOverPaise)} over.
      </p>
    );
  }
  return (
    <p className={`text-sm ${progress.state === "warn" ? "text-warn" : "text-muted"}`}>
      {progress.state === "warn" ? `${progress.percent}% used. ` : ""}
      {left}
      {perDay}
    </p>
  );
}
