import type { ComponentProps } from "react";

interface Props extends ComponentProps<"input"> {
  label: string;
  hint?: string;
  error?: string | null;
}

export const inputClass =
  "h-11 w-full rounded-md border border-line-strong bg-surface px-3 text-base text-ink transition-colors duration-150 hover:border-muted focus-visible:border-ink focus-visible:outline-offset-0 aria-invalid:border-danger";

export function Field({ label, hint, error, id, name, className = "", ...rest }: Props) {
  const fieldId = id ?? name;
  const describedBy = [hint && `${fieldId}-hint`, error && `${fieldId}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div className={`grid gap-1.5 ${className}`}>
      <label htmlFor={fieldId} className="text-sm font-medium">
        {label}
      </label>
      <input id={fieldId} name={name} aria-invalid={error ? true : undefined} aria-describedby={describedBy} className={inputClass} {...rest} />
      {hint && !error && (
        <p id={`${fieldId}-hint`} className="text-caption text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${fieldId}-error`} className="text-caption text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="animate-nudge rounded-md border border-danger/40 bg-danger-soft px-3 py-2 text-sm text-danger">
      {message}
    </p>
  );
}
