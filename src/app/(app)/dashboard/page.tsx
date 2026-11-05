import type { Metadata } from "next";
import { Upload } from "lucide-react";
import { formatMonth } from "@/lib/dates";
import { BudgetGlance } from "@/components/dashboard/BudgetGlance";
import { CategoryBreakdown } from "@/components/dashboard/CategoryBreakdown";
import { DailyChart } from "@/components/dashboard/DailyChart";
import { LeakJar } from "@/components/dashboard/LeakJar";
import { RecurringList } from "@/components/dashboard/RecurringList";
import { SpendTotals } from "@/components/dashboard/SpendTotals";
import { TopMerchants } from "@/components/dashboard/TopMerchants";
import { MonthSwitcher } from "@/components/month/MonthSwitcher";
import { firstParam, monthOptions, type SearchParams } from "@/components/month/params";
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { currentUserId } from "@/server/auth";
import { getDashboard, monthsWithData, pickMonth } from "@/server/insights";

export const metadata: Metadata = { title: "Insights" };

export default async function DashboardPage({ searchParams }: { searchParams: SearchParams }) {
  const userId = (await currentUserId())!;
  const months = await monthsWithData(userId);

  if (!months.length) {
    return (
      <>
        <PageHeader title="Insights" />
        <EmptyState
          title="Nothing printed yet"
          body="Import a bank statement (CSV or PDF from SBI, HDFC, ICICI, Axis, Kotak or any bank's CSV) and this page fills with where your money went."
          action={
            <LinkButton href="/import">
              <Upload aria-hidden size={16} /> Import a statement
            </LinkButton>
          }
        />
      </>
    );
  }

  const month = pickMonth(firstParam((await searchParams).month), months);
  const { summary, leaks, recurring, budgets } = await getDashboard(userId, month);
  const options = monthOptions(months, month);
  const latest = months[0]!.month;

  return (
    <>
      <PageHeader title="Insights" subtitle={`${formatMonth(month)} · ${summary.txnCount} transactions`}>
        <MonthSwitcher month={month} options={options} basePath="/dashboard" />
      </PageHeader>

      {summary.txnCount === 0 ? (
        <EmptyState
          title={`No transactions in ${formatMonth(month)}`}
          body="Your statements don't cover this month yet. Import a newer statement, or look at a month you already have."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <LinkButton href={`/dashboard?month=${latest}`} variant="secondary">
                Go to {formatMonth(latest)}
              </LinkButton>
              <LinkButton href="/import">Import a statement</LinkButton>
            </div>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-12 lg:gap-6">
          <div className="grid min-w-0 content-start gap-4 lg:col-span-8 lg:gap-6">
            <SpendTotals summary={summary} />
            <Card title="Spend per day">
              <DailyChart
                month={month}
                daily={summary.daily}
                daysElapsed={summary.daysElapsed}
                dailyAveragePaise={summary.dailyAveragePaise}
                isCurrentMonth={summary.isCurrentMonth}
              />
            </Card>
            <Card title="By category">
              <CategoryBreakdown categories={summary.byCategory} totalPaise={summary.spentPaise} month={month} isCurrentMonth={summary.isCurrentMonth} />
            </Card>
          </div>
          <div className="grid min-w-0 content-start gap-4 lg:col-span-4 lg:gap-6">
            <Card title="Small leaks">
              <LeakJar leaks={leaks} />
            </Card>
            <Card title="Recurring payments">
              <RecurringList items={recurring} />
            </Card>
            <Card title="Top merchants">
              <TopMerchants merchants={summary.topMerchants} month={month} />
            </Card>
            <Card title="Budgets">
              <BudgetGlance budgets={budgets} month={month} />
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
