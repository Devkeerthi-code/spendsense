import { createHash } from "node:crypto";
import type { Direction } from "@/lib/parsers/types";

export interface FingerprintInput {
  date: string;
  direction: Direction;
  amountPaise: number;
  description: string;
  /** UPI/RRN reference if the narration had one. */
  ref: string | null;
}

/**
 * Stable identity for a transaction, computed the same way for every upload so overlapping statements
 * (Oct 1-31 and Oct 15-Nov 15) insert each transaction once.
 *
 * - With a UPI reference, the reference is the identity: it survives the bank formatting the narration
 *   differently in its PDF and CSV exports.
 * - Without one, the normalised narration is used, plus an occurrence counter so two genuine ₹20 chai
 *   payments on the same day with the same narration stay two rows.
 */
export function fingerprintAll(rows: FingerprintInput[]): string[] {
  const seen = new Map<string, number>();
  return rows.map((row) => {
    const base = [row.date, row.direction, row.amountPaise, row.ref ?? normaliseNarration(row.description)].join("|");
    const occurrence = seen.get(base) ?? 0;
    seen.set(base, occurrence + 1);
    return createHash("sha256").update(`${base}|${occurrence}`).digest("hex").slice(0, 40);
  });
}

export function normaliseNarration(description: string): string {
  return description.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Splits fingerprints into those already stored and those that are new, keeping the input order. */
export function partitionNew<T extends { fingerprint: string }>(rows: T[], existing: Set<string>): { fresh: T[]; duplicates: number } {
  const fresh = rows.filter((r) => !existing.has(r.fingerprint));
  return { fresh, duplicates: rows.length - fresh.length };
}
