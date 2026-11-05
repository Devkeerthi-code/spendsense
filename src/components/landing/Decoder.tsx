"use client";

import { useState, type CSSProperties } from "react";
import { CategoryChip } from "@/components/category/CategoryChip";
import { useScramble } from "@/client/useScramble";
import { EXAMPLE_LINES, type ExampleLine } from "./examples";

function DecodedLine({ line, index, runKey, decoded }: { line: ExampleLine; index: number; runKey: number; decoded: boolean }) {
  const merchant = useScramble(line.merchant, runKey, index * 30);
  return (
    <li className="border-b border-dashed border-line py-3 last:border-0">
      <p className={`num truncate text-caption transition-colors duration-150 ${decoded ? "text-muted" : "text-ink"}`} title={line.raw}>
        {line.raw}
      </p>
      {decoded && (
        <div key={runKey} className="animate-rise mt-2 flex items-center justify-between gap-3" style={{ animationDelay: `${index * 30}ms` }}>
          <span className="flex min-w-0 items-center gap-2">
            <span className="hl truncate font-semibold" style={{ "--hl-delay": `${index * 30 + 120}ms` } as CSSProperties}>
              <span className="sr-only">{line.merchant}</span>
              <span aria-hidden>{merchant}</span>
            </span>
            <CategoryChip category={line.category} short />
          </span>
          <span className={`num shrink-0 text-sm ${line.credit ? "text-positive" : ""}`}>
            {line.credit ? "+" : "−"}
            {line.amount}
          </span>
        </div>
      )}
    </li>
  );
}

/** The landing before/after: raw statement lines that decode into merchant + category when switched on. */
export function Decoder() {
  const [decoded, setDecoded] = useState(true);
  const [runKey, setRunKey] = useState(0);

  function show(next: boolean) {
    setDecoded(next);
    if (next) setRunKey((k) => k + 1);
  }

  return (
    <figure className="receipt-edge mb-2 rounded-t-md bg-surface shadow-lift">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
        <figcaption className="font-mono text-caption tracking-[0.08em] text-muted uppercase">Bank statement · Example</figcaption>
        <div role="group" aria-label="View" className="flex rounded-md bg-sunken p-0.5 text-caption font-medium">
          {[
            { label: "Before", value: false },
            { label: "After", value: true },
          ].map((opt) => (
            <button
              key={opt.label}
              type="button"
              aria-pressed={decoded === opt.value}
              onClick={() => show(opt.value)}
              className={`press h-8 rounded-sm px-3 ${decoded === opt.value ? "bg-surface text-ink shadow-paper" : "text-muted hover:text-ink"}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <ul className="px-4 pb-4 sm:px-5">
        {EXAMPLE_LINES.map((line, i) => (
          <DecodedLine key={line.raw} line={line} index={i} runKey={runKey} decoded={decoded} />
        ))}
      </ul>
    </figure>
  );
}
