export type BudgetState = "ok" | "warn" | "over";

export interface BudgetProgress {
  limitPaise: number;
  spentPaise: number;
  /** Whole percent used; can go past 100. */
  percent: number;
  remainingPaise: number;
  state: BudgetState;
  /** Month-end spend in this category at the current pace. */
  projectedPaise: number;
  projectedOverPaise: number;
  /** What can still be spent per remaining day to stay inside the limit (null once the month is over). */
  perDayLeftPaise: number | null;
}

export const WARN_AT_PERCENT = 80;

export function budgetProgress(limitPaise: number, spentPaise: number, daysElapsed: number, daysInMonth: number): BudgetProgress {
  if (limitPaise <= 0) throw new Error("Budget limit must be positive");
  const percent = Math.floor((spentPaise * 100) / limitPaise);
  const state: BudgetState =
    spentPaise > limitPaise ? "over" : spentPaise * 100 >= limitPaise * WARN_AT_PERCENT ? "warn" : "ok";
  const midMonth = daysElapsed > 0 && daysElapsed < daysInMonth;
  const projectedPaise = midMonth ? Math.round((spentPaise / daysElapsed) * daysInMonth) : spentPaise;
  const daysLeft = daysInMonth - daysElapsed;
  const remainingPaise = limitPaise - spentPaise;
  return {
    limitPaise,
    spentPaise,
    percent,
    remainingPaise,
    state,
    projectedPaise,
    projectedOverPaise: Math.max(0, projectedPaise - limitPaise),
    perDayLeftPaise: daysLeft > 0 ? Math.max(0, Math.floor(remainingPaise / daysLeft)) : null,
  };
}
