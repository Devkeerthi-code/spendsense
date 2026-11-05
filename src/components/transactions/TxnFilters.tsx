"use client";

import { Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { CATEGORIES, CATEGORY_SHORT, type CategoryId } from "@/lib/categories";
import { CategoryIcon } from "@/components/category/CategoryIcon";
import { inputClass } from "@/components/ui/Field";
import { Spinner } from "@/components/ui/Spinner";

interface Props {
  month: string;
  category: CategoryId | undefined;
  q: string;
}

function href(month: string, category: CategoryId | undefined, q: string): string {
  const params = new URLSearchParams({ month });
  if (category) params.set("category", category);
  if (q) params.set("q", q);
  return `/transactions?${params.toString()}`;
}

const SEARCH_DELAY_MS = 250;

export function TxnFilters({ month, category, q }: Props) {
  const router = useRouter();
  const [text, setText] = useState(q);
  const [sent, setSent] = useState(q);
  const [synced, setSynced] = useState(q);
  const [pending, startTransition] = useTransition();

  // The URL changed without us (e.g. "Clear filters"): show its query instead of what was typed.
  if (q !== synced) {
    setSynced(q);
    if (q !== sent) setText(q);
  }

  useEffect(() => {
    const trimmed = text.trim();
    if (trimmed === q) return;
    const timer = setTimeout(() => {
      setSent(trimmed);
      startTransition(() => router.replace(href(month, category, trimmed)));
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [text, q, month, category, router]);

  const chip = (active: boolean) =>
    `press inline-flex h-9 shrink-0 items-center gap-1.5 rounded-sm border px-3 text-sm font-medium ${
      active ? "border-ink bg-ink text-paper" : "border-line bg-surface text-ink hover:border-line-strong"
    }`;

  return (
    <div className="grid gap-3">
      <form role="search" onSubmit={(e) => e.preventDefault()} className="relative">
        <label htmlFor="txn-search" className="sr-only">
          Search merchant or bank line
        </label>
        <Search aria-hidden size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
        <input
          id="txn-search"
          type="search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={60}
          placeholder="Search Swiggy, IRCTC, a name…"
          className={`${inputClass} px-9`}
        />
        <span className="absolute top-1/2 right-3 -translate-y-1/2 text-muted">
          {pending ? (
            <Spinner />
          ) : text ? (
            <button type="button" aria-label="Clear search" onClick={() => setText("")} className="press flex size-6 items-center justify-center rounded-sm hover:text-ink">
              <X aria-hidden size={16} />
            </button>
          ) : null}
        </span>
      </form>
      <nav aria-label="Filter by category" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        <Link href={href(month, undefined, q)} aria-current={!category ? "page" : undefined} className={chip(!category)}>
          All
        </Link>
        {CATEGORIES.map((c) => (
          <Link key={c} href={href(month, c, q)} aria-current={category === c ? "page" : undefined} className={chip(category === c)}>
            <CategoryIcon category={c} size={14} />
            {CATEGORY_SHORT[c]}
          </Link>
        ))}
      </nav>
    </div>
  );
}
