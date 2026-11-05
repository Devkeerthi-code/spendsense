import type { Metadata } from "next";
import { TriangleAlert } from "lucide-react";
import { CATEGORY_LABEL } from "@/lib/categories";
import { formatMonth, todayIST } from "@/lib/dates";
import { formatINR } from "@/lib/money";
import { BudgetEditor } from "@/components/budgets/BudgetEditor";
import { MonthSwitcher } from "@/components/month/MonthSwitcher";
import { firstParam, monthOptions, type SearchParams } from "@/components/month/params";
import { PageHeader } from "@/components/ui/PageHeader";
import { currentUserId } from "@/server/auth";
import { getBudgets, monthsWithData, pickMonth, type BudgetRow } from "@/server/insights";

export const metadata: Metadata = { title: "Budgets" };

function OverBanner({ over }: { over: BudgetRow[] }) {
  if (!over.length) return null;
  const total = over.reduce((sum, r) => sum + (r.progress ? -r.progress.remainingPaise : 0), 0);
  return (
    <div role="status" className="animate-nudge mb-4 flex gap-3 rounded-md border border-danger/40 bg-danger-soft p-4 text-sm">
      <TriangleAlert aria-hidden size={18} className="mt-0.5 shrink-0 text-danger" />
      <p>
        <span className="font-semibold text-danger">
          {over.length} budget{over.length === 1 ? " is" : "s are"} over by {formatINR(total)} in total:
        </span>{" "}
        {over.map((r) => CATEGORY_LABEL[r.category]).join(", ")}.
      </p>
    </div>
  );
}

export default async function BudgetsPage({ searchParams }: { searchParams: SearchParams }) {
  const userId = (await currentUserId())!;
  const months = await monthsWithData(userId);
  const month = pickMonth(firstParam((await searchParams).month), months);
  const rows = await getBudgets(userId, month);
  const isCurrentMonth = month === todayIST().slice(0, 7);
  const ordered = [...rows].sort((a, b) => Number(b.limitPaise !== null) - Number(a.limitPaise !== null));
  const totalLimit = rows.reduce((sum, r) => sum + (r.limitPaise ?? 0), 0);

  return (
    <>
      <PageHeader
        title="Budgets"
        subtitle={totalLimit ? `${formatINR(totalLimit)} a month across your limits. Showing ${formatMonth(month)}.` : "Set a monthly limit for the categories you want to watch. The same limits apply every month."}
      >
        <MonthSwitcher month={month} options={monthOptions(months, month)} basePath="/budgets" />
      </PageHeader>
      <OverBanner over={rows.filter((r) => r.progress?.state === "over")} />
      <section aria-label="Category limits" className="rounded-md bg-surface p-4 shadow-paper sm:p-6">
        <ul className="divide-y divide-dashed divide-line-strong">
          {ordered.map((row) => (
            <BudgetEditor key={`${row.category}:${row.limitPaise ?? "none"}`} row={row} isCurrentMonth={isCurrentMonth} />
          ))}
        </ul>
      </section>
    </>
  );
}
