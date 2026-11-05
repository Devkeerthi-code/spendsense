/** Placeholder shaped like a receipt row: icon, label, dotted leader, amount. */
export function SkeletonRow({ wide = false }: { wide?: boolean }) {
  return (
    <div className="flex items-center gap-3 py-3" aria-hidden>
      <div className="skeleton size-4 shrink-0" />
      <div className={`skeleton h-3 ${wide ? "w-40" : "w-24"}`} />
      <div className="leader opacity-60" />
      <div className="skeleton h-3 w-16" />
    </div>
  );
}

export function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`skeleton ${className}`} />;
}

export function LoadingLabel({ children }: { children: string }) {
  return (
    <p role="status" className="sr-only">
      {children}
    </p>
  );
}

/** A full page of receipt-row skeletons, used by several loading.tsx files. */
export function SkeletonPage({ label, rows = 8 }: { label: string; rows?: number }) {
  return (
    <div>
      <LoadingLabel>{label}</LoadingLabel>
      <SkeletonBlock className="mb-2 h-8 w-48" />
      <SkeletonBlock className="mb-6 h-4 w-64" />
      <div className="rounded-md bg-surface px-4 py-2 shadow-paper sm:px-6">
        {Array.from({ length: rows }, (_, i) => (
          <SkeletonRow key={i} wide={i % 3 === 0} />
        ))}
      </div>
    </div>
  );
}
