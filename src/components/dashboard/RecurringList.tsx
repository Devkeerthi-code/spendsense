import type { RecurringPayment } from "@/lib/insights/recurring";
import { formatShortDate } from "@/lib/dates";
import { formatINR } from "@/lib/money";
import { CategoryIcon } from "@/components/category/CategoryIcon";

export function RecurringList({ items }: { items: RecurringPayment[] }) {
  if (!items.length) {
    return <p className="text-sm text-muted">Nothing repeating yet. A payment shows up here after it repeats two or three times at a steady gap.</p>;
  }
  const yearly = items.reduce((sum, r) => sum + r.yearlyPaise, 0);
  return (
    <div>
      <ul className="divide-y divide-dashed divide-line-strong">
        {items.map((r) => (
          <li key={r.merchantKey} className="flex items-center gap-3 py-2.5">
            <CategoryIcon category={r.category} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{r.merchant}</p>
              <p className="num text-caption text-muted">
                {r.cadence} · next ~{formatShortDate(r.nextDate)}
              </p>
            </div>
            <div className="text-right">
              <p className="num text-sm">{formatINR(r.typicalPaise)}</p>
              <p className="num text-caption text-muted">{formatINR(r.yearlyPaise)}/yr</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-caption text-muted">
        Together about <span className="num font-medium text-ink">{formatINR(yearly)}</span> a year.
      </p>
    </div>
  );
}
