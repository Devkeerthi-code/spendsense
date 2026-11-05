import { describe, expect, it } from "vitest";
import type { CategoryId } from "@/lib/categories";
import { findSmallLeaks } from "./leaks";
import { percentChange, summariseMonth } from "./month";
import { detectRecurring } from "./recurring";
import type { InsightTxn } from "./types";

const debit = (date: string, rupees: number, merchantKey: string, category: CategoryId = "OTHER"): InsightTxn => ({
  date,
  amountPaise: rupees * 100,
  direction: "DEBIT",
  category,
  merchant: merchantKey,
  merchantKey,
});

describe("recurring payment detection", () => {
  it("finds a monthly subscription from two charges and predicts the next one", () => {
    const found = detectRecurring(
      [debit("2026-09-05", 119, "spotify", "SUBSCRIPTIONS"), debit("2026-10-05", 119, "spotify", "SUBSCRIPTIONS")],
      "2026-10-20",
    );
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({ cadence: "monthly", typicalPaise: 11900, nextDate: "2026-11-04", active: true, yearlyPaise: 142800 });
  });

  it("needs three charges for merchants that aren't known subscriptions", () => {
    const two = [debit("2026-09-01", 4000, "karthik", "TRANSFERS"), debit("2026-10-01", 4000, "karthik", "TRANSFERS")];
    expect(detectRecurring(two, "2026-10-10")).toEqual([]);
    const three = [...two, debit("2026-11-01", 4000, "karthik", "TRANSFERS")];
    expect(detectRecurring(three, "2026-11-10")[0]).toMatchObject({ merchantKey: "karthik", cadence: "monthly" });
  });

  it("detects weekly payments and tolerates small price changes", () => {
    const weekly = ["2026-10-01", "2026-10-08", "2026-10-15", "2026-10-22"].map((d, i) => debit(d, 300 + i * 5, "laundry"));
    expect(detectRecurring(weekly, "2026-10-25")[0]).toMatchObject({ cadence: "weekly", count: 4 });
  });

  it("ignores frequent orders of varying amounts", () => {
    const orders = [debit("2026-10-01", 249, "swiggy"), debit("2026-10-31", 612, "swiggy"), debit("2026-11-30", 95, "swiggy")];
    expect(detectRecurring(orders, "2026-12-01")).toEqual([]);
  });

  it("marks a subscription inactive once it stops", () => {
    const old = [debit("2026-05-05", 199, "netflix", "SUBSCRIPTIONS"), debit("2026-06-05", 199, "netflix", "SUBSCRIPTIONS")];
    expect(detectRecurring(old, "2026-10-20")[0]!.active).toBe(false);
  });
});

describe("small leaks", () => {
  it("adds up many small payments and groups the repeat merchants", () => {
    const chai = Array.from({ length: 23 }, (_, i) => debit(`2026-10-${String(i + 1).padStart(2, "0")}`, 80, "chai"));
    const report = findSmallLeaks([...chai, debit("2026-10-02", 30, "xerox"), debit("2026-10-03", 1200, "swiggy")]);
    expect(report.count).toBe(24);
    expect(report.totalPaise).toBe(23 * 8000 + 3000);
    expect(report.groups).toEqual([{ merchant: "chai", merchantKey: "chai", count: 23, totalPaise: 184000, averagePaise: 8000 }]);
  });
});

describe("month summary", () => {
  const current = [debit("2026-11-01", 500, "swiggy", "FOOD"), debit("2026-11-02", 250, "uber", "TRAVEL"), debit("2026-11-02", 250, "swiggy", "FOOD")];
  const previous = [debit("2026-10-02", 500, "swiggy", "FOOD")];

  it("projects month-end spend from the pace so far", () => {
    const s = summariseMonth("2026-11", current, previous, "2026-11-05");
    expect(s.spentPaise).toBe(100000);
    expect(s.daysElapsed).toBe(5);
    expect(s.dailyAveragePaise).toBe(20000);
    expect(s.projectedPaise).toBe(600000);
    expect(s.daily.slice(0, 3)).toEqual([50000, 50000, 0]);
  });

  it("counts rent once instead of projecting it at a daily pace", () => {
    const withRent = [...current, debit("2026-11-01", 6500, "sunrise pg", "RENT")];
    const s = summariseMonth("2026-11", withRent, [], "2026-11-05");
    expect(s.projectedPaise).toBe(650000 + 600000);
  });

  it("compares the current month with the same days of last month", () => {
    const lastMonth = [debit("2026-10-03", 300, "swiggy", "FOOD"), debit("2026-10-20", 900, "swiggy", "FOOD")];
    const s = summariseMonth("2026-11", current, lastMonth, "2026-11-05");
    expect(s.previousSpentPaise).toBe(30000);
    expect(s.byCategory[0]).toMatchObject({ category: "FOOD", previousPaise: 30000, changePct: 150 });
  });

  it("uses the actual total for a finished month", () => {
    const s = summariseMonth("2026-10", previous, [], "2026-11-05");
    expect(s.projectedPaise).toBe(50000);
    expect(s.dailyAveragePaise).toBe(Math.round(50000 / 31));
  });

  it("compares each category with last month", () => {
    const s = summariseMonth("2026-11", current, previous, "2026-11-05");
    expect(s.byCategory.map((c) => [c.category, c.spentPaise, c.changePct])).toEqual([
      ["FOOD", 75000, 50],
      ["TRAVEL", 25000, null],
    ]);
    expect(s.topMerchants[0]).toMatchObject({ merchantKey: "swiggy", spentPaise: 75000, count: 2 });
  });

  it("has no percent change when last month was empty", () => {
    expect(percentChange(100, 0)).toBeNull();
    expect(percentChange(50, 200)).toBe(-75);
  });
});
