"use client";

import { CATEGORY_LABEL } from "@/lib/categories";
import { formatShortDate } from "@/lib/dates";
import { formatINRExact } from "@/lib/money";
import { BANK_LABEL } from "@/lib/parsers/types";
import { maskedAccount } from "@/lib/privacy";
import { CategoryChip } from "@/components/category/CategoryChip";
import { Button, LinkButton } from "@/components/ui/Button";
import type { PreviewRow } from "@/server/import";
import { RowErrors } from "./RowErrors";
import type { Step } from "./useImportFlow";

type Preview = Extract<Step, { kind: "preview" }>;

function PreviewLine({ row, index }: { row: PreviewRow; index: number }) {
  const credit = row.direction === "CREDIT";
  return (
    <li className={`animate-rise py-3 ${row.duplicate ? "opacity-55" : ""}`} style={{ animationDelay: `${index * 25}ms` }}>
      <p className="num truncate text-caption text-muted">{row.description}</p>
      <div className="mt-1 flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate font-medium">{row.merchant}</span>
          {row.category ? (
            <CategoryChip category={row.category} short />
          ) : credit ? (
            <span className="text-caption text-muted">Money in</span>
          ) : (
            <span className="rounded-sm border border-dashed border-line-strong px-2 py-0.5 text-caption text-muted" title="Categorised when you import">
              AI will sort
            </span>
          )}
          {row.duplicate && <span className="text-caption text-muted">already imported</span>}
        </span>
        <span className={`num shrink-0 text-sm ${credit ? "text-positive" : ""}`}>
          {credit ? "+" : "−"}
          {formatINRExact(row.amountPaise)}
        </span>
      </div>
      <span className="sr-only">{row.category ? CATEGORY_LABEL[row.category] : credit ? "" : "Not categorised yet"}</span>
    </li>
  );
}

export function PreviewStep({ preview, busy, onCommit, onCancel }: { preview: Preview; busy: boolean; onCommit: () => void; onCancel: () => void }) {
  const nothingNew = preview.fresh === 0;
  return (
    <div className="animate-rise grid gap-4 lg:grid-cols-12 lg:gap-6">
      <section aria-labelledby="preview-title" className="receipt-edge mb-2 min-w-0 rounded-t-md bg-surface px-4 pt-4 pb-6 shadow-paper sm:px-6 lg:col-span-7">
        <h2 id="preview-title" className="font-mono text-caption tracking-[0.08em] text-muted uppercase">
          Decoded preview · first {preview.rows.length} of {preview.total}
        </h2>
        <ul className="mt-1 divide-y divide-dashed divide-line">
          {preview.rows.map((row, i) => (
            <PreviewLine key={`${row.date}-${i}`} row={row} index={i} />
          ))}
        </ul>
      </section>

      <aside className="grid min-w-0 content-start gap-4 lg:col-span-5">
        <div className="rounded-md bg-surface p-4 shadow-paper sm:p-6">
          <p className="text-h3 font-semibold">{BANK_LABEL[preview.bank]}</p>
          <p className="num text-sm text-muted">
            {maskedAccount(preview.last4)} · {preview.fileKind.toUpperCase()} · {formatShortDate(preview.firstDate)} to {formatShortDate(preview.lastDate)}
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-md bg-paper p-3">
              <dt className="text-caption text-muted">New</dt>
              <dd className="num text-h2 font-medium">{preview.fresh}</dd>
            </div>
            <div className="rounded-md bg-paper p-3">
              <dt className="text-caption text-muted">Already imported</dt>
              <dd className="num text-h2 font-medium text-muted">{preview.duplicates}</dd>
            </div>
          </dl>
          <div className="mt-4 grid gap-2">
            {nothingNew ? (
              <>
                <p className="text-sm text-muted">Everything in this file is already in SpendSense. Nothing to add.</p>
                <LinkButton href="/dashboard">Open insights</LinkButton>
              </>
            ) : (
              <Button pending={busy} onClick={onCommit}>
                {busy ? "Importing and categorising" : `Import ${preview.fresh} new transaction${preview.fresh === 1 ? "" : "s"}`}
              </Button>
            )}
            <Button variant="ghost" onClick={onCancel} disabled={busy}>
              Choose another file
            </Button>
          </div>
        </div>
        <RowErrors errors={preview.errors} />
      </aside>
    </div>
  );
}
