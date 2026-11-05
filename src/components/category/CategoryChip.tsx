import { CATEGORY_LABEL, CATEGORY_SHORT, type CategoryId } from "@/lib/categories";
import { CategoryIcon } from "./CategoryIcon";
import { tint } from "./meta";

interface Props {
  category: CategoryId;
  short?: boolean;
  className?: string;
}

/** The stamp-like label used wherever a category appears. Colour is never the only signal: icon and text too. */
export function CategoryChip({ category, short = false, className = "" }: Props) {
  return (
    <span
      className={`inline-flex h-7 items-center gap-1.5 rounded-sm border px-2 text-caption font-medium whitespace-nowrap text-ink ${className}`}
      style={{ backgroundColor: tint(category, 14), borderColor: tint(category, 38) }}
    >
      <CategoryIcon category={category} size={14} />
      {short ? CATEGORY_SHORT[category] : CATEGORY_LABEL[category]}
    </span>
  );
}
