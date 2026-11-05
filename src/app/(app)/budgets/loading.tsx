import { SkeletonPage } from "@/components/ui/Skeleton";

export default function BudgetsLoading() {
  return <SkeletonPage label="Loading budgets" rows={10} />;
}
