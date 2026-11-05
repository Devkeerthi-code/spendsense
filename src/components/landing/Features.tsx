const FEATURES = [
  {
    title: "Where it went",
    body: "Spend per category for the month (food, travel, rent, friends and six more) with the change from last month.",
  },
  {
    title: "Small leaks",
    body: "Payments under ₹200 that repeat. Example: 23 chai payments of under ₹100 came to ₹1,840 in a month.",
  },
  {
    title: "Subscriptions you forgot",
    body: "Charges that repeat every week or month, with the next expected date and what they cost in a year.",
  },
  {
    title: "Budgets that warn early",
    body: "Set a limit per category. You see the month-end projection at today's pace, before you go over.",
  },
];

const STEPS = [
  { title: "Download your statement", body: "From net banking or your bank's app: CSV or PDF, 3 to 6 months works best." },
  { title: "Drop it in", body: "The bank is detected automatically. Rows you've imported before are skipped." },
  { title: "Read your month", body: "Fix any category with one tap and SpendSense remembers it for that merchant." },
];

export function Features() {
  return (
    <section aria-labelledby="what-you-get" className="border-y border-line bg-surface">
      <div className="mx-auto grid w-full max-w-[1200px] gap-10 px-4 py-16 sm:px-8 lg:grid-cols-12 lg:gap-8 lg:py-24">
        <h2 id="what-you-get" className="text-h2 font-semibold tracking-tight lg:col-span-4 lg:text-h1">
          What one upload tells you
        </h2>
        <ol className="lg:col-span-8">
          {FEATURES.map((f, i) => (
            <li key={f.title} className="grid grid-cols-[40px_1fr] gap-x-4 border-t border-dashed border-line-strong py-6 first:border-0 first:pt-0 sm:grid-cols-[56px_1fr]">
              <span className="num pt-1 text-sm text-accent-ink">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h3 className="text-h3 font-semibold">{f.title}</h3>
                <p className="mt-1 max-w-xl text-muted">{f.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Steps() {
  return (
    <section aria-labelledby="how-it-works" className="mx-auto w-full max-w-[1200px] px-4 py-16 sm:px-8 lg:py-24">
      <h2 id="how-it-works" className="text-h2 font-semibold tracking-tight lg:text-h1">
        Three steps, about a minute
      </h2>
      <ol className="mt-8 grid gap-4 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <li key={s.title} className="receipt-edge mb-2 rounded-t-md bg-surface p-6 shadow-paper">
            <p className="font-mono text-caption tracking-[0.08em] text-muted uppercase">Step {i + 1}</p>
            <h3 className="mt-3 text-h3 font-semibold">{s.title}</h3>
            <p className="mt-2 text-sm text-muted">{s.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
