import { CATEGORIES, type CategoryId } from "@/lib/categories";
import { daysInMonth, parseMonthKey } from "@/lib/dates";
import type { InsightTxn } from "./types";

export interface CategorySpend {
  category: CategoryId;
  spentPaise: number;
  previousPaise: number;
  /** Percent change vs last month, or null when last month had nothing to compare with. */
  changePct: number | null;
  count: number;
}

export interface MerchantSpend {
  merchant: string;
  merchantKey: string;
  spentPaise: number;
  count: number;
}

export interface MonthSummary {
  month: string;
  spentPaise: number;
  receivedPaise: number;
  previousSpentPaise: number;
  txnCount: number;
  daysInMonth: number;
  /** Days of the month that have happened (all of them for a past month, 0 for a future one). */
  daysElapsed: number;
  dailyAveragePaise: number;
  /**
   * Month-end spend: monthly bills counted once, everything else at the current daily pace.
   * Equals the actual spend once the month is over.
   */
  projectedPaise: number;
  isCurrentMonth: boolean;
  byCategory: CategorySpend[];
  topMerchants: MerchantSpend[];
  /** Spend per day of the month, index 0 = the 1st. */
  daily: number[];
}

export function percentChange(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return Math.round(((current - previous) * 100) / previous);
}

export function elapsedDays(month: string, today: string): number {
  const { year, month: m } = parseMonthKey(month)!;
  const total = daysInMonth(year, m);
  const currentKey = today.slice(0, 7);
  if (month < currentKey) return total;
  if (month > currentKey) return 0;
  return Number(today.slice(8, 10));
}

/**
 * Paid once a month (rent, subscriptions, recharges, fees). Projecting them at a daily pace would turn
 * hostel rent paid on the 1st into thirty rents, so they are counted once and only the rest is extrapolated.
 */
const FIXED_CATEGORIES = new Set<CategoryId>(["RENT", "SUBSCRIPTIONS", "BILLS", "EDUCATION"]);

export function summariseMonth(month: string, current: InsightTxn[], previous: InsightTxn[], today: string): MonthSummary {
  const { year, month: m } = parseMonthKey(month)!;
  const total = daysInMonth(year, m);
  const daysElapsed = elapsedDays(month, today);
  const isCurrentMonth = month === today.slice(0, 7);
  const debits = current.filter((t) => t.direction === "DEBIT");
  // Mid-month, compare like with like: the 1st-5th of this month against the 1st-5th of last month.
  const previousDebits = previous.filter((t) => t.direction === "DEBIT" && (!isCurrentMonth || Number(t.date.slice(8, 10)) <= daysElapsed));
  const spentPaise = sum(debits);
  const daily = new Array<number>(total).fill(0);
  for (const t of debits) {
    const day = Number(t.date.slice(8, 10)) - 1;
    daily[day] = (daily[day] ?? 0) + t.amountPaise;
  }

  const monthOver = daysElapsed >= total || daysElapsed === 0;
  const fixedPaise = sum(debits.filter((t) => FIXED_CATEGORIES.has(t.category)));
  const variablePace = ((spentPaise - fixedPaise) / Math.max(daysElapsed, 1)) * total;
  return {
    month,
    spentPaise,
    receivedPaise: sum(current.filter((t) => t.direction === "CREDIT")),
    previousSpentPaise: sum(previousDebits),
    txnCount: current.length,
    daysInMonth: total,
    daysElapsed,
    dailyAveragePaise: daysElapsed ? Math.round(spentPaise / daysElapsed) : 0,
    projectedPaise: monthOver ? spentPaise : fixedPaise + Math.round(variablePace),
    isCurrentMonth,
    byCategory: byCategory(debits, previousDebits),
    topMerchants: topMerchants(debits, 5),
    daily,
  };
}

function byCategory(current: InsightTxn[], previous: InsightTxn[]): CategorySpend[] {
  return CATEGORIES.map((category) => {
    const now = current.filter((t) => t.category === category);
    const spent = sum(now);
    const before = sum(previous.filter((t) => t.category === category));
    return { category, spentPaise: spent, previousPaise: before, changePct: percentChange(spent, before), count: now.length };
  })
    .filter((c) => c.spentPaise > 0 || c.previousPaise > 0)
    .sort((a, b) => b.spentPaise - a.spentPaise || b.previousPaise - a.previousPaise);
}

export function topMerchants(debits: InsightTxn[], limit: number): MerchantSpend[] {
  const groups = new Map<string, MerchantSpend>();
  for (const t of debits) {
    const g = groups.get(t.merchantKey) ?? { merchant: t.merchant, merchantKey: t.merchantKey, spentPaise: 0, count: 0 };
    g.spentPaise += t.amountPaise;
    g.count++;
    groups.set(t.merchantKey, g);
  }
  return [...groups.values()].sort((a, b) => b.spentPaise - a.spentPaise).slice(0, limit);
}

function sum(txns: InsightTxn[]): number {
  return txns.reduce((acc, t) => acc + t.amountPaise, 0);
}
