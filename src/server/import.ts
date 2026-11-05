import type { Bank } from "@/generated/prisma/client";
import type { CategoryId } from "@/lib/categories";
import { categorise, type KnownRules } from "@/lib/categorise";
import { isoToUTCDate } from "@/lib/dates";
import { enrichRows, type EnrichedRow } from "@/lib/enrich";
import { parseStatementFile, type ColumnMapping, type ParseOptions } from "@/lib/parsers";
import { PdfPasswordError } from "@/lib/parsers/pdf";
import type { BankId, RowError } from "@/lib/parsers/types";
import { db } from "./db";
import { geminiClassifier } from "./gemini";
import { HttpError } from "./http";
import { countSince, track } from "./usage";

export const MAX_FILE_BYTES = 4 * 1024 * 1024;
const MAX_ROWS = 5_000;
const IMPORTS_PER_HOUR = 20;

export interface PreviewRow {
  date: string;
  merchant: string;
  description: string;
  amountPaise: number;
  direction: "DEBIT" | "CREDIT";
  category: CategoryId | null;
  duplicate: boolean;
}

export type ImportResponse =
  | { kind: "needs-password"; wrongPassword: boolean }
  | {
      kind: "needs-mapping";
      headers: string[];
      sample: string[][];
      headerIndex: number;
      suggestion: Partial<ColumnMapping>;
    }
  | {
      kind: "preview";
      bank: BankId;
      last4: string;
      fileKind: "csv" | "pdf";
      total: number;
      fresh: number;
      duplicates: number;
      firstDate: string;
      lastDate: string;
      rows: PreviewRow[];
      errors: RowError[];
    }
  | {
      kind: "imported";
      bank: BankId;
      inserted: number;
      duplicates: number;
      aiCategorised: number;
      aiFailed: boolean;
      errors: number;
      latestMonth: string;
    };

async function parseOrExplain(bytes: Uint8Array, options: ParseOptions) {
  try {
    return await parseStatementFile(bytes, options);
  } catch (err) {
    if (err instanceof PdfPasswordError) return { kind: "needs-password" as const, wrongPassword: err.wrongPassword };
    console.error("statement parse failed", err);
    throw new HttpError(422, "We couldn't read this file. If it's a scanned PDF (a photo of paper), download the statement from net banking instead.");
  }
}

/**
 * Parses an uploaded statement in memory. "preview" only reports what would happen; "commit" stores the parsed
 * transactions. The file bytes are dropped when this function returns, in both modes.
 */
export async function handleImport(userId: string, bytes: Uint8Array, mode: "preview" | "commit", options: ParseOptions): Promise<ImportResponse> {
  if (bytes.byteLength === 0) throw new HttpError(400, "That file is empty.");
  if (bytes.byteLength > MAX_FILE_BYTES) throw new HttpError(413, "That file is over 4 MB. Download a shorter date range (3-6 months) and try again.");

  const parsed = await parseOrExplain(bytes, options);
  if (!parsed) throw new HttpError(415, "This doesn't look like a CSV or PDF bank statement.");
  if (parsed.kind === "needs-password" || parsed.kind === "needs-mapping") return parsed;

  const { outcome, fileKind } = parsed;
  if (!outcome.rows.length) {
    throw new HttpError(422, "We couldn't find any transactions in this file. Check it's a transaction statement, not a summary.", {
      errors: outcome.errors.slice(0, 20),
    });
  }
  if (outcome.rows.length > MAX_ROWS) throw new HttpError(413, `That's over ${MAX_ROWS} transactions. Upload a shorter date range.`);

  const enriched = enrichRows(outcome.rows, outcome.bank);
  const existing = await existingFingerprints(userId, enriched);
  const fresh = enriched.filter((r) => !existing.has(r.fingerprint));

  if (mode === "preview") {
    const dates = enriched.map((r) => r.date).sort();
    const rules = await loadRules(userId, enriched);
    return {
      kind: "preview",
      bank: outcome.bank,
      last4: outcome.last4,
      fileKind,
      total: enriched.length,
      fresh: fresh.length,
      duplicates: enriched.length - fresh.length,
      firstDate: dates[0]!,
      lastDate: dates[dates.length - 1]!,
      rows: enriched.slice(0, 8).map((r) => ({
        date: r.date,
        merchant: r.merchant,
        description: r.description,
        amountPaise: r.amountPaise,
        direction: r.direction,
        category: rules.user.get(r.merchantKey) ?? r.builtinCategory ?? rules.ai.get(r.merchantKey) ?? null,
        duplicate: existing.has(r.fingerprint),
      })),
      errors: outcome.errors.slice(0, 20),
    };
  }

  const since = new Date(Date.now() - 60 * 60 * 1000);
  if ((await countSince("IMPORT", userId, since)) >= IMPORTS_PER_HOUR) {
    throw new HttpError(429, "That's a lot of imports in one hour. Take a break and try again later.");
  }
  return commit(userId, outcome.bank, outcome.last4, fileKind, enriched, fresh, outcome.errors.length);
}

async function existingFingerprints(userId: string, rows: EnrichedRow[]): Promise<Set<string>> {
  const found = await db.transaction.findMany({
    where: { userId, fingerprint: { in: rows.map((r) => r.fingerprint) } },
    select: { fingerprint: true },
  });
  return new Set(found.map((f) => f.fingerprint));
}

async function loadRules(userId: string, rows: EnrichedRow[]): Promise<KnownRules> {
  const keys = [...new Set(rows.map((r) => r.merchantKey))];
  const rules = await db.merchantRule.findMany({ where: { userId, merchantKey: { in: keys } } });
  const known: KnownRules = { user: new Map(), ai: new Map() };
  for (const rule of rules) (rule.source === "USER" ? known.user : known.ai).set(rule.merchantKey, rule.category);
  return known;
}

async function commit(
  userId: string,
  bank: BankId,
  last4: string,
  fileKind: "csv" | "pdf",
  all: EnrichedRow[],
  fresh: EnrichedRow[],
  errorCount: number,
): Promise<ImportResponse> {
  const rules = await loadRules(userId, fresh);
  const result = await categorise(
    fresh.map((r) => ({ merchantKey: r.merchantKey, merchant: r.merchant, direction: r.direction, builtinCategory: r.builtinCategory, sample: r.description })),
    rules,
    geminiClassifier(),
  );

  const inserted = await db.$transaction(async (tx) => {
    const account = await tx.bankAccount.upsert({
      where: { userId_bank_last4: { userId, bank: bank as Bank, last4 } },
      create: { userId, bank: bank as Bank, last4 },
      update: {},
    });
    const record = await tx.import.create({
      data: { userId, accountId: account.id, bank: bank as Bank, fileType: fileKind, rowsParsed: all.length, inserted: 0, duplicates: 0, aiCategorised: result.aiCategorised },
    });
    const created = await tx.transaction.createMany({
      data: fresh.map((r, i) => ({
        userId,
        accountId: account.id,
        importId: record.id,
        date: isoToUTCDate(r.date),
        description: r.description,
        amountPaise: r.amountPaise,
        direction: r.direction,
        balancePaise: r.balancePaise,
        merchant: r.merchant,
        merchantKey: r.merchantKey,
        vpa: r.vpa,
        category: result.assignments[i]!.category,
        categorySource: result.assignments[i]!.source,
        fingerprint: r.fingerprint,
      })),
      // A parallel upload of the same statement can't double-insert: the unique fingerprint wins.
      skipDuplicates: true,
    });
    await tx.import.update({ where: { id: record.id }, data: { inserted: created.count, duplicates: all.length - created.count } });
    if (result.learned.size) {
      await tx.merchantRule.createMany({
        data: [...result.learned].map(([merchantKey, category]) => ({ userId, merchantKey, category, source: "AI" as const })),
        skipDuplicates: true,
      });
    }
    return created.count;
  }, { timeout: 20_000 });

  await track("IMPORT", userId);
  const latest = all.map((r) => r.date).sort().at(-1)!;
  return {
    kind: "imported",
    bank,
    inserted,
    duplicates: all.length - inserted,
    aiCategorised: result.aiCategorised,
    aiFailed: result.aiFailed,
    errors: errorCount,
    latestMonth: latest.slice(0, 7),
  };
}
