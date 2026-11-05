import type { ReactNode } from "react";

interface Props {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Torn-receipt bottom edge instead of rounded corners. */
  torn?: boolean;
}

function slug(text: string): string {
  return `card-${text.toLowerCase().replace(/\W+/g, "-")}`;
}

export function Card({ title, action, children, className = "", torn = false }: Props) {
  const id = title ? slug(title) : undefined;
  return (
    <section
      aria-labelledby={id}
      className={`bg-surface p-4 shadow-paper sm:p-6 ${torn ? "receipt-edge mb-2 rounded-t-md" : "rounded-md"} ${className}`}
    >
      {title && (
        <header className="mb-3 flex items-center justify-between gap-3">
          <h2 id={id} className="font-mono text-caption font-medium tracking-[0.08em] text-muted uppercase">
            {title}
          </h2>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
