"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brand } from "@/components/ui/Brand";
import { SignOutButton } from "./SignOutButton";
import { NAV_ITEMS, SETTINGS_ITEM, isActive, type NavItem } from "./items";

function RailLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActive(pathname, item.href);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`press relative flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium ${
        active ? "bg-surface text-ink shadow-paper" : "text-muted hover:bg-sunken hover:text-ink"
      }`}
    >
      <span
        aria-hidden
        className={`absolute inset-y-2 left-0 w-0.5 origin-center rounded-full bg-accent transition-transform duration-180 ease-(--ease-spring) ${active ? "scale-y-100" : "scale-y-0"}`}
      />
      <Icon aria-hidden size={18} />
      {item.label}
    </Link>
  );
}

export function SideRail({ name, email }: { name: string; email: string }) {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-dvh min-w-0 flex-col border-r border-line px-4 py-6 lg:flex">
      <div className="px-3">
        <Brand href="/dashboard" />
      </div>
      <nav aria-label="Main" className="mt-8 grid gap-1">
        {NAV_ITEMS.map((item) => (
          <RailLink key={item.href} item={item} pathname={pathname} />
        ))}
      </nav>
      <div className="mt-auto grid gap-1 border-t border-line pt-4">
        <RailLink item={SETTINGS_ITEM} pathname={pathname} />
        <div className="min-w-0 px-3 pt-3 pb-1">
          <p className="truncate text-sm font-medium">{name}</p>
          <p className="truncate text-caption text-muted">{email}</p>
        </div>
        <SignOutButton />
      </div>
    </aside>
  );
}
