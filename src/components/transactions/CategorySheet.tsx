"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CATEGORIES, CATEGORY_LABEL, type CategoryId } from "@/lib/categories";
import { CategoryIcon } from "@/components/category/CategoryIcon";
import { tint } from "@/components/category/meta";
import { useSheetDrag } from "@/client/useSheetDrag";
import type { TxnRow } from "@/server/transactions";

interface Props {
  txn: TxnRow | null;
  pending: boolean;
  onPick: (category: CategoryId, applyToMerchant: boolean) => void;
  onClose: () => void;
}

/** Re-categorise: a bottom sheet on phones, a centred dialog on desktop. Native <dialog> handles focus and Esc. */
export function CategorySheet({ txn, pending, onPick, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [always, setAlways] = useState(false);
  const [stamped, setStamped] = useState<CategoryId | null>(null);
  const { handleProps, sheetStyle } = useSheetDrag(onClose);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (txn && !dialog.open) dialog.showModal();
    if (!txn && dialog.open) dialog.close();
  }, [txn]);

  function pick(category: CategoryId) {
    setStamped(category);
    onPick(category, always);
  }

  return (
    <dialog
      ref={ref}
      onClose={() => {
        setAlways(false);
        setStamped(null);
        onClose();
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      aria-labelledby="sheet-title"
      className="sheet m-0 mt-auto w-full max-w-none bg-transparent p-0 text-ink backdrop:bg-ink/40 sm:m-auto sm:max-w-lg"
    >
      <div style={sheetStyle} className="sheet-panel rounded-t-md bg-surface pb-[max(16px,env(safe-area-inset-bottom))] shadow-lift sm:rounded-md">
        <div {...handleProps} className="flex touch-none justify-center pt-3 pb-1 sm:hidden" aria-hidden>
          <span className="h-1 w-10 rounded-full bg-line-strong" />
        </div>
        {txn && (
          <div className="px-4 pt-2 sm:px-6 sm:pt-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 id="sheet-title" className="text-h3 font-semibold">
                  Category for {txn.merchant}
                </h2>
                <p className="num mt-1 truncate text-caption text-muted">{txn.description}</p>
              </div>
              <button type="button" onClick={onClose} aria-label="Close" className="press -mt-1 -mr-2 flex size-10 shrink-0 items-center justify-center rounded-md hover:bg-sunken">
                <X aria-hidden size={18} />
              </button>
            </div>
            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-md border border-line bg-paper p-3 text-sm">
              <input
                type="checkbox"
                checked={always}
                onChange={(e) => setAlways(e.target.checked)}
                className="mt-0.5 size-4 shrink-0 accent-(--accent-ink)"
              />
              <span>
                Always categorise <span className="font-semibold">{txn.merchant}</span> like this
                <span className="block text-caption text-muted">Moves its other transactions too, and every future import.</span>
              </span>
            </label>
            <ul className="mt-4 grid grid-cols-2 gap-2 pb-2">
              {CATEGORIES.map((c) => {
                const current = c === txn.category;
                return (
                  <li key={c}>
                    <button
                      type="button"
                      disabled={pending}
                      aria-pressed={current}
                      onClick={() => pick(c)}
                      className={`press flex h-12 w-full items-center gap-2 rounded-md border px-3 text-left text-sm font-medium disabled:opacity-60 ${
                        stamped === c ? "animate-stamp" : ""
                      } ${current ? "border-ink" : "border-line hover:border-line-strong"}`}
                      style={{ backgroundColor: tint(c, current ? 22 : 8) }}
                    >
                      <CategoryIcon category={c} />
                      <span className="leading-tight">{CATEGORY_LABEL[c]}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </dialog>
  );
}
