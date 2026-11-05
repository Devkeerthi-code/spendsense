import { CATEGORY_LABEL } from "@/lib/categories";
import { csvCell } from "@/lib/csv-cell";
import { utcDateToIso } from "@/lib/dates";
import { paiseToDecimalString } from "@/lib/money";
import { BANK_LABEL } from "@/lib/parsers/types";
import { maskedAccount } from "@/lib/privacy";
import { db } from "./db";
import { track } from "./usage";

/** Wipes every transaction, rule, budget, account and import record. With "account", the login goes too. */
export async function deleteAllData(userId: string, scope: "data" | "account"): Promise<void> {
  if (scope === "account") {
    // Logged before the delete; the cascade then detaches the event from the user (userId becomes null).
    await track("DELETE_ACCOUNT", userId);
    await db.user.delete({ where: { id: userId } });
    return;
  }
  await db.$transaction([
    db.transaction.deleteMany({ where: { userId } }),
    db.import.deleteMany({ where: { userId } }),
    db.bankAccount.deleteMany({ where: { userId } }),
    db.merchantRule.deleteMany({ where: { userId } }),
    db.budget.deleteMany({ where: { userId } }),
  ]);
  await track("DELETE_DATA", userId);
}

export async function exportCsv(userId: string): Promise<string> {
  const rows = await db.transaction.findMany({
    where: { userId },
    orderBy: [{ date: "asc" }, { id: "asc" }],
    include: { account: { select: { bank: true, last4: true } } },
  });
  const header = ["Date", "Merchant", "Category", "Money out (INR)", "Money in (INR)", "Balance (INR)", "Bank", "Account", "Bank narration"];
  const lines = rows.map((r) =>
    [
      utcDateToIso(r.date),
      r.merchant,
      CATEGORY_LABEL[r.category],
      r.direction === "DEBIT" ? paiseToDecimalString(r.amountPaise) : "",
      r.direction === "CREDIT" ? paiseToDecimalString(r.amountPaise) : "",
      r.balancePaise == null ? "" : paiseToDecimalString(r.balancePaise),
      r.account ? BANK_LABEL[r.account.bank] : "",
      r.account ? maskedAccount(r.account.last4) : "",
      r.description,
    ]
      .map(csvCell)
      .join(","),
  );
  await track("EXPORT", userId);
  return [header.join(","), ...lines].join("\r\n") + "\r\n";
}

export async function accountOverview(userId: string) {
  const [accounts, rules, txnCount, imports] = await Promise.all([
    db.bankAccount.findMany({ where: { userId }, select: { id: true, bank: true, last4: true, _count: { select: { transactions: true } } } }),
    db.merchantRule.findMany({ where: { userId, source: "USER" }, orderBy: { updatedAt: "desc" }, select: { id: true, merchantKey: true, category: true } }),
    db.transaction.count({ where: { userId } }),
    db.import.count({ where: { userId } }),
  ]);
  return { accounts, rules, txnCount, imports };
}

export async function deleteRule(userId: string, id: string): Promise<boolean> {
  const { count } = await db.merchantRule.deleteMany({ where: { id, userId, source: "USER" } });
  return count > 0;
}
