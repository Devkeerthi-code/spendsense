import { describe, expect, it, vi } from "vitest";
import type { CategoryId } from "./categories";
import { categorise, type CategoriseItem, type Classifier, type KnownRules } from "./categorise";

const item = (merchantKey: string, builtinCategory: CategoryId | null = null, direction: "DEBIT" | "CREDIT" = "DEBIT"): CategoriseItem => ({
  merchantKey,
  merchant: merchantKey,
  direction,
  builtinCategory,
  sample: `UPI/DR/000000000000/${merchantKey}`,
});

const noRules = (): KnownRules => ({ user: new Map(), ai: new Map() });

describe("rule-vs-AI categorisation", () => {
  it("never calls the AI when rules cover every merchant", async () => {
    const classify = vi.fn<Classifier>();
    const result = await categorise([item("swiggy", "FOOD"), item("uber", "TRAVEL")], noRules(), classify);
    expect(classify).not.toHaveBeenCalled();
    expect(result.assignments).toEqual([
      { category: "FOOD", source: "BUILTIN" },
      { category: "TRAVEL", source: "BUILTIN" },
    ]);
  });

  it("lets the user's own rule beat the built-in dictionary", async () => {
    const rules = noRules();
    rules.user.set("swiggy", "GROCERIES");
    const result = await categorise([item("swiggy", "FOOD")], rules, null);
    expect(result.assignments[0]).toEqual({ category: "GROCERIES", source: "RULE" });
  });

  it("reuses cached AI answers instead of asking again", async () => {
    const rules = noRules();
    rules.ai.set("ganesh stores", "GROCERIES");
    const classify = vi.fn<Classifier>();
    const result = await categorise([item("ganesh stores")], rules, classify);
    expect(classify).not.toHaveBeenCalled();
    expect(result.assignments[0]).toEqual({ category: "GROCERIES", source: "AI" });
  });

  it("sends each unknown debit merchant once, in one batch, and skips credits", async () => {
    const classify = vi.fn<Classifier>(async () => new Map([["ganesh stores", "GROCERIES"]]));
    const result = await categorise(
      [item("ganesh stores"), item("ganesh stores"), item("mystery", null, "CREDIT"), item("swiggy", "FOOD")],
      noRules(),
      classify,
    );
    expect(classify).toHaveBeenCalledTimes(1);
    expect(classify.mock.calls[0]![0].map((m) => m.merchantKey)).toEqual(["ganesh stores"]);
    expect(result.aiCategorised).toBe(2);
    expect(result.learned.get("ganesh stores")).toBe("GROCERIES");
    expect(result.assignments[2]).toEqual({ category: "OTHER", source: "NONE" });
  });

  it("falls back to Other without failing the import when the AI errors", async () => {
    const classify = vi.fn<Classifier>(async () => {
      throw new Error("503 overloaded");
    });
    const result = await categorise([item("mystery"), item("swiggy", "FOOD")], noRules(), classify);
    expect(result.aiFailed).toBe(true);
    expect(result.assignments).toEqual([
      { category: "OTHER", source: "NONE" },
      { category: "FOOD", source: "BUILTIN" },
    ]);
  });

  it("leaves merchants the AI wasn't sure about as Other", async () => {
    const classify = vi.fn<Classifier>(async () => new Map());
    const result = await categorise([item("mystery")], noRules(), classify);
    expect(result.aiFailed).toBe(false);
    expect(result.assignments[0]!.source).toBe("NONE");
  });
});
