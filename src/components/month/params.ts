import { todayIST } from "@/lib/dates";

export type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export function firstParam(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v?.trim() ? v.trim() : undefined;
}

export interface MonthOptionView {
  month: string;
  count: number;
}

/** Months the switcher can show: every month with data, plus the selected and current months even if empty. */
export function monthOptions(months: MonthOptionView[], selected: string): MonthOptionView[] {
  const list = [...months];
  for (const key of [selected, todayIST().slice(0, 7)]) {
    if (!list.some((m) => m.month === key)) list.push({ month: key, count: 0 });
  }
  return list.sort((a, b) => b.month.localeCompare(a.month));
}
