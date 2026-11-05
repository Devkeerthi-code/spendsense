import { describe, expect, it } from "vitest";
import { chunk, normaliseAiCategories } from "./ai-categories";

const sent = [
  { merchantKey: "ganesh stores", merchant: "Ganesh Stores", sample: "UPI/..." },
  { merchantKey: "q123@ybl", merchant: "Q123", sample: "UPI/..." },
];

describe("AI answer validation", () => {
  it("maps ids back to merchant keys and accepts lower-case categories", () => {
    const out = normaliseAiCategories({ results: [{ id: 0, category: "groceries" }, { id: 1, category: "OTHER" }] }, sent);
    expect([...out]).toEqual([
      ["ganesh stores", "GROCERIES"],
      ["q123@ybl", "OTHER"],
    ]);
  });

  it("drops unknown ids, made-up categories and repeated answers", () => {
    const out = normaliseAiCategories(
      { results: [{ id: 7, category: "FOOD" }, { id: 0, category: "Entertainment" }, { id: 1, category: "FOOD" }, { id: 1, category: "BILLS" }] },
      sent,
    );
    expect([...out]).toEqual([["q123@ybl", "FOOD"]]);
  });

  it("returns nothing for a malformed response", () => {
    expect(normaliseAiCategories({ answer: "Food" }, sent).size).toBe(0);
    expect(normaliseAiCategories(null, sent).size).toBe(0);
  });

  it("splits work into batches", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });
});
