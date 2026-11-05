import { last4Of } from "@/lib/privacy";

const ACCOUNT_RE = /(?:a\/c|acct|account)\s*(?:no|number|num|#)?\.?\s*[:\-]?\s*([0-9Xx*\s-]{6,30}\d{4})/i;

/** Finds the account number printed in a statement's header and keeps only its last four digits. */
export function findAccountLast4(text: string): string {
  const match = ACCOUNT_RE.exec(text.slice(0, 6000));
  return match ? last4Of(match[1]) : "";
}
