"use client";

import { useState, type CSSProperties, type KeyboardEvent } from "react";
import { formatShortDate } from "@/lib/dates";
import { formatINR } from "@/lib/money";
import { percentOf } from "./math";

interface Props {
  month: string;
  daily: number[];
  daysElapsed: number;
  dailyAveragePaise: number;
  isCurrentMonth: boolean;
}

function busiestDay(daily: number[], upTo: number): number {
  let best = 0;
  for (let i = 1; i < upTo; i++) if ((daily[i] ?? 0) > (daily[best] ?? 0)) best = i;
  return best;
}

/** Spend per day. Days still to come (current month only) are ghost bars at today's average pace. */
export function DailyChart({ month, daily, daysElapsed, dailyAveragePaise, isCurrentMonth }: Props) {
  const [selected, setSelected] = useState(() => busiestDay(daily, Math.max(1, daysElapsed)));
  const max = Math.max(...daily, dailyAveragePaise, 1);
  const avgPct = percentOf(dailyAveragePaise, max);

  function readout(i: number): string {
    const date = formatShortDate(`${month}-${String(i + 1).padStart(2, "0")}`);
    if (i >= daysElapsed) return `${date} · not yet · at your pace about ${formatINR(dailyAveragePaise)}`;
    return `${date} · ${formatINR(daily[i] ?? 0)}`;
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    setSelected((s) => Math.max(0, Math.min(daily.length - 1, s + step)));
  }

  return (
    <div>
      <p aria-live="polite" className="num mb-3 text-sm">
        {readout(selected)}
      </p>
      <div
        role="group"
        tabIndex={0}
        aria-label="Daily spend. Use left and right arrow keys to read each day."
        onKeyDown={onKeyDown}
        className="relative flex h-28 items-end gap-[2px] rounded-sm"
      >
        {dailyAveragePaise > 0 && (
          <span aria-hidden className="pointer-events-none absolute inset-x-0 border-t border-dashed border-accent-ink/60" style={{ bottom: `${avgPct}%` }} />
        )}
        {daily.map((paise, i) => {
          const future = i >= daysElapsed;
          if (future && !isCurrentMonth) return <span key={i} className="flex-1" />;
          const height = future ? avgPct : percentOf(paise, max);
          const isSel = i === selected;
          return (
            <span
              key={i}
              aria-hidden
              onPointerEnter={() => setSelected(i)}
              onClick={() => setSelected(i)}
              className="flex h-full flex-1 cursor-pointer items-end"
            >
              <span
                className={`bar-grow block w-full rounded-t-[2px] ${
                  future ? "border border-b-0 border-dashed border-line-strong" : isSel ? "bg-accent" : "bg-ink/80"
                } ${future && isSel ? "border-accent-ink" : ""}`}
                style={{ height: `${Math.max(height, paise || future ? 2 : 0.5)}%`, "--i": i } as CSSProperties}
              />
            </span>
          );
        })}
      </div>
      <div aria-hidden className="num mt-2 flex justify-between text-caption text-muted">
        <span>1</span>
        <span>{Math.ceil(daily.length / 2)}</span>
        <span>{daily.length}</span>
      </div>
      <p className="mt-3 flex items-center gap-2 text-caption text-muted">
        <span aria-hidden className="w-4 border-t border-dashed border-accent-ink" /> daily average {formatINR(dailyAveragePaise)}
        {isCurrentMonth && daysElapsed < daily.length && (
          <>
            <span aria-hidden className="ml-2 size-2.5 border border-dashed border-line-strong" /> days still to come
          </>
        )}
      </p>
    </div>
  );
}
