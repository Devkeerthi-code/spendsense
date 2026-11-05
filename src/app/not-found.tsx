import { LinkButton } from "@/components/ui/Button";
import { Brand } from "@/components/ui/Brand";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col px-4 py-6 sm:px-8">
      <Brand />
      <main className="flex flex-1 items-center justify-center py-12">
        <div className="receipt-edge mb-2 w-full max-w-md rounded-t-md bg-surface px-6 pt-8 pb-10 shadow-paper">
          <p className="num truncate text-caption text-muted">UPI/DR/XXXXXXXX0404/PAGE NOT FOUND/NONE/nowhere@void</p>
          <p className="mt-3 flex items-center gap-2">
            <span className="hl text-h2 font-semibold">Page not found</span>
          </p>
          <p className="mt-3 text-sm text-muted">This address doesn&apos;t lead anywhere. It may have moved, or the link was cut short.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <LinkButton href="/dashboard">Open insights</LinkButton>
            <LinkButton href="/" variant="ghost">
              Home
            </LinkButton>
          </div>
        </div>
      </main>
    </div>
  );
}
