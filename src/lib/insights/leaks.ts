import type { InsightTxn } from "./types";

export const SMALL_PAYMENT_LIMIT_PAISE = 200_00;
export const MIN_LEAK_COUNT = 4;

export interface LeakGroup {
  merchant: string;
  merchantKey: string;
  count: number;
  totalPaise: number;
  averagePaise: number;
}

export interface LeakReport {
  thresholdPaise: number;
  /** All small debits in the period, not just the grouped ones. */
  count: number;
  totalPaise: number;
  /** Merchants paid small amounts again and again, biggest total first. */
  groups: LeakGroup[];
  /** Individual small amounts, for the coins-in-a-jar visual. */
  amounts: number[];
}

/** Small leaks: payments of up to 200 rupees that feel like nothing one at a time but add up over a month. */
export function findSmallLeaks(txns: InsightTxn[], thresholdPaise = SMALL_PAYMENT_LIMIT_PAISE): LeakReport {
  const small = txns.filter((t) => t.direction === "DEBIT" && t.amountPaise <= thresholdPaise);
  const groups = new Map<string, LeakGroup>();
  for (const t of small) {
    const g = groups.get(t.merchantKey) ?? { merchant: t.merchant, merchantKey: t.merchantKey, count: 0, totalPaise: 0, averagePaise: 0 };
    g.count++;
    g.totalPaise += t.amountPaise;
    groups.set(t.merchantKey, g);
  }
  const repeated = [...groups.values()]
    .filter((g) => g.count >= MIN_LEAK_COUNT)
    .map((g) => ({ ...g, averagePaise: Math.round(g.totalPaise / g.count) }))
    .sort((a, b) => b.totalPaise - a.totalPaise);
  return {
    thresholdPaise,
    count: small.length,
    totalPaise: small.reduce((acc, t) => acc + t.amountPaise, 0),
    groups: repeated,
    amounts: small.map((t) => t.amountPaise),
  };
}
