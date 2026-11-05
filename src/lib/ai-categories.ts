import { isCategory, type CategoryId } from "@/lib/categories";
import type { UnknownMerchant } from "@/lib/categorise";
import { aiCategoryResponseSchema } from "@/lib/validation/schemas";

/**
 * Maps Gemini's answer back to merchant keys. Merchants are sent with numeric ids (not their names) so the
 * model can't invent or misspell a key; unknown ids, invalid categories and duplicates are dropped.
 */
export function normaliseAiCategories(raw: unknown, sent: UnknownMerchant[]): Map<string, CategoryId> {
  const parsed = aiCategoryResponseSchema.safeParse(raw);
  const answers = new Map<string, CategoryId>();
  if (!parsed.success) return answers;
  for (const { id, category } of parsed.data.results) {
    const merchant = sent[id];
    const upper = category.toUpperCase();
    if (!merchant || !isCategory(upper) || answers.has(merchant.merchantKey)) continue;
    answers.set(merchant.merchantKey, upper);
  }
  return answers;
}

export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}
