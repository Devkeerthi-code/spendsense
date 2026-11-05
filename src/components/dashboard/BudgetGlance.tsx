import Link from "next/link";
import type { BudgetProgress } from "@/lib/budget";
import { CATEGORY_LABEL, type CategoryId } from "@/lib/categories";
import { formatINR } from "@/lib/money";
import { BudgetBar } from "@/components/budgets/BudgetBar";
import { CategoryIcon } from "@/components/category/CategoryIcon";

interface Props {
  budgets: { category: CategoryId; progress: BudgetProgress }[];
  month: string;
}

export function BudgetGlance({ budgets, month }: Props) {
  if (!budgets.length) {
    return (
      <p className="text-sm text-muted">
        No limits set.{" "}
        <Link href={`/budgets?month=${month}`} className="font-medium text-ink underline decoration-accent decoration-2 underline-offset-4">
          Set a monthly limit per category
        </Link>{" "}
        and this shows how close you are.
      </p>
    );
  }
  const sorted = [...budgets].sort((a, b) => b.progress.percent - a.progress.percent).slice(0, 4);
  return (
    <ul className="grid gap-4">
      {sorted.map(({ category, progress }) => (
        <li key={category}>
          <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
            <span className="flex items-center gap-2 font-medium">
              <CategoryIcon category={category} /> {CATEGORY_LABEL[category]}
            </span>
            <span className={`num text-caption ${progress.state === "over" ? "text-danger" : "text-muted"}`}>
              {formatINR(progress.spentPaise)} / {formatINR(progress.limitPaise)}
            </span>
          </div>
          <BudgetBar progress={progress} label={`${CATEGORY_LABEL[category]} budget`} />
        </li>
      ))}
    </ul>
  );
}
