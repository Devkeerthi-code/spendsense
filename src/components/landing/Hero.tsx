import { ArrowRight } from "lucide-react";
import { LinkButton } from "@/components/ui/Button";
import { Decoder } from "./Decoder";

const BANKS = ["SBI", "HDFC", "ICICI", "Axis", "Kotak", "any CSV"];

export function Hero({ signedIn }: { signedIn: boolean }) {
  return (
    <section className="mx-auto grid w-full max-w-[1200px] gap-10 px-4 pt-8 pb-16 sm:px-8 lg:grid-cols-12 lg:gap-8 lg:pt-16 lg:pb-24">
      <div className="min-w-0 lg:col-span-7 lg:pr-8">
        <p className="font-mono text-caption tracking-[0.08em] text-accent-ink uppercase">For students who pay by UPI</p>
        <h1 className="mt-4 text-[40px] leading-[48px] font-semibold tracking-[-0.03em] sm:text-display sm:leading-[72px]">
          Your bank statement, in <span className="hl">plain words</span>.
        </h1>
        <p className="mt-6 max-w-xl text-base text-muted sm:text-h3 sm:leading-8">
          Upload the statement your bank gives you. SpendSense turns every <span className="num text-ink">UPI/DR/…</span> line
          into a merchant and a category, then shows where the month went and which small payments keep adding up.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {signedIn ? (
            <LinkButton href="/dashboard">
              Open dashboard <ArrowRight aria-hidden size={16} />
            </LinkButton>
          ) : (
            <>
              <LinkButton href="/signup">
                Create free account <ArrowRight aria-hidden size={16} />
              </LinkButton>
              <LinkButton href="/login" variant="secondary">
                I have an account
              </LinkButton>
            </>
          )}
        </div>
        <p className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-caption text-muted">
          <span>Reads statements from</span>
          {BANKS.map((bank) => (
            <span key={bank} className="rounded-sm border border-line px-1.5 py-0.5 text-ink">
              {bank}
            </span>
          ))}
        </p>
      </div>
      <div className="min-w-0 lg:col-span-5 lg:pt-4">
        <Decoder />
      </div>
    </section>
  );
}
