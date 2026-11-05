import { describe, expect, it } from "vitest";
import { buildPdf } from "@/lib/fixtures/load";
import { SBI_PDF_LINES } from "@/lib/fixtures/pdf-lines";
import { parseStatementFile } from "./index";
import { groupIntoLines } from "./pdf";

describe("PDF import end to end", () => {
  it("extracts lines from a real PDF and parses them", async () => {
    const result = await parseStatementFile(buildPdf(SBI_PDF_LINES));
    expect(result?.kind).toBe("parsed");
    if (result?.kind !== "parsed") return;
    expect(result.fileKind).toBe("pdf");
    expect(result.outcome.bank).toBe("SBI");
    expect(result.outcome.rows).toHaveLength(3);
  });

  it("rejects files that are neither PDF nor CSV", async () => {
    expect(await parseStatementFile(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 1, 2, 3]))).toBeNull();
  });

  it("groups text items that share a baseline, left to right", () => {
    const lines = groupIntoLines([
      { str: "249.00", x: 400, y: 700, fontSize: 9 },
      { str: "01/10/26", x: 30, y: 700.8, fontSize: 9 },
      { str: "SWIGGY", x: 90, y: 699.5, fontSize: 9 },
      { str: "next", x: 30, y: 688, fontSize: 9 },
    ]);
    expect(lines).toEqual(["01/10/26 SWIGGY 249.00", "next"]);
  });
});
