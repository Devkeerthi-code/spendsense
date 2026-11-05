import { ArrowDownRight, ArrowUpRight } from "lucide-react";

/** Month-over-month change. Spending more reads as bad (danger), spending less as good. */
export function Delta({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="num w-14 shrink-0 text-right text-caption text-muted">new</span>;
  if (pct === 0) return <span className="num w-14 shrink-0 text-right text-caption text-muted">same</span>;
  const up = pct > 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`num inline-flex w-14 shrink-0 items-center justify-end gap-0.5 text-caption ${up ? "text-danger" : "text-positive"}`}>
      <Icon aria-hidden size={12} />
      <span className="sr-only">{up ? "up" : "down"}</span>
      {Math.abs(pct)}%
    </span>
  );
}
