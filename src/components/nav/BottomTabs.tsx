"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, isActive } from "./items";

/** Thumb-reach navigation for phones. Import is the raised centre action because it's how data gets in. */
export function BottomTabs() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm lg:hidden"
    >
      <ul className="mx-auto grid h-16 max-w-md grid-cols-4">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          const isImport = item.href === "/import";
          return (
            <li key={item.href} className="flex">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`press relative flex flex-1 flex-col items-center justify-center gap-1 text-caption font-medium ${active ? "text-ink" : "text-muted"}`}
              >
                <span
                  aria-hidden
                  className={`absolute top-0 h-0.5 w-8 rounded-full bg-accent transition-transform duration-180 ease-(--ease-spring) ${active ? "scale-x-100" : "scale-x-0"}`}
                />
                {isImport ? (
                  <span className={`-mt-1 flex size-9 items-center justify-center rounded-md ${active ? "bg-accent text-on-accent" : "bg-ink text-paper"}`}>
                    <Icon aria-hidden size={18} />
                  </span>
                ) : (
                  <Icon aria-hidden size={20} />
                )}
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
