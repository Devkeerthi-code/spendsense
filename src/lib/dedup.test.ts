import { describe, expect, it } from "vitest";
import { fixture } from "@/lib/fixtures/load";
import { HDFC_PDF_LINES } from "@/lib/fixtures/pdf-lines";
import { fingerprintAll, partitionNew, type FingerprintInput } from "./dedup";
import { parseBankCsv } from "./parsers/csv";
import { parseStatementText } from "./parsers/statement-text";
import type { ParsedTxn } from "./parsers/types";
import { extractMerchant } from "./upi/extract";

function toInputs(rows: ParsedTxn[]): FingerprintInput[] {
  return rows.map((r) => ({ ...r, ref: extractMerchant(r.description).ref }));
}

const chai = (date: string): FingerprintInput => ({ date, direction: "DEBIT", amountPaise: 2000, description: "CHAI STALL", ref: null });

describe("dedup across uploads", () => {
  it("gives the same transaction the same fingerprint in overlapping uploads", () => {
    const october = fingerprintAll([chai("2026-10-30"), chai("2026-10-31")]);
    const overlap = fingerprintAll([chai("2026-10-31"), chai("2026-11-01")]);
    const { fresh, duplicates } = partitionNew(
      overlap.map((fingerprint) => ({ fingerprint })),
      new Set(october),
    );
    expect(duplicates).toBe(1);
    expect(fresh).toHaveLength(1);
  });

  it("keeps two genuine identical payments on the same day", () => {
    const [a, b] = fingerprintAll([chai("2026-10-31"), chai("2026-10-31")]);
    expect(a).not.toBe(b);
  });

  it("matches the CSV and PDF exports of the same HDFC statement by UPI reference", () => {
    const csv = fingerprintAll(toInputs(parseBankCsv(fixture("hdfc.csv")).rows));
    const pdf = fingerprintAll(toInputs(parseStatementText(HDFC_PDF_LINES).rows));
    expect(pdf.every((fp) => csv.includes(fp))).toBe(true);
  });

  it("ignores whitespace and punctuation differences when there is no reference", () => {
    const [a] = fingerprintAll([{ ...chai("2026-10-01"), description: "CHAI  STALL." }]);
    const [b] = fingerprintAll([{ ...chai("2026-10-01"), description: "chai stall" }]);
    expect(a).toBe(b);
  });

  it("treats a debit and a credit of the same amount as different transactions", () => {
    const [debit] = fingerprintAll([chai("2026-10-01")]);
    const [credit] = fingerprintAll([{ ...chai("2026-10-01"), direction: "CREDIT" }]);
    expect(debit).not.toBe(credit);
  });
});
