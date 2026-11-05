import { describe, expect, it } from "vitest";
import { csvCell } from "./csv-cell";

describe("CSV export cells", () => {
  it("quotes commas, quotes and newlines", () => {
    expect(csvCell("Swiggy, Bangalore")).toBe('"Swiggy, Bangalore"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
  });

  it("defuses spreadsheet formulas but keeps negative numbers", () => {
    expect(csvCell("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)");
    expect(csvCell("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(csvCell("-299.00")).toBe("-299.00");
  });
});
