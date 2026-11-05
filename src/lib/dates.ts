/**
 * Calendar dates are handled as ISO "YYYY-MM-DD" strings. Indian bank statements are always day-first,
 * so "03/04/2026" is 3 April, never 4 March.
 */

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
};

const NUMERIC_DMY = /^(\d{1,2})[/\-. ](\d{1,2})[/\-. ](\d{2}|\d{4})$/;
const NAMED_DMY = /^(\d{1,2})[\s\-/]?([a-z]{3,4})[a-z]*[\s\-/,]*(\d{2}|\d{4})$/i;
const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseStatementDate(raw: string): string | null {
  const s = raw.trim().replace(/\s+\d{1,2}:\d{2}(:\d{2})?(\s?[AP]M)?$/i, "");
  let m = ISO.exec(s);
  if (m) return build(Number(m[1]), Number(m[2]), Number(m[3]));
  m = NUMERIC_DMY.exec(s);
  if (m) return build(fullYear(m[3]!), Number(m[2]), Number(m[1]));
  m = NAMED_DMY.exec(s);
  if (m) {
    const month = MONTHS[m[2]!.toLowerCase()];
    return month ? build(fullYear(m[3]!), month, Number(m[1])) : null;
  }
  return null;
}

function fullYear(y: string): number {
  return y.length === 2 ? 2000 + Number(y) : Number(y);
}

function build(year: number, month: number, day: number): string | null {
  if (year < 2000 || year > 2100 || month < 1 || month > 12 || day < 1) return null;
  if (day > daysInMonth(year, month)) return null;
  return `${year}-${pad(month)}-${pad(day)}`;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** "2026-11" -> { year, month } or null. */
export function parseMonthKey(key: string | null | undefined): { year: number; month: number } | null {
  const m = key ? /^(\d{4})-(\d{2})$/.exec(key) : null;
  if (!m) return null;
  const month = Number(m[2]);
  return month >= 1 && month <= 12 ? { year: Number(m[1]), month } : null;
}

export function monthKey(year: number, month: number): string {
  return `${year}-${pad(month)}`;
}

export function shiftMonth(key: string, delta: number): string {
  const { year, month } = parseMonthKey(key) ?? { year: 2000, month: 1 };
  const index = year * 12 + (month - 1) + delta;
  return monthKey(Math.floor(index / 12), (index % 12) + 1);
}

/** Today's date in India, as YYYY-MM-DD (servers run in UTC). */
export function todayIST(now = new Date()): string {
  return new Date(now.getTime() + 330 * 60_000).toISOString().slice(0, 10);
}

export function isoToUTCDate(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

export function utcDateToIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
  return Math.round((isoToUTCDate(b).getTime() - isoToUTCDate(a).getTime()) / 86_400_000);
}

export function addDays(iso: string, days: number): string {
  return utcDateToIso(new Date(isoToUTCDate(iso).getTime() + days * 86_400_000));
}

const monthLabel = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "UTC" });
const shortDate = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });

export function formatMonth(key: string): string {
  const parsed = parseMonthKey(key);
  return parsed ? monthLabel.format(Date.UTC(parsed.year, parsed.month - 1, 1)) : key;
}

export function formatShortDate(iso: string): string {
  return shortDate.format(isoToUTCDate(iso));
}
