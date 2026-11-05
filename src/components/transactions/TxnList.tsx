"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { CategoryId } from "@/lib/categories";
import { formatINR } from "@/lib/money";
import { api, messageOf } from "@/client/api";
import { Button } from "@/components/ui/Button";
import type { TxnRow } from "@/server/transactions";
import { CategorySheet } from "./CategorySheet";
import { TxnRowItem } from "./TxnRowItem";
import { useRecategorise } from "./useRecategorise";

interface Props {
  initialRows: TxnRow[];
  initialCursor: string | null;
  /** Current filters as a query string, reused for "Load more". */
  query: string;
}

const dayLabel = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

function groupByDate(rows: TxnRow[]): [string, TxnRow[]][] {
  const groups = new Map<string, TxnRow[]>();
  for (const r of rows) groups.set(r.date, [...(groups.get(r.date) ?? []), r]);
  return [...groups];
}

function dayTotal(rows: TxnRow[]): number {
  return rows.reduce((sum, r) => sum + (r.direction === "DEBIT" ? r.amountPaise : 0), 0);
}

export function TxnList({ initialRows, initialCursor, query }: Props) {
  const [rows, setRows] = useState(initialRows);
  const [cursor, setCursor] = useState(initialCursor);
  const [loadingMore, setLoadingMore] = useState(false);
  const [editing, setEditing] = useState<TxnRow | null>(null);
  const { change, pending, changedId } = useRecategorise(setRows);

  async function loadMore() {
    if (!cursor) return;
    setLoadingMore(true);
    try {
      const page = await api<{ rows: TxnRow[]; nextCursor: string | null }>(`/api/transactions?${query}&cursor=${cursor}`);
      setRows((prev) => [...prev, ...page.rows]);
      setCursor(page.nextCursor);
    } catch (err) {
      toast.error(messageOf(err));
    } finally {
      setLoadingMore(false);
    }
  }

  async function onPick(category: CategoryId, applyToMerchant: boolean) {
    if (!editing) return;
    if (await change(editing, category, applyToMerchant)) setEditing(null);
  }

  return (
    <>
      <div className="grid gap-4">
        {groupByDate(rows).map(([date, dayRows]) => (
          <section key={date} aria-label={dayLabel.format(new Date(`${date}T00:00:00Z`))} className="rounded-md bg-surface px-4 shadow-paper sm:px-6">
            <header className="flex items-baseline gap-2 border-b border-dashed border-line-strong py-2.5 font-mono text-caption tracking-[0.06em] text-muted uppercase">
              <span>{dayLabel.format(new Date(`${date}T00:00:00Z`))}</span>
              <span aria-hidden className="leader" />
              <span className="num normal-case">
                {dayTotal(dayRows) ? `spent ${formatINR(dayTotal(dayRows))}` : "money in only"}
              </span>
            </header>
            <ul className="divide-y divide-line">
              {dayRows.map((txn) => (
                <TxnRowItem key={txn.id} txn={txn} onChangeCategory={setEditing} justChanged={txn.id === changedId} />
              ))}
            </ul>
          </section>
        ))}
      </div>
      {cursor && (
        <div className="mt-6 flex justify-center">
          <Button variant="secondary" pending={loadingMore} onClick={loadMore}>
            {loadingMore ? "Loading" : "Load 50 more"}
          </Button>
        </div>
      )}
      <CategorySheet txn={editing} pending={pending} onPick={onPick} onClose={() => setEditing(null)} />
    </>
  );
}
