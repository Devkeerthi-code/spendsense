import { describe, expect, it } from "vitest";
import { fixture } from "@/lib/fixtures/load";
import { detectCsvFormat, parseBankCsv, parseRowsWithMapping, readCsvTable, suggestMapping } from "./csv";

describe("bank CSV formats", () => {
  it("parses SBI: named-month dates, debit/credit columns, account last 4", () => {
    const out = parseBankCsv(fixture("sbi.csv"));
    expect(out.bank).toBe("SBI");
    expect(out.last4).toBe("5678");
    expect(out.rows).toHaveLength(5);
    expect(out.rows[0]).toMatchObject({ date: "2026-10-01", amountPaise: 24900, direction: "DEBIT", balancePaise: 1075100 });
    expect(out.rows[2]).toMatchObject({ date: "2026-10-03", amountPaise: 500000, direction: "CREDIT" });
    expect(out.errors).toEqual([]);
  });

  it("parses HDFC: 2-digit years, wrapped narration, bad dates reported, summary block ignored", () => {
    const out = parseBankCsv(fixture("hdfc.csv"));
    expect(out.bank).toBe("HDFC");
    expect(out.last4).toBe("4321");
    expect(out.rows.map((r) => r.amountPaise)).toEqual([41250, 32000, 15000, 6400]);
    expect(out.rows[1]!.description).toContain("LUNCH ORDER");
    expect(out.rows[2]!.direction).toBe("CREDIT");
    expect(out.errors).toEqual([{ row: 10, message: "couldn't read date '32/10/26'" }]);
  });

  it("parses ICICI: serial-number column and 0.00 placeholders", () => {
    const out = parseBankCsv(fixture("icici.csv"));
    expect(out.bank).toBe("ICICI");
    expect(out.last4).toBe("7788");
    expect(out.rows.map((r) => [r.direction, r.amountPaise])).toEqual([
      ["DEBIT", 18000],
      ["DEBIT", 45000],
      ["CREDIT", 200000],
    ]);
  });

  it("parses Axis: dd-mm-yyyy dates and negative balances", () => {
    const out = parseBankCsv(fixture("axis.csv"));
    expect(out.bank).toBe("AXIS");
    expect(out.last4).toBe("5566");
    expect(out.rows[1]).toMatchObject({ amountPaise: 400000, direction: "DEBIT", balancePaise: -29900 });
  });

  it("parses Kotak: single amount column with a Dr/Cr column", () => {
    const out = parseBankCsv(fixture("kotak.csv"));
    expect(out.bank).toBe("KOTAK");
    expect(out.rows.map((r) => r.direction)).toEqual(["DEBIT", "DEBIT", "CREDIT"]);
    expect(out.rows[1]!.amountPaise).toBe(124500);
  });
});

describe("generic CSV", () => {
  it("is not auto-detected, and the header row is found above the first dated row", () => {
    const table = readCsvTable(fixture("generic.csv"));
    const detected = detectCsvFormat(table);
    expect(detected.bank).toBe("GENERIC");
    expect(detected.mapping).toBeNull();
    expect(table[detected.headerIndex]).toEqual(["When", "What", "Money out", "Money in", "Left"]);
  });

  it("suggests mappings from common header words", () => {
    expect(suggestMapping(["Txn Date", "Narration", "Debit", "Credit", "Balance"])).toEqual({
      date: 0,
      description: 1,
      debit: 2,
      credit: 3,
      balance: 4,
    });
  });

  it("parses with the user's mapping", () => {
    const table = readCsvTable(fixture("generic.csv"));
    const out = parseRowsWithMapping(table, 1, { date: 0, description: 1, debit: 2, credit: 3, balance: 4 }, "GENERIC");
    expect(out.rows).toEqual([
      { date: "2026-10-01", description: "UPI/DR/412300000051/BLINKIT/Groceries", amountPaise: 35600, direction: "DEBIT", balancePaise: 464400 },
      { date: "2026-10-02", description: "UPI/CR/412300000052/DEMO PARENT/Allowance", amountPaise: 300000, direction: "CREDIT", balancePaise: 764400 },
    ]);
  });

  it("treats a single signed amount column as negative = money out", () => {
    const table = [
      ["Date", "Details", "Amount"],
      ["05/10/2026", "Canteen", "-45.50"],
      ["06/10/2026", "Refund", "100"],
    ];
    const out = parseRowsWithMapping(table, 0, { date: 0, description: 1, amount: 2 }, "GENERIC");
    expect(out.rows.map((r) => [r.direction, r.amountPaise])).toEqual([
      ["DEBIT", 4550],
      ["CREDIT", 10000],
    ]);
  });
});
