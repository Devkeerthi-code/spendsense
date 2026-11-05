/** Money is integer paise everywhere. Rupees only exist at the edges (parsing input, formatting output). */

const AMOUNT_RE = /^\(?-?(?:₹|rs\.?|inr)?\s*-?[\d,]*\d(?:\.\d{1,2})?\)?$/i;

/**
 * Parses a bank-statement amount ("1,23,456.50", "Rs. 250", "(120.00)", "-45") into paise.
 * Returns null for blanks and placeholders such as "-"; a printed "0.00" stays 0.
 */
export function parseAmountToPaise(raw: string | null | undefined): number | null {
  if (raw == null) return null;
  const cleaned = raw.trim().replace(/\s+(dr|cr)\.?$/i, "").trim();
  if (cleaned === "" || cleaned === "-" || cleaned === "--") return null;
  if (!AMOUNT_RE.test(cleaned)) return null;
  const negative = cleaned.startsWith("-") || cleaned.startsWith("(") || /^(?:₹|rs\.?|inr)\s*-/i.test(cleaned);
  const digits = cleaned.replace(/^\(?-?(?:₹|rs\.?|inr)/i, "").replace(/[^\d.]/g, "");
  const [whole = "0", frac = ""] = digits.split(".");
  const paise = Number(whole) * 100 + Number(frac.padEnd(2, "0"));
  if (!Number.isSafeInteger(paise)) return null;
  return negative ? -paise : paise;
}

/** Rupees typed by a person (e.g. a budget of "1500" or "1500.50") to paise. */
export function rupeesInputToPaise(raw: string): number | null {
  const value = parseAmountToPaise(raw);
  return value != null && value > 0 ? value : null;
}

const fullFormatter = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const paiseFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** ₹1,23,457 (Indian digit grouping, rounded to the rupee). */
export function formatINR(paise: number): string {
  return fullFormatter.format(Math.round(paise / 100));
}

/** ₹1,23,456.50, for places where exact paise matter (transaction rows, exports). */
export function formatINRExact(paise: number): string {
  return paiseFormatter.format(paise / 100);
}

/** ₹14.8k / ₹1.2L: compact labels for tight spaces. */
export function formatINRCompact(paise: number): string {
  const rupees = Math.round(paise / 100);
  if (Math.abs(rupees) >= 100_000) return `₹${trimZero(rupees / 100_000)}L`;
  if (Math.abs(rupees) >= 1_000) return `₹${trimZero(rupees / 1_000)}k`;
  return `₹${rupees}`;
}

function trimZero(n: number): string {
  return n.toFixed(1).replace(/\.0$/, "");
}

/** Plain decimal rupees for CSV export ("1234.50"), computed without floating-point drift. */
export function paiseToDecimalString(paise: number): string {
  const sign = paise < 0 ? "-" : "";
  const abs = Math.abs(paise);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}
