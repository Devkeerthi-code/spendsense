import type { ColumnMapping } from "@/lib/parsers/types";

export type MoneyMode = "split" | "single";
export type Role = "date" | "description" | "debit" | "credit" | "amount" | "drCr" | "balance";
export type Picks = Record<Role, number | null>;

export const ROLE_LABEL: Record<Role, string> = {
  date: "Date",
  description: "Description",
  debit: "Money out",
  credit: "Money in",
  amount: "Amount",
  drCr: "Dr/Cr",
  balance: "Balance",
};

export const ROLES_FOR: Record<MoneyMode, Role[]> = {
  split: ["date", "description", "debit", "credit", "balance"],
  single: ["date", "description", "amount", "drCr", "balance"],
};

export const OPTIONAL: Role[] = ["balance", "drCr", "credit", "debit"];

export function initialPicks(s: Partial<ColumnMapping>): Picks {
  return {
    date: s.date ?? null,
    description: s.description ?? null,
    debit: s.debit ?? null,
    credit: s.credit ?? null,
    amount: s.amount ?? null,
    drCr: s.drCr ?? null,
    balance: s.balance ?? null,
  };
}

export function initialMode(s: Partial<ColumnMapping>): MoneyMode {
  return s.amount != null && s.debit == null && s.credit == null ? "single" : "split";
}

/** Same rules the server enforces, checked first so the person gets the message without a round trip. */
export function validate(picks: Picks, mode: MoneyMode): string | null {
  if (picks.date == null) return "Pick the column that has the date.";
  if (picks.description == null) return "Pick the column that has the description or narration.";
  if (mode === "split" && picks.debit == null && picks.credit == null) return "Pick the Money out column, the Money in column, or both.";
  if (mode === "single" && picks.amount == null) return "Pick the Amount column.";
  const used = ROLES_FOR[mode].map((r) => picks[r]).filter((v): v is number => v != null);
  if (new Set(used).size !== used.length) return "Each column can only be used once.";
  return null;
}

export function toMapping(picks: Picks, mode: MoneyMode): ColumnMapping {
  const base: ColumnMapping = { date: picks.date!, description: picks.description!, balance: picks.balance };
  return mode === "split" ? { ...base, debit: picks.debit, credit: picks.credit } : { ...base, amount: picks.amount, drCr: picks.drCr };
}
