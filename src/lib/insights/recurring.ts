import type { CategoryId } from "@/lib/categories";
import { addDays, daysBetween } from "@/lib/dates";
import type { InsightTxn } from "./types";

export type Cadence = "weekly" | "monthly";

export interface RecurringPayment {
  merchant: string;
  merchantKey: string;
  category: CategoryId;
  cadence: Cadence;
  typicalPaise: number;
  count: number;
  lastDate: string;
  nextDate: string;
  /** Still happening: the last charge is no older than one and a half cycles. */
  active: boolean;
  /** Rough yearly cost at this amount and cadence. */
  yearlyPaise: number;
}

const CADENCES: { cadence: Cadence; min: number; max: number; days: number; perYear: number }[] = [
  { cadence: "weekly", min: 6, max: 8, days: 7, perYear: 52 },
  { cadence: "monthly", min: 26, max: 35, days: 30, perYear: 12 },
];

/**
 * Finds payments that repeat at a steady cadence for a steady amount. Needs three charges, or two when the
 * merchant is already known to be a subscription. The amount may drift 15% (price changes, GST rounding).
 */
export function detectRecurring(txns: InsightTxn[], today: string): RecurringPayment[] {
  const byMerchant = new Map<string, InsightTxn[]>();
  for (const t of txns) {
    if (t.direction !== "DEBIT") continue;
    const list = byMerchant.get(t.merchantKey) ?? [];
    list.push(t);
    byMerchant.set(t.merchantKey, list);
  }
  const found: RecurringPayment[] = [];
  for (const group of byMerchant.values()) {
    const series = steadyAmountSeries(group);
    const match = series ? matchCadence(series, today) : null;
    if (match) found.push(match);
  }
  return found.sort((a, b) => Number(b.active) - Number(a.active) || a.nextDate.localeCompare(b.nextDate));
}

function steadyAmountSeries(group: InsightTxn[]): InsightTxn[] | null {
  const sorted = [...group].sort((a, b) => a.date.localeCompare(b.date));
  const median = medianOf(sorted.map((t) => t.amountPaise));
  const close = sorted.filter((t) => Math.abs(t.amountPaise - median) <= Math.max(median * 0.15, 5_00));
  // At most one charge per day: a double tap on the same day is not a new cycle.
  const perDay = close.filter((t, i) => i === 0 || t.date !== close[i - 1]!.date);
  return perDay.length >= 2 ? perDay : null;
}

function matchCadence(series: InsightTxn[], today: string): RecurringPayment | null {
  const last = series[series.length - 1]!;
  const minCount = last.category === "SUBSCRIPTIONS" ? 2 : 3;
  if (series.length < minCount) return null;

  const gaps = series.slice(1).map((t, i) => daysBetween(series[i]!.date, t.date));
  for (const c of CADENCES) {
    const regular = gaps.filter((g) => g >= c.min && g <= c.max).length;
    if (regular / gaps.length < 0.75) continue;
    const typicalPaise = medianOf(series.map((t) => t.amountPaise));
    return {
      merchant: last.merchant,
      merchantKey: last.merchantKey,
      category: last.category,
      cadence: c.cadence,
      typicalPaise,
      count: series.length,
      lastDate: last.date,
      nextDate: addDays(last.date, c.days),
      active: daysBetween(last.date, today) <= c.days * 1.5,
      yearlyPaise: typicalPaise * c.perYear,
    };
  }
  return null;
}

function medianOf(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid]! : Math.round((s[mid - 1]! + s[mid]!) / 2);
}
