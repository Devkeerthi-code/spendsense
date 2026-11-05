import {
  BedDouble,
  Bus,
  Circle,
  GraduationCap,
  Receipt,
  Repeat,
  ShoppingBag,
  ShoppingBasket,
  Users,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import type { CategoryId } from "@/lib/categories";

export const CATEGORY_ICON: Record<CategoryId, LucideIcon> = {
  FOOD: Utensils,
  GROCERIES: ShoppingBasket,
  TRAVEL: Bus,
  SHOPPING: ShoppingBag,
  SUBSCRIPTIONS: Repeat,
  RENT: BedDouble,
  EDUCATION: GraduationCap,
  BILLS: Receipt,
  TRANSFERS: Users,
  OTHER: Circle,
};

/** CSS variable holding each category's colour; the value switches with the colour scheme. */
export const CATEGORY_COLOR: Record<CategoryId, string> = {
  FOOD: "var(--cat-food)",
  GROCERIES: "var(--cat-groceries)",
  TRAVEL: "var(--cat-travel)",
  SHOPPING: "var(--cat-shopping)",
  SUBSCRIPTIONS: "var(--cat-subscriptions)",
  RENT: "var(--cat-rent)",
  EDUCATION: "var(--cat-education)",
  BILLS: "var(--cat-bills)",
  TRANSFERS: "var(--cat-transfers)",
  OTHER: "var(--cat-other)",
};

export function tint(category: CategoryId, percent: number): string {
  return `color-mix(in srgb, ${CATEGORY_COLOR[category]} ${percent}%, transparent)`;
}
