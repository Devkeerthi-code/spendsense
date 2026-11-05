import Link from "next/link";
import { redirect } from "next/navigation";
import { BottomTabs } from "@/components/nav/BottomTabs";
import { SideRail } from "@/components/nav/SideRail";
import { Brand } from "@/components/ui/Brand";
import { currentUser } from "@/server/auth";

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[232px_minmax(0,1fr)]">
      <a href="#main" className="sr-only z-50 rounded-md bg-ink px-3 py-2 text-paper focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
        Skip to content
      </a>
      <SideRail name={user.name} email={user.email} />
      <div className="min-w-0">
        {user.isDemo && (
          <p role="note" className="border-b border-warn/30 bg-warn-soft px-4 py-2 text-center text-caption font-medium text-warn sm:text-sm">
            Demo data — these transactions are made up.
          </p>
        )}
        <header className="flex h-14 items-center justify-between px-4 sm:px-8 lg:hidden">
          <Brand href="/dashboard" />
          <Link
            href="/settings"
            aria-label="Settings"
            className="press flex size-9 items-center justify-center rounded-full border border-line-strong bg-surface text-caption font-semibold"
          >
            {initials(user.name)}
          </Link>
        </header>
        <main id="main" className="mx-auto w-full max-w-[1120px] px-4 pt-2 pb-28 sm:px-8 lg:pt-10 lg:pb-16">
          {children}
        </main>
      </div>
      <BottomTabs />
    </div>
  );
}
