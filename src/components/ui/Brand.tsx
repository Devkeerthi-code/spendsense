import Link from "next/link";

export function BrandMark({ size = 24 }: { size?: number }) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 32 32" className="shrink-0">
      <path
        d="M6 3h20v24l-3.33-2-3.34 2L16 25l-3.33 2-3.34-2L6 27z"
        fill="var(--surface)"
        stroke="var(--ink)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <rect x="10" y="10" width="12" height="4" rx="1" fill="var(--accent)" />
      <path d="M10 18h8" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="press inline-flex items-center gap-2 rounded-sm text-base font-semibold tracking-tight">
      <BrandMark />
      SpendSense
    </Link>
  );
}
