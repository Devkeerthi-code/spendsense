const STEPS = [
  "Open your bank's app or net banking.",
  "Go to your account's statement (often under Accounts → Statement).",
  "Pick a date range. Three to six months gives the best insights.",
  "Download as CSV (sometimes called Delimited or Excel/CSV) or PDF.",
];

export function StatementHelp() {
  return (
    <section aria-labelledby="help-title" className="rounded-md border border-line p-4 sm:p-6">
      <h2 id="help-title" className="font-mono text-caption tracking-[0.08em] text-muted uppercase">
        Where to get your statement
      </h2>
      <ol className="mt-3 grid gap-2 text-sm">
        {STEPS.map((s, i) => (
          <li key={s} className="flex gap-3">
            <span className="num text-accent-ink">{i + 1}</span>
            {s}
          </li>
        ))}
      </ol>
      <p className="mt-4 border-t border-dashed border-line-strong pt-3 text-caption text-muted">
        Monthly e-statement PDFs from your email work too; we&apos;ll ask for the PDF password. Other banks: any CSV works after you match its
        columns once.
      </p>
    </section>
  );
}
