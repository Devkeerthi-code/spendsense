import type { ReactNode } from "react";

const GHOST_LINES = [
  ["w-12", "w-8"],
  ["w-16", "w-6"],
  ["w-10", "w-10"],
] as const;

/** A blank receipt: the shape of what will be printed here once there is data. */
export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="receipt-edge animate-print mx-auto mb-2 w-full max-w-md rounded-t-md bg-surface px-6 pt-8 pb-10 text-center shadow-paper">
      <div aria-hidden className="mx-auto mb-6 flex w-48 flex-col gap-3">
        {GHOST_LINES.map(([label, value], i) => (
          <div key={i} className="flex items-baseline gap-2">
            <span className={`h-2 rounded-sm bg-sunken ${label}`} />
            <span className="leader" />
            <span className={`h-2 rounded-sm bg-sunken ${value}`} />
          </div>
        ))}
      </div>
      <h2 className="text-h3 font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted">{body}</p>
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}
