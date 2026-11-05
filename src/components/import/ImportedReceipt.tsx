"use client";

import { ArrowRight } from "lucide-react";
import { formatMonth } from "@/lib/dates";
import { BANK_LABEL } from "@/lib/parsers/types";
import { useCountUp } from "@/client/useCountUp";
import { Button, LinkButton } from "@/components/ui/Button";
import type { Step } from "./useImportFlow";

type Imported = Extract<Step, { kind: "imported" }>;

function Count({ value }: { value: number }) {
  return <>{useCountUp(value)}</>;
}

/** The result prints out of the slot like a till receipt, with each count ticking up. */
export function ImportedReceipt({ result, onAnother }: { result: Imported; onAnother: () => void }) {
  const lines = [
    { label: "New transactions", value: result.inserted },
    { label: "Duplicates skipped", value: result.duplicates },
    { label: "Categorised by AI", value: result.aiCategorised },
    ...(result.errors ? [{ label: "Rows that couldn't be read", value: result.errors }] : []),
  ];
  return (
    <div className="mx-auto max-w-md">
      <div aria-hidden className="mx-2 h-2 rounded-full bg-ink/80" />
      <section
        aria-labelledby="receipt-title"
        role="status"
        className="receipt-edge animate-print mx-4 mb-2 bg-surface px-6 pt-6 pb-8 shadow-lift"
      >
        <p className="font-mono text-caption tracking-[0.08em] text-muted uppercase">Import complete</p>
        <h2 id="receipt-title" className="mt-1 text-h3 font-semibold">
          {BANK_LABEL[result.bank]} statement
        </h2>
        <dl className="mt-5 grid gap-3 border-y border-dashed border-line-strong py-4 text-sm">
          {lines.map((l) => (
            <div key={l.label} className="flex items-baseline gap-2">
              <dt>{l.label}</dt>
              <span aria-hidden className="leader" />
              <dd className="num text-base font-medium">
                <Count value={l.value} />
              </dd>
            </div>
          ))}
        </dl>
        {result.aiFailed && (
          <p className="mt-4 text-sm text-warn">
            The AI categoriser didn&apos;t answer, so some merchants were left as Other. Fix them from Transactions with one tap each.
          </p>
        )}
        <p className="mt-4 text-caption text-muted">Your file was read in memory and has not been stored.</p>
      </section>
      <div className="mt-6 grid gap-2 px-4">
        <LinkButton href={`/dashboard?month=${result.latestMonth}`}>
          See {formatMonth(result.latestMonth)} <ArrowRight aria-hidden size={16} />
        </LinkButton>
        <Button variant="ghost" onClick={onAnother}>
          Import another statement
        </Button>
      </div>
    </div>
  );
}
