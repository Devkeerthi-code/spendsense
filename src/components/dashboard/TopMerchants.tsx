import Link from "next/link";
import type { CSSProperties } from "react";
import type { MerchantSpend } from "@/lib/insights/month";
import { formatINR } from "@/lib/money";
import { percentOf } from "./math";

export function TopMerchants({ merchants, month }: { merchants: MerchantSpend[]; month: string }) {
  if (!merchants.length) return <p className="text-sm text-muted">No spending this month.</p>;
  const top = merchants[0]?.spentPaise ?? 1;
  return (
    <ol className="grid gap-1">
      {merchants.map((m, i) => (
        <li key={m.merchantKey}>
          <Link
            href={`/transactions?month=${month}&q=${encodeURIComponent(m.merchant)}`}
            className="press -mx-2 grid grid-cols-[20px_1fr_auto] items-center gap-x-2 rounded-sm px-2 py-2 hover:bg-sunken"
          >
            <span className="num text-caption text-muted">{i + 1}</span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{m.merchant}</span>
              <span aria-hidden className="mt-1 block h-1 rounded-full bg-sunken">
                <span
                  className="bar-grow-x block h-full rounded-full bg-ink/70"
                  style={{ width: `${percentOf(m.spentPaise, top)}%`, "--i": i } as CSSProperties}
                />
              </span>
            </span>
            <span className="text-right">
              <span className="num block text-sm">{formatINR(m.spentPaise)}</span>
              <span className="num block text-caption text-muted">{m.count}×</span>
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
