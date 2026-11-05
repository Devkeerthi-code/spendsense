import type { CategoryId } from "@/lib/categories";
import type { Direction } from "@/lib/parsers/types";

export type AssignedSource = "RULE" | "AI" | "BUILTIN" | "NONE";

export interface CategoriseItem {
  merchantKey: string;
  merchant: string;
  direction: Direction;
  builtinCategory: CategoryId | null;
  /** One raw narration, given to the AI as context for unknown merchants. */
  sample: string;
}

export interface KnownRules {
  /** "Always categorise X as Y" rules the user created by correcting a transaction. */
  user: Map<string, CategoryId>;
  /** Earlier AI answers, cached per user so the same merchant is never sent twice. */
  ai: Map<string, CategoryId>;
}

export interface UnknownMerchant {
  merchantKey: string;
  merchant: string;
  sample: string;
}

/** Returns a category for each merchant it is confident about; anything missing stays uncategorised. */
export type Classifier = (merchants: UnknownMerchant[]) => Promise<Map<string, CategoryId>>;

export interface CategoriseResult {
  assignments: { category: CategoryId; source: AssignedSource }[];
  /** New AI answers to cache as AI rules. */
  learned: Map<string, CategoryId>;
  aiCategorised: number;
  /** True when the AI was needed but failed; those rows were left as Other. */
  aiFailed: boolean;
}

export const MAX_AI_MERCHANTS_PER_IMPORT = 150;

/**
 * Rules first, AI last. Order: the user's own rules, then the built-in merchant dictionary, then cached AI answers,
 * and only then one batched AI call for merchants nobody has seen. Credits never go to the AI: money coming in
 * doesn't need a spending category.
 */
export async function categorise(items: CategoriseItem[], rules: KnownRules, classify: Classifier | null): Promise<CategoriseResult> {
  const assignments = items.map((item) => decideWithoutAi(item, rules));
  const unknown = collectUnknown(items, assignments);

  let learned = new Map<string, CategoryId>();
  let aiFailed = false;
  if (unknown.length && classify) {
    try {
      learned = await classify(unknown);
    } catch {
      aiFailed = true;
    }
  } else if (unknown.length) {
    aiFailed = true;
  }

  let aiCategorised = 0;
  items.forEach((item, i) => {
    const answer = assignments[i]!.source === "NONE" ? learned.get(item.merchantKey) : undefined;
    if (answer) {
      assignments[i] = { category: answer, source: "AI" };
      aiCategorised++;
    }
  });
  return { assignments, learned, aiCategorised, aiFailed };
}

function decideWithoutAi(item: CategoriseItem, rules: KnownRules): { category: CategoryId; source: AssignedSource } {
  const userRule = rules.user.get(item.merchantKey);
  if (userRule) return { category: userRule, source: "RULE" };
  if (item.builtinCategory) return { category: item.builtinCategory, source: "BUILTIN" };
  const cached = rules.ai.get(item.merchantKey);
  if (cached) return { category: cached, source: "AI" };
  return { category: "OTHER", source: "NONE" };
}

function collectUnknown(items: CategoriseItem[], assignments: { source: AssignedSource }[]): UnknownMerchant[] {
  const unique = new Map<string, UnknownMerchant>();
  items.forEach((item, i) => {
    if (assignments[i]!.source !== "NONE" || item.direction !== "DEBIT" || unique.has(item.merchantKey)) return;
    unique.set(item.merchantKey, { merchantKey: item.merchantKey, merchant: item.merchant, sample: item.sample });
  });
  return [...unique.values()].slice(0, MAX_AI_MERCHANTS_PER_IMPORT);
}
