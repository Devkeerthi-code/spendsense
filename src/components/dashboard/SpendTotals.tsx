import { formatShortDate } from "@/lib/dates";
import { formatINR, formatINRCompact } from "@/lib/money";
import type { MonthSummary } from "@/lib/insights/month";
import { Delta } from "@/components/ui/Delta";
import { percentOf } from "./math";

function paceLine(s: MonthSummary): string {
  if (!s.daysElapsed) return "This month hasn't started yet.";
  const perDay = `${formatINR(s.dailyAveragePaise)}/day`;
  if (!s.isCurrentMonth) return `${perDay} on average over ${s.daysInMonth} days`;
  const monthEnd = formatShortDate(`${s.month}-${String(s.daysInMonth).padStart(2, "0")}`);
  return `${perDay} so far · on track for ${formatINRCompact(s.projectedPaise)} by ${monthEnd}`;
}

export function SpendTotals({ summary }: { summary: MonthSummary }) {
  const total = summary.spentPaise + summary.receivedPaise;
  const spentShare = total ? percentOf(summary.spentPaise, total) : 50;
  const change = summary.previousSpentPaise
    ? Math.round(((summary.spentPaise - summary.previousSpentPaise) * 100) / summary.previousSpentPaise)
    : null;

  return (
    <section aria-label="Money out and in" className="receipt-edge animate-print mb-2 rounded-t-md bg-surface p-4 shadow-paper sm:p-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="font-mono text-caption tracking-[0.08em] text-muted uppercase">Spent</p>
          <p className="num mt-1 text-h1 font-medium tracking-[-0.02em] sm:text-hero">{formatINR(summary.spentPaise)}</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-caption tracking-[0.08em] text-muted uppercase">Received</p>
          <p className="num mt-1 text-h1 font-medium tracking-[-0.02em] text-positive sm:text-hero">{formatINR(summary.receivedPaise)}</p>
        </div>
      </div>
      <div aria-hidden className="mt-4 flex h-2 overflow-hidden rounded-full bg-sunken">
        <span className="h-full bg-ink transition-[width] duration-180" style={{ width: `${spentShare}%` }} />
        <span className="h-full flex-1 bg-positive/70" />
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm">
        <p className="num text-muted">{paceLine(summary)}</p>
        {summary.previousSpentPaise > 0 && (
          <p className="flex items-center gap-1 text-muted">
            {summary.isCurrentMonth ? "vs same days last month" : "vs last month"} <Delta pct={change} />
          </p>
        )}
      </div>
    </section>
  );
}
