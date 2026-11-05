import { LayoutGrid, ListOrdered, Settings, Target, Upload, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Insights", icon: LayoutGrid },
  { href: "/transactions", label: "Transactions", icon: ListOrdered },
  { href: "/import", label: "Import", icon: Upload },
  { href: "/budgets", label: "Budgets", icon: Target },
];

export const SETTINGS_ITEM: NavItem = { href: "/settings", label: "Settings", icon: Settings };

export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
