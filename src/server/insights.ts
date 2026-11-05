import { budgetProgress, type BudgetProgress } from "@/lib/budget";
import { CATEGORIES, type CategoryId } from "@/lib/categories";
import { daysInMonth, isoToUTCDate, monthKey, parseMonthKey, shiftMonth, todayIST, utcDateToIso } from "@/lib/dates";
import { findSmallLeaks, type LeakReport } from "@/lib/insights/leaks";
import { elapsedDays, summariseMonth, type MonthSummary } from "@/lib/insights/month";
import { detectRecurring, type RecurringPayment } from "@/lib/insights/recurring";
import type { InsightTxn } from "@/lib/insights/types";
import { db } from "./db";

const RECURRING_LOOKBACK_MONTHS = 6;

export interface MonthOption {
  month: string;
  count: number;
}

/** Months that have transactions, newest first. */
export async function monthsWithData(userId: string): Promise<MonthOption[]> {
  const rows = await db.$queryRaw<{ month: string; count: bigint }[]>`
    SELECT to_char("date", 'YYYY-MM') AS month, COUNT(*) AS count
    FROM "Transaction" WHERE "userId" = ${userId}
    GROUP BY 1 ORDER BY 1 DESC`;
  return rows.map((r) => ({ month: r.month, count: Number(r.count) }));
}

/** The month to show when none is picked: this month if it has data, else the latest month that does. */
export function pickMonth(requested: string | undefined, months: MonthOption[], today = todayIST()): string {
  if (requested && parseMonthKey(requested)) return requested;
  const current = today.slice(0, 7);
  if (!months.length || months.some((m) => m.month === current)) return current;
  return months[0]!.month;
}

function monthRange(month: string): { start: Date; end: Date } {
  const { year, month: m } = parseMonthKey(month)!;
  return { start: isoToUTCDate(`${month}-01`), end: isoToUTCDate(`${monthKey(year, m)}-${String(daysInMonth(year, m)).padStart(2, "0")}`) };
}

async function loadInsightTxns(userId: string, from: string, to: string): Promise<InsightTxn[]> {
  const rows = await db.transaction.findMany({
    where: { userId, date: { gte: monthRange(from).start, lte: monthRange(to).end } },
    select: { date: true, amountPaise: true, direction: true, category: true, merchant: true, merchantKey: true },
  });
  return rows.map((r) => ({ ...r, date: utcDateToIso(r.date) }));
}

export interface Dashboard {
  summary: MonthSummary;
  leaks: LeakReport;
  recurring: RecurringPayment[];
  budgets: { category: CategoryId; progress: BudgetProgress }[];
}

export async function getDashboard(userId: string, month: string, today = todayIST()): Promise<Dashboard> {
  const from = shiftMonth(month, -(RECURRING_LOOKBACK_MONTHS - 1));
  const [txns, budgets] = await Promise.all([
    loadInsightTxns(userId, from, month),
    db.budget.findMany({ where: { userId } }),
  ]);
  const inMonth = (key: string) => txns.filter((t) => t.date.startsWith(key));
  const summary = summariseMonth(month, inMonth(month), inMonth(shiftMonth(month, -1)), today);
  // For a past month, "today" for recurring purposes is that month's last day.
  const asOf = month < today.slice(0, 7) ? `${month}-${String(summary.daysInMonth).padStart(2, "0")}` : today;
  const spentBy = new Map(summary.byCategory.map((c) => [c.category, c.spentPaise]));

  return {
    summary,
    leaks: findSmallLeaks(inMonth(month)),
    recurring: detectRecurring(txns.filter((t) => t.date <= asOf), asOf).filter((r) => r.active),
    budgets: budgets.map((b) => ({
      category: b.category,
      progress: budgetProgress(b.limitPaise, spentBy.get(b.category) ?? 0, summary.daysElapsed, summary.daysInMonth),
    })),
  };
}

export interface BudgetRow {
  category: CategoryId;
  spentPaise: number;
  limitPaise: number | null;
  progress: BudgetProgress | null;
  /** Average monthly spend over the previous three months, to suggest a realistic limit. */
  typicalPaise: number;
}

export async function getBudgets(userId: string, month: string, today = todayIST()): Promise<BudgetRow[]> {
  const from = shiftMonth(month, -3);
  const [txns, budgets] = await Promise.all([loadInsightTxns(userId, from, month), db.budget.findMany({ where: { userId } })]);
  const { year, month: m } = parseMonthKey(month)!;
  const total = daysInMonth(year, m);
  const elapsed = elapsedDays(month, today);
  const limits = new Map(budgets.map((b) => [b.category, b.limitPaise]));

  return CATEGORIES.map((category) => {
    const debits = txns.filter((t) => t.direction === "DEBIT" && t.category === category);
    const spentPaise = debits.filter((t) => t.date.startsWith(month)).reduce((a, t) => a + t.amountPaise, 0);
    const earlier = debits.filter((t) => !t.date.startsWith(month)).reduce((a, t) => a + t.amountPaise, 0);
    const limitPaise = limits.get(category) ?? null;
    return {
      category,
      spentPaise,
      limitPaise,
      progress: limitPaise ? budgetProgress(limitPaise, spentPaise, elapsed, total) : null,
      typicalPaise: Math.round(earlier / 3),
    };
  });
}
