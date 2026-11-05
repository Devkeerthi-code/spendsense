import { redirect } from "next/navigation";
import { Brand } from "@/components/ui/Brand";
import { LeaderRow } from "@/components/ui/Leader";
import { currentUser } from "@/server/auth";

const SAMPLE = [
  { label: "Food", value: "₹4,120" },
  { label: "Travel", value: "₹2,300" },
  { label: "Subscriptions", value: "₹649" },
  { label: "Small leaks", value: "₹1,840" },
];

// The session is verified here, not in the proxy, so a stale cookie can't bounce between /login and /dashboard.
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  if (await currentUser()) redirect("/dashboard");
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col px-4 py-6 sm:px-8">
        <Brand />
        <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">{children}</main>
      </div>
      <aside aria-hidden className="hidden items-center justify-center border-l border-line bg-sunken p-12 lg:flex">
        <div className="receipt-edge mb-2 w-full max-w-sm rotate-[-1.5deg] rounded-t-md bg-surface p-8 shadow-lift">
          <p className="font-mono text-caption tracking-[0.08em] text-muted uppercase">October · Example</p>
          <p className="num mt-4 text-hero">₹14,280</p>
          <p className="text-sm text-muted">spent this month</p>
          <div className="mt-6 grid gap-3 text-sm">
            {SAMPLE.map((row) => (
              <LeaderRow key={row.label} label={row.label} value={row.value} />
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
