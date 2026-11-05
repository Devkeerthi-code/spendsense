import { SkeletonPage } from "@/components/ui/Skeleton";

export default function TransactionsLoading() {
  return <SkeletonPage label="Loading transactions" rows={10} />;
}
