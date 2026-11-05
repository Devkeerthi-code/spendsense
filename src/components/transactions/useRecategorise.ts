"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CATEGORY_LABEL, type CategoryId } from "@/lib/categories";
import { api, jsonInit, messageOf } from "@/client/api";
import type { RecategoriseResult, TxnRow } from "@/server/transactions";

type SetRows = (update: (rows: TxnRow[]) => TxnRow[]) => void;

function applyLocally(rows: TxnRow[], result: RecategoriseResult, merchantKey: string, applyToMerchant: boolean): TxnRow[] {
  return rows.map((r) => {
    if (r.id === result.id) return { ...r, category: result.category, categorySource: "USER" };
    if (applyToMerchant && r.merchantKey === merchantKey && r.categorySource !== "USER") {
      return { ...r, category: result.category, categorySource: "RULE" };
    }
    return r;
  });
}

/** PATCHes a category, mirrors the server's effect in local rows, and offers Undo for one-off changes. */
export function useRecategorise(setRows: SetRows) {
  const [pending, setPending] = useState(false);
  const [changedId, setChangedId] = useState<string | null>(null);

  async function send(txn: TxnRow, category: CategoryId, applyToMerchant: boolean): Promise<RecategoriseResult | null> {
    setPending(true);
    try {
      const result = await api<RecategoriseResult>(`/api/transactions/${txn.id}`, jsonInit("PATCH", { category, applyToMerchant }));
      setRows((rows) => applyLocally(rows, result, txn.merchantKey, applyToMerchant));
      setChangedId(txn.id);
      return result;
    } catch (err) {
      toast.error(messageOf(err));
      return null;
    } finally {
      setPending(false);
    }
  }

  async function change(txn: TxnRow, category: CategoryId, applyToMerchant: boolean): Promise<boolean> {
    if (category === txn.category && !applyToMerchant) return true;
    const result = await send(txn, category, applyToMerchant);
    if (!result) return false;
    const label = CATEGORY_LABEL[result.category];
    if (applyToMerchant) {
      const others = result.alsoUpdated ? ` ${result.alsoUpdated} other transaction${result.alsoUpdated === 1 ? "" : "s"} moved too.` : "";
      toast.success(`${result.merchant} will always be ${label}.${others}`);
    } else {
      toast.success(`Moved to ${label}`, {
        action: { label: "Undo", onClick: () => void send({ ...txn, category: result.category }, result.previousCategory, false) },
      });
    }
    return true;
  }

  return { change, pending, changedId };
}
