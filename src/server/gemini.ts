import { ApiError, GoogleGenAI } from "@google/genai";
import { chunk, normaliseAiCategories } from "@/lib/ai-categories";
import { CATEGORIES, CATEGORY_LABEL, type CategoryId } from "@/lib/categories";
import type { Classifier, UnknownMerchant } from "@/lib/categorise";

const BATCH_SIZE = 40;
const PARALLEL_BATCHES = 3;
const TOTAL_BUDGET_MS = 25_000;
const FALLBACK_MODELS = ["gemini-flash-lite-latest"];
const RETRYABLE = new Set([429, 500, 502, 503, 504]);

const PROMPT = `You categorise payees from an Indian college student's bank statement (mostly UPI payments).
For each payee, pick exactly one category id:
${CATEGORIES.map((c) => `- ${c}: ${CATEGORY_LABEL[c]}`).join("\n")}

Guidance: canteens, cafes, restaurants, food delivery -> FOOD. Kirana, supermarkets, vegetables, milk -> GROCERIES.
Cabs, autos, buses, trains, metro, fuel -> TRAVEL. Phone recharges, electricity, wifi -> BILLS.
Hostel, PG, rent -> RENT. Fees, courses, books, stationery, xerox -> EDUCATION.
A payee that is clearly an individual person's name -> TRANSFERS.
If you can't tell, use OTHER. Never guess a brand you don't recognise.
Answer with the numeric id you were given for each payee.`;

const responseJsonSchema = {
  type: "object",
  properties: {
    results: {
      type: "array",
      items: {
        type: "object",
        properties: { id: { type: "integer" }, category: { type: "string", enum: [...CATEGORIES] } },
        required: ["id", "category"],
      },
    },
  },
  required: ["results"],
};

export function aiAvailable(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

function modelsToTry(): string[] {
  const primary = process.env.GEMINI_MODEL || "gemini-flash-latest";
  return [primary, ...FALLBACK_MODELS.filter((m) => m !== primary)];
}

function isRetryable(err: unknown): boolean {
  if (err instanceof ApiError) return RETRYABLE.has(err.status);
  return err instanceof Error && (err.name === "AbortError" || err.name === "TimeoutError");
}

async function classifyBatch(ai: GoogleGenAI, batch: UnknownMerchant[], deadline: number): Promise<Map<string, CategoryId>> {
  // Only the payee name and a masked narration are sent: no amounts, dates or account details.
  const payload = batch.map((m, id) => ({ id, payee: m.merchant, narration: m.sample.slice(0, 120) }));
  let lastError: unknown;
  for (const model of modelsToTry()) {
    const remaining = deadline - Date.now();
    if (remaining < 2_000) break;
    try {
      const res = await ai.models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: `${PROMPT}\n\nPayees:\n${JSON.stringify(payload)}` }] }],
        config: { responseMimeType: "application/json", responseJsonSchema, temperature: 0, abortSignal: AbortSignal.timeout(remaining) },
      });
      return normaliseAiCategories(JSON.parse(res.text ?? "null"), batch);
    } catch (err) {
      lastError = err;
      if (!isRetryable(err)) break;
    }
  }
  throw lastError ?? new Error("Gemini timed out");
}

/** Batched, time-boxed Gemini classifier. Throws if every batch failed; partial answers are kept. */
export function geminiClassifier(): Classifier | null {
  if (!aiAvailable()) return null;
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return async (merchants) => {
    const deadline = Date.now() + TOTAL_BUDGET_MS;
    const merged = new Map<string, CategoryId>();
    let failures = 0;
    const batches = chunk(merchants, BATCH_SIZE);
    for (const group of chunk(batches, PARALLEL_BATCHES)) {
      const settled = await Promise.allSettled(group.map((batch) => classifyBatch(ai, batch, deadline)));
      for (const result of settled) {
        if (result.status === "fulfilled") result.value.forEach((v, k) => merged.set(k, v));
        else {
          failures++;
          console.error("gemini batch failed", result.reason);
        }
      }
    }
    if (failures === batches.length) throw new Error("All AI batches failed");
    return merged;
  };
}
