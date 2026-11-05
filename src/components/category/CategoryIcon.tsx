import type { CategoryId } from "@/lib/categories";
import { CATEGORY_COLOR, CATEGORY_ICON } from "./meta";

export function CategoryIcon({ category, size = 16 }: { category: CategoryId; size?: number }) {
  const Icon = CATEGORY_ICON[category];
  return <Icon aria-hidden size={size} strokeWidth={2} style={{ color: CATEGORY_COLOR[category] }} className="shrink-0" />;
}
