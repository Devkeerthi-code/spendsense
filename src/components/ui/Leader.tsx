import type { ReactNode } from "react";

/** A receipt line: label ........ value. */
export function LeaderRow({ label, value, className = "" }: { label: ReactNode; value: ReactNode; className?: string }) {
  return (
    <div className={`flex items-baseline gap-2 ${className}`}>
      <span className="min-w-0 truncate">{label}</span>
      <span className="leader" aria-hidden />
      <span className="num shrink-0">{value}</span>
    </div>
  );
}
