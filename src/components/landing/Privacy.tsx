import { ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/ui/Brand";

const POINTS = [
  "Your statement file is read in memory and never stored.",
  "Account numbers are cut to the last four digits (XXXX1234) before anything is saved.",
  "Export everything as CSV, or delete all of it with one button in Settings.",
];

export function Privacy() {
  return (
    <section aria-labelledby="privacy" className="mx-auto w-full max-w-[1200px] px-4 pb-16 sm:px-8 lg:pb-24">
      <div className="grid gap-6 rounded-md border border-line-strong p-6 sm:p-8 lg:grid-cols-12">
        <div className="flex items-start gap-3 lg:col-span-4">
          <ShieldCheck aria-hidden size={24} className="mt-1 shrink-0 text-positive" />
          <h2 id="privacy" className="text-h2 font-semibold tracking-tight">
            Your statement stays yours
          </h2>
        </div>
        <ul className="grid gap-3 lg:col-span-8">
          {POINTS.map((p) => (
            <li key={p} className="flex gap-3 text-muted">
              <span aria-hidden className="num text-accent-ink">—</span>
              {p}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-3 px-4 py-6 text-caption text-muted sm:px-8">
        <span className="inline-flex items-center gap-2">
          <BrandMark size={18} /> SpendSense: a spend analyser for UPI bank statements
        </span>
        <span className="num">Amounts in INR · Built for Indian banks</span>
      </div>
    </footer>
  );
}
