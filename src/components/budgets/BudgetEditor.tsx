"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { CATEGORY_LABEL } from "@/lib/categories";
import { formatINR, rupeesInputToPaise } from "@/lib/money";
import { api, jsonInit, messageOf } from "@/client/api";
import { CategoryIcon } from "@/components/category/CategoryIcon";
import { Button } from "@/components/ui/Button";
import type { BudgetRow } from "@/server/insights";
import { BudgetBar } from "./BudgetBar";
import { BudgetStatus } from "./BudgetStatus";

function toRupeeText(paise: number | null): string {
  return paise ? String(Math.round(paise / 100)) : "";
}

/** Rounds a typical spend up to a tidy ₹100 so the suggestion reads like a number a person would pick. */
function suggestion(typicalPaise: number): number {
  return Math.ceil(typicalPaise / 100_00) * 100_00;
}

export function BudgetEditor({ row, isCurrentMonth }: { row: BudgetRow; isCurrentMonth: boolean }) {
  const router = useRouter();
  const [text, setText] = useState(toRupeeText(row.limitPaise));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<"save" | "remove" | null>(null);
  const [refreshing, startTransition] = useTransition();
  const label = CATEGORY_LABEL[row.category];
  const inputId = `budget-${row.category}`;
  const dirty = text !== toRupeeText(row.limitPaise);
  const busy = saving !== null || refreshing;

  async function put(limitPaise: number | null, kind: "save" | "remove") {
    setSaving(kind);
    try {
      await api("/api/budgets", jsonInit("PUT", { category: row.category, limitPaise }));
      toast.success(limitPaise ? `${label}: ${formatINR(limitPaise)} a month` : `${label} budget removed`);
      if (!limitPaise) setText("");
      startTransition(() => router.refresh());
    } catch (err) {
      toast.error(messageOf(err));
    } finally {
      setSaving(null);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const paise = rupeesInputToPaise(text);
    if (!paise) return setError("Enter an amount in rupees, like 3000.");
    setError(null);
    void put(paise, "save");
  }

  const typical = suggestion(row.typicalPaise);

  return (
    <li className="grid gap-3 py-5 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_280px] sm:gap-6">
      <div className="min-w-0">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="flex items-center gap-2 font-semibold">
            <CategoryIcon category={row.category} /> {label}
          </h2>
          <p className="num text-sm">
            {formatINR(row.spentPaise)}
            {row.limitPaise ? <span className="text-muted"> / {formatINR(row.limitPaise)}</span> : <span className="text-muted"> spent</span>}
          </p>
        </div>
        {row.progress ? (
          <div className="mt-3 grid gap-2">
            <BudgetBar progress={row.progress} label={`${label} budget`} />
            <BudgetStatus progress={row.progress} isCurrentMonth={isCurrentMonth} />
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted">
            No limit.{" "}
            {typical > 0 && (
              <button type="button" onClick={() => setText(toRupeeText(typical))} className="press rounded-sm font-medium text-accent-ink underline underline-offset-4">
                You usually spend about {formatINR(row.typicalPaise)}. Use {formatINR(typical)}
              </button>
            )}
          </p>
        )}
      </div>
      <form onSubmit={onSubmit} className="grid gap-1.5">
        <label htmlFor={inputId} className="sr-only">
          Monthly limit for {label}, in rupees
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span aria-hidden className="num pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted">₹</span>
            <input
              id={inputId}
              inputMode="decimal"
              autoComplete="off"
              placeholder="Monthly limit"
              value={text}
              onChange={(e) => setText(e.target.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${inputId}-error` : undefined}
              className="num h-10 w-full rounded-md border border-line-strong bg-surface pr-3 pl-7 text-sm hover:border-muted focus-visible:border-ink aria-invalid:border-danger"
            />
          </div>
          <Button type="submit" size="sm" className="h-10" pending={saving === "save"} disabled={busy || !dirty || !text}>
            Save
          </Button>
          {row.limitPaise && (
            <Button size="sm" variant="ghost" className="h-10" pending={saving === "remove"} disabled={busy} onClick={() => put(null, "remove")}>
              Remove
            </Button>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="text-caption text-danger">
            {error}
          </p>
        )}
      </form>
    </li>
  );
}
