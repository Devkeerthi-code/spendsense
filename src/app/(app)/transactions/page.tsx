import type { Metadata } from "next";
import { Upload } from "lucide-react";
import { CATEGORY_LABEL, isCategory } from "@/lib/categories";
import { formatMonth } from "@/lib/dates";
import { MonthSwitcher } from "@/components/month/MonthSwitcher";
import { firstParam, monthOptions, type SearchParams } from "@/components/month/params";
import { TxnFilters } from "@/components/transactions/TxnFilters";
import { TxnList } from "@/components/transactions/TxnList";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { currentUserId } from "@/server/auth";
import { monthsWithData, pickMonth } from "@/server/insights";
import { listTransactions } from "@/server/transactions";

export const metadata: Metadata = { title: "Transactions" };

function emptyCopy(category: string | undefined, q: string, month: string): { title: string; body: string } {
  if (q) return { title: `Nothing matches "${q}"`, body: `No ${formatMonth(month)} transaction has that in its merchant name or bank line. Try a shorter word.` };
  if (category) return { title: `No ${category} in ${formatMonth(month)}`, body: "Pick another category or month, or clear the filter." };
  return { title: `No transactions in ${formatMonth(month)}`, body: "Import a statement that covers this month, or pick another month." };
}

export default async function TransactionsPage({ searchParams }: { searchParams: SearchParams }) {
  const userId = (await currentUserId())!;
  const params = await searchParams;
  const months = await monthsWithData(userId);
  const month = pickMonth(firstParam(params.month), months);
  const rawCategory = firstParam(params.category);
  const category = isCategory(rawCategory) ? rawCategory : undefined;
  const q = (firstParam(params.q) ?? "").slice(0, 60);
  const { rows, nextCursor } = await listTransactions(userId, { month, category, q: q || undefined });

  const query = new URLSearchParams({ month, ...(category ? { category } : {}), ...(q ? { q } : {}) }).toString();
  const keep: Record<string, string> = { ...(category ? { category } : {}), ...(q ? { q } : {}) };
  const empty = emptyCopy(category && CATEGORY_LABEL[category], q, month);

  return (
    <>
      <PageHeader title="Transactions" subtitle="Tap a category to fix it. Tap a bank line to read all of it.">
        <MonthSwitcher month={month} options={monthOptions(months, month)} basePath="/transactions" query={keep} />
      </PageHeader>
      <div className="mb-6">
        <TxnFilters key={`${month}:${category ?? ""}`} month={month} category={category} q={q} />
      </div>
      {rows.length ? (
        <TxnList key={query} initialRows={rows} initialCursor={nextCursor} query={query} />
      ) : (
        <EmptyState
          title={months.length ? empty.title : "No transactions yet"}
          body={months.length ? empty.body : "Import a bank statement and every line shows up here, decoded."}
          action={
            !months.length || (!q && !category) ? (
              <LinkButton href="/import">
                <Upload aria-hidden size={16} /> Import a statement
              </LinkButton>
            ) : (
              <LinkButton href={`/transactions?month=${month}`} variant="secondary">
                Clear filters
              </LinkButton>
            )
          }
        />
      )}
    </>
  );
}
