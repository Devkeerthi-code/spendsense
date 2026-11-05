import type { CSSProperties } from "react";
import type { LeakReport } from "@/lib/insights/leaks";
import { formatINR } from "@/lib/money";
import { LeaderRow } from "@/components/ui/Leader";

const MAX_COINS = 56;
const PER_ROW = 7;
const COIN_GAP = 12;
const JAR = { x: 10, y: 14, w: 100, h: 126 };

/** Deterministic wobble so the stack looks dropped rather than gridded, and renders the same on server and client. */
function jitter(i: number): number {
  return ((i * 37) % 7) - 3;
}

function Coins({ amounts, threshold }: { amounts: number[]; threshold: number }) {
  const shown = amounts.slice(0, MAX_COINS);
  return (
    <svg viewBox="0 0 120 150" className="h-36 w-28 shrink-0" aria-hidden>
      <path
        d={`M${JAR.x} ${JAR.y} v${JAR.h - 10} q0 10 10 10 h${JAR.w - 20} q10 0 10 -10 v-${JAR.h - 10}`}
        fill="var(--sunken)"
        stroke="var(--line-strong)"
        strokeWidth="2"
      />
      <rect x={JAR.x - 4} y={JAR.y - 8} width={JAR.w + 8} height="8" rx="2" fill="var(--line-strong)" />
      {shown.map((paise, i) => {
        const row = Math.floor(i / PER_ROW);
        const col = i % PER_ROW;
        const offset = row % 2 ? COIN_GAP / 2 : 0;
        const cx = JAR.x + 14 + col * COIN_GAP + offset + jitter(i) / 2;
        const cy = JAR.y + JAR.h - 8 - row * (COIN_GAP - 2);
        const r = 4 + 2.5 * Math.min(1, paise / threshold);
        return (
          <circle
            key={i}
            cx={Math.min(cx, JAR.x + JAR.w - 8)}
            cy={cy}
            r={r}
            fill="var(--accent)"
            stroke="var(--accent-ink)"
            strokeWidth="1"
            className="coin"
            style={{ "--fall": `${-(cy - 10)}px`, animationDelay: `${i * 5}ms` } as CSSProperties}
          />
        );
      })}
    </svg>
  );
}

/** Small payments dropped into a jar, one coin each, so a month of ₹20 chais becomes a visible pile. */
export function LeakJar({ leaks }: { leaks: LeakReport }) {
  if (!leaks.count) {
    return <p className="text-sm text-muted">No payments under {formatINR(leaks.thresholdPaise)} this month. Nothing is leaking.</p>;
  }
  const extra = leaks.amounts.length - MAX_COINS;
  return (
    <div>
      <div className="flex items-end gap-4">
        <Coins amounts={leaks.amounts} threshold={leaks.thresholdPaise} />
        <div className="min-w-0 pb-2">
          <p className="num text-h2 font-medium">{formatINR(leaks.totalPaise)}</p>
          <p className="text-sm text-muted">
            from {leaks.count} payment{leaks.count === 1 ? "" : "s"} under {formatINR(leaks.thresholdPaise)}
            {extra > 0 ? ` (jar shows ${MAX_COINS})` : ""}
          </p>
        </div>
      </div>
      {leaks.groups.length > 0 && (
        <ul className="mt-4 grid gap-2 border-t border-dashed border-line-strong pt-4 text-sm">
          {leaks.groups.slice(0, 4).map((g) => (
            <li key={g.merchantKey}>
              <LeaderRow
                label={
                  <>
                    <span className="font-medium">{g.merchant}</span>{" "}
                    <span className="num text-caption text-muted">
                      {g.count}× ~{formatINR(g.averagePaise)}
                    </span>
                  </>
                }
                value={formatINR(g.totalPaise)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
