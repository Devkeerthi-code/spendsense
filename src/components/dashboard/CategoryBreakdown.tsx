import Link from "next/link";
import type { CSSProperties } from "react";
import { CATEGORY_LABEL } from "@/lib/categories";
import type { CategorySpend } from "@/lib/insights/month";
import { formatINR } from "@/lib/money";
import { CategoryIcon } from "@/components/category/CategoryIcon";
import { CATEGORY_COLOR } from "@/components/category/meta";
import { Delta } from "@/components/ui/Delta";
import { percentOf } from "./math";

const VISIBLE = 5;

function Row({ c, month }: { c: CategorySpend; month: string }) {
  const none = c.spentPaise === 0;
  return (
    <li className={none ? "opacity-55" : undefined}>
      <Link
        href={`/transactions?month=${month}&category=${c.category}`}
        className="press -mx-2 flex items-baseline gap-2 rounded-sm px-2 py-2.5 hover:bg-sunken"
      >
        <span className="flex min-w-0 items-center gap-2 self-center">
          <CategoryIcon category={c.category} />
          <span className="truncate text-sm font-medium">{CATEGORY_LABEL[c.category]}</span>
          {!none && <span className="num hidden text-caption text-muted sm:inline">×{c.count}</span>}
        </span>
        <span aria-hidden className="leader" />
        <span className="num shrink-0 text-sm">{none ? <span className="text-muted">₹0</span> : formatINR(c.spentPaise)}</span>
        <Delta pct={c.changePct} />
      </Link>
    </li>
  );
}

/** One 100% strip of the month, then the itemised receipt below it. */
interface Props {
  categories: CategorySpend[];
  totalPaise: number;
  month: string;
  isCurrentMonth: boolean;
}

export function CategoryBreakdown({ categories, totalPaise, month, isCurrentMonth }: Props) {
  const spent = categories.filter((c) => c.spentPaise > 0);
  const top = categories.slice(0, VISIBLE);
  const rest = categories.slice(VISIBLE);

  return (
    <div>
      <div aria-hidden className="flex h-4 gap-[2px] overflow-hidden rounded-sm">
        {spent.map((c, i) => (
          <span
            key={c.category}
            className="bar-grow-x h-full first:rounded-l-sm last:rounded-r-sm"
            style={{ width: `${percentOf(c.spentPaise, totalPaise)}%`, backgroundColor: CATEGORY_COLOR[c.category], "--i": i } as CSSProperties}
          />
        ))}
      </div>
      <p className="mt-3 text-right text-caption text-muted">{isCurrentMonth ? "change vs same days last month" : "change vs last month"}</p>
      <ul className="mt-1">
        {top.map((c) => (
          <Row key={c.category} c={c} month={month} />
        ))}
      </ul>
      {rest.length > 0 && (
        <details className="group">
          <summary className="press mt-1 inline-flex h-9 cursor-pointer list-none items-center rounded-sm px-2 text-sm font-medium text-accent-ink hover:bg-sunken [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">Show {rest.length} more</span>
            <span className="hidden group-open:inline">Show fewer</span>
          </summary>
          <ul>
            {rest.map((c) => (
              <Row key={c.category} c={c} month={month} />
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
