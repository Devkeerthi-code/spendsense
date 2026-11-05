import type { CategoryId } from "@/lib/categories";
import { fingerprintAll } from "@/lib/dedup";
import type { BankId, ParsedTxn } from "@/lib/parsers/types";
import { maskLongNumbers } from "@/lib/privacy";
import { extractMerchant } from "@/lib/upi/extract";

export interface EnrichedRow extends ParsedTxn {
  merchant: string;
  merchantKey: string;
  vpa: string | null;
  builtinCategory: CategoryId | null;
  fingerprint: string;
}

/**
 * Adds merchant info and a dedup fingerprint to parsed rows, then masks long numbers in the narration.
 * The fingerprint is computed from the unmasked reference first, so masking never weakens dedup.
 */
export function enrichRows(rows: ParsedTxn[], bank: BankId): EnrichedRow[] {
  const infos = rows.map((r) => extractMerchant(r.description, { preferVpaName: bank === "ICICI" }));
  const fingerprints = fingerprintAll(rows.map((r, i) => ({ ...r, ref: infos[i]!.ref })));
  return rows.map((row, i) => {
    const info = infos[i]!;
    return {
      ...row,
      description: maskLongNumbers(row.description).slice(0, 500),
      merchant: info.merchant.slice(0, 80),
      merchantKey: info.merchantKey.slice(0, 120),
      vpa: info.vpa,
      builtinCategory: info.builtinCategory,
      fingerprint: fingerprints[i]!,
    };
  });
}
