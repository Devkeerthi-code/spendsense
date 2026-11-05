import { describe, expect, it } from "vitest";
import { AXIS_PDF_LINES, HDFC_PDF_LINES, ICICI_PDF_LINES, KOTAK_PDF_LINES, SBI_PDF_LINES } from "@/lib/fixtures/pdf-lines";
import { parseStatementText, splitTrailingAmounts } from "./statement-text";

describe("PDF statement text", () => {
  it("SBI: uses the opening balance to tell debits from credits and joins wrapped narration", () => {
    const out = parseStatementText(SBI_PDF_LINES);
    expect(out.bank).toBe("SBI");
    expect(out.last4).toBe("5678");
    expect(out.rows.map((r) => [r.date, r.direction, r.amountPaise])).toEqual([
      ["2026-10-01", "DEBIT", 24900],
      ["2026-10-03", "CREDIT", 500000],
      ["2026-10-05", "DEBIT", 11900],
    ]);
    expect(out.rows[1]!.description.endsWith("Pocket money--")).toBe(true);
    expect(out.rows[2]!.description).not.toContain("computer generated");
  });

  it("HDFC: infers direction from the running balance when no opening balance is printed", () => {
    const out = parseStatementText(HDFC_PDF_LINES);
    expect(out.bank).toBe("HDFC");
    expect(out.rows.map((r) => r.direction)).toEqual(["DEBIT", "CREDIT"]);
    expect(out.rows[0]!.description).toContain("412300000011");
  });

  it("ICICI: serial numbers, value dates and explicit 0.00 columns", () => {
    const out = parseStatementText(ICICI_PDF_LINES);
    expect(out.bank).toBe("ICICI");
    expect(out.rows.map((r) => [r.direction, r.amountPaise, r.balancePaise])).toEqual([
      ["DEBIT", 18000, 682000],
      ["CREDIT", 200000, 882000],
    ]);
  });

  it("Axis: ignores the trailing branch code and reads Dr balances", () => {
    const out = parseStatementText(AXIS_PDF_LINES);
    expect(out.bank).toBe("AXIS");
    expect(out.last4).toBe("5566");
    expect(out.rows[1]).toMatchObject({ amountPaise: 400000, direction: "DEBIT", balancePaise: -29900 });
  });

  it("Kotak: named-month dates and (Cr) balance markers", () => {
    const out = parseStatementText(KOTAK_PDF_LINES);
    expect(out.bank).toBe("KOTAK");
    expect(out.rows.map((r) => [r.date, r.direction])).toEqual([
      ["2026-10-01", "DEBIT"],
      ["2026-10-03", "CREDIT"],
    ]);
  });

  it("reports a dated line that never shows an amount", () => {
    const out = parseStatementText(["01/10/2026 UPI/SOMETHING", "05/10/2026 UPI/OTHER 10.00 90.00"]);
    expect(out.errors).toEqual([{ row: 1, message: "couldn't find an amount on this line" }]);
    expect(out.rows).toHaveLength(1);
  });

  it("splits trailing money tokens but not reference numbers", () => {
    expect(splitTrailingAmounts("UPI/412300000001/SWIGGY 249.00 10,751.00")).toEqual({
      text: "UPI/412300000001/SWIGGY",
      amounts: [
        { paise: 24900, marker: null },
        { paise: 1075100, marker: null },
      ],
    });
    expect(splitTrailingAmounts("CHQ 123456").amounts).toEqual([]);
  });
});
