import { describe, expect, it } from "vitest";
import { budgetProgress } from "./budget";

describe("budget maths", () => {
  it("is ok under 80%, warns from 80%, and is over only above the limit", () => {
    expect(budgetProgress(100000, 79999, 10, 30).state).toBe("ok");
    expect(budgetProgress(100000, 80000, 10, 30).state).toBe("warn");
    expect(budgetProgress(100000, 100000, 10, 30).state).toBe("warn");
    expect(budgetProgress(100000, 100001, 10, 30).state).toBe("over");
  });

  it("reports percent and remaining in whole paise", () => {
    const p = budgetProgress(300000, 125050, 10, 30);
    expect(p.percent).toBe(41);
    expect(p.remainingPaise).toBe(174950);
  });

  it("projects the month-end and flags when the pace will overshoot", () => {
    const p = budgetProgress(300000, 150000, 10, 30);
    expect(p.projectedPaise).toBe(450000);
    expect(p.projectedOverPaise).toBe(150000);
    expect(p.perDayLeftPaise).toBe(7500);
  });

  it("has no per-day allowance once the month is over or the budget is blown", () => {
    expect(budgetProgress(100000, 50000, 31, 31).perDayLeftPaise).toBeNull();
    expect(budgetProgress(100000, 150000, 10, 30).perDayLeftPaise).toBe(0);
  });

  it("rejects a non-positive limit", () => {
    expect(() => budgetProgress(0, 10, 1, 30)).toThrow();
  });
});
