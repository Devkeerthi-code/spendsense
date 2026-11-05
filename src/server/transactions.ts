import type { Prisma } from "@/generated/prisma/client";
import type { CategoryId } from "@/lib/categories";
import { isoToUTCDate, shiftMonth, utcDateToIso } from "@/lib/dates";
import { db } from "./db";
import { HttpError } from "./http";
import { track } from "./usage";

export const PAGE_SIZE = 50;

export interface TxnRow {
  id: string;
  date: string;
  merchant: string;
  merchantKey: string;
  description: string;
  amountPaise: number;
  direction: "DEBIT" | "CREDIT";
  category: CategoryId;
  categorySource: "USER" | "RULE" | "AI" | "BUILTIN" | "NONE";
}

export interface TxnFilter {
  month?: string;
  category?: CategoryId;
  q?: string;
  cursor?: string;
}

function whereFor(userId: string, f: TxnFilter): Prisma.TransactionWhereInput {
  const where: Prisma.TransactionWhereInput = { userId };
  if (f.month) where.date = { gte: isoToUTCDate(`${f.month}-01`), lt: isoToUTCDate(`${shiftMonth(f.month, 1)}-01`) };
  if (f.category) where.category = f.category;
  if (f.q) {
    where.OR = [
      { merchant: { contains: f.q, mode: "insensitive" } },
      { description: { contains: f.q, mode: "insensitive" } },
    ];
  }
  return where;
}

export async function listTransactions(userId: string, filter: TxnFilter): Promise<{ rows: TxnRow[]; nextCursor: string | null }> {
  const rows = await db.transaction.findMany({
    where: whereFor(userId, filter),
    orderBy: [{ date: "desc" }, { id: "desc" }],
    take: PAGE_SIZE + 1,
    ...(filter.cursor ? { cursor: { id: filter.cursor }, skip: 1 } : {}),
    select: {
      id: true,
      date: true,
      merchant: true,
      merchantKey: true,
      description: true,
      amountPaise: true,
      direction: true,
      category: true,
      categorySource: true,
    },
  });
  const page = rows.slice(0, PAGE_SIZE).map((r) => ({ ...r, date: utcDateToIso(r.date) }));
  return { rows: page, nextCursor: rows.length > PAGE_SIZE ? page[page.length - 1]!.id : null };
}

export interface RecategoriseResult {
  id: string;
  category: CategoryId;
  previousCategory: CategoryId;
  /** Other transactions from the same merchant that were also moved (only when a rule was created). */
  alsoUpdated: number;
  merchant: string;
}

/**
 * Changes one transaction's category. With applyToMerchant, the correction becomes the user's rule for that
 * merchant: it re-labels the merchant's other transactions (except ones the user set by hand) and every future import.
 */
export async function recategorise(userId: string, id: string, category: CategoryId, applyToMerchant: boolean): Promise<RecategoriseResult> {
  const txn = await db.transaction.findFirst({ where: { id, userId }, select: { id: true, category: true, merchantKey: true, merchant: true } });
  if (!txn) throw new HttpError(404, "That transaction no longer exists. Refresh the page.");

  const alsoUpdated = await db.$transaction(async (tx) => {
    await tx.transaction.update({ where: { id }, data: { category, categorySource: "USER" } });
    if (!applyToMerchant) return 0;
    await tx.merchantRule.upsert({
      where: { userId_merchantKey: { userId, merchantKey: txn.merchantKey } },
      create: { userId, merchantKey: txn.merchantKey, category, source: "USER" },
      update: { category, source: "USER" },
    });
    const moved = await tx.transaction.updateMany({
      where: { userId, merchantKey: txn.merchantKey, categorySource: { not: "USER" }, id: { not: id } },
      data: { category, categorySource: "RULE" },
    });
    return moved.count;
  });

  await track("RECATEGORISE", userId);
  return { id, category, previousCategory: txn.category, alsoUpdated, merchant: txn.merchant };
}
