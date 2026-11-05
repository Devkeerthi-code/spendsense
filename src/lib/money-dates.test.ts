import { describe, expect, it } from "vitest";
import { parseStatementDate, shiftMonth } from "./dates";
import { formatINR, formatINRCompact, paiseToDecimalString, parseAmountToPaise } from "./money";
import { maskLongNumbers } from "./privacy";

describe("amount parsing", () => {
  it.each([
    ["1,23,456.50", 12345650],
    ["249", 24900],
    ["0.1", 10],
    ["Rs. 1,200.00", 120000],
    ["(120.00)", -12000],
    ["-45.5", -4550],
    ["500.00 Dr", 50000],
    ["0.00", 0],
  ])("%s -> %d paise", (raw, paise) => {
    expect(parseAmountToPaise(raw)).toBe(paise);
  });

  it.each(["", "-", "abc", "12.345", "1.2.3"])("rejects %j", (raw) => {
    expect(parseAmountToPaise(raw)).toBeNull();
  });

  it("never goes through floats when adding up paise", () => {
    expect(parseAmountToPaise("0.10")! + parseAmountToPaise("0.20")!).toBe(30);
    expect(paiseToDecimalString(30)).toBe("0.30");
    expect(paiseToDecimalString(-123405)).toBe("-1234.05");
  });

  it("formats with Indian digit grouping", () => {
    expect(formatINR(12345650)).toBe("₹1,23,457");
    expect(formatINRCompact(1480000)).toBe("₹14.8k");
    expect(formatINRCompact(15000000)).toBe("₹1.5L");
  });
});

describe("statement dates", () => {
  it.each([
    ["01/10/26", "2026-10-01"],
    ["3/4/2026", "2026-04-03"],
    ["01-10-2026", "2026-10-01"],
    ["1 Oct 2026", "2026-10-01"],
    ["01-Oct-26", "2026-10-01"],
    ["05 Sept 2026", "2026-09-05"],
    ["2026-10-01", "2026-10-01"],
    ["01/10/2026 14:22:10", "2026-10-01"],
  ])("%s -> %s (always day-first)", (raw, iso) => {
    expect(parseStatementDate(raw)).toBe(iso);
  });

  it.each(["32/10/26", "29/02/2026", "13/13/2026", "Opening Balance"])("rejects %j", (raw) => {
    expect(parseStatementDate(raw)).toBeNull();
  });

  it("shifts months across years", () => {
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
  });
});

describe("masking", () => {
  it("keeps only the last four digits of long numbers", () => {
    expect(maskLongNumbers("TRANSFER TO 4897691162091 ref")).toBe("TRANSFER TO XXXXXXXXX2091 ref");
    expect(maskLongNumbers("CHQ 123456")).toBe("CHQ 123456");
  });
});
