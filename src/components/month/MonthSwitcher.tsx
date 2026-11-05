"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type PointerEvent } from "react";
import { formatMonth } from "@/lib/dates";
import type { MonthOptionView } from "./params";

interface Props {
  month: string;
  /** Newest first. */
  options: MonthOptionView[];
  basePath: string;
  query?: Record<string, string>;
}

const SWIPE_PX = 56;

function hrefFor(basePath: string, month: string, query: Record<string, string>): string {
  const params = new URLSearchParams({ ...query, month });
  return `${basePath}?${params.toString()}`;
}

/** Month picker: arrows, a native select for jumping, and a horizontal swipe on touch screens. */
export function MonthSwitcher({ month, options, basePath, query = {} }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [dragX, setDragX] = useState(0);
  const start = useRef<number | null>(null);
  const index = options.findIndex((o) => o.month === month);
  const newer = index > 0 ? options[index - 1] : undefined;
  const older = index >= 0 ? options[index + 1] : undefined;

  function go(target: string | undefined) {
    if (!target || target === month) return;
    startTransition(() => router.push(hrefFor(basePath, target, query)));
  }

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType === "mouse") return;
    start.current = e.clientX;
  }
  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (start.current === null) return;
    // Rubber-band: the label follows the finger at a third of the distance, capped.
    setDragX(Math.max(-40, Math.min(40, (e.clientX - start.current) / 3)));
  }
  function onPointerEnd(e: PointerEvent<HTMLDivElement>) {
    if (start.current === null) return;
    const dx = e.clientX - start.current;
    start.current = null;
    setDragX(0);
    if (dx > SWIPE_PX) go(older?.month);
    else if (dx < -SWIPE_PX) go(newer?.month);
  }

  const arrow = "press flex size-10 items-center justify-center rounded-md text-ink hover:bg-sunken aria-disabled:pointer-events-none aria-disabled:opacity-30";

  return (
    <div
      className="flex touch-pan-y items-center gap-1 rounded-md border border-line bg-surface p-1 shadow-paper"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
    >
      <Link
        href={older ? hrefFor(basePath, older.month, query) : "#"}
        aria-label={older ? `Previous month, ${formatMonth(older.month)}` : "No earlier month"}
        aria-disabled={!older}
        tabIndex={older ? undefined : -1}
        className={arrow}
      >
        <ChevronLeft aria-hidden size={18} />
      </Link>
      <label className="relative min-w-0 flex-1">
        <span className="sr-only">Month</span>
        <select
          value={month}
          onChange={(e) => go(e.target.value)}
          disabled={pending}
          className="h-10 w-full appearance-none rounded-sm bg-transparent px-2 text-center text-sm font-semibold transition-transform duration-180 ease-(--ease-spring) disabled:opacity-60 sm:min-w-44"
          style={{ transform: `translateX(${dragX}px)`, transitionDuration: dragX ? "0ms" : undefined }}
        >
          {options.map((o) => (
            <option key={o.month} value={o.month}>
              {formatMonth(o.month)}
              {o.count ? ` · ${o.count} txns` : ""}
            </option>
          ))}
        </select>
      </label>
      <Link
        href={newer ? hrefFor(basePath, newer.month, query) : "#"}
        aria-label={newer ? `Next month, ${formatMonth(newer.month)}` : "No later month"}
        aria-disabled={!newer}
        tabIndex={newer ? undefined : -1}
        className={arrow}
      >
        <ChevronRight aria-hidden size={18} />
      </Link>
    </div>
  );
}
