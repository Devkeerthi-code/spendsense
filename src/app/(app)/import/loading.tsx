import { LoadingLabel, SkeletonBlock } from "@/components/ui/Skeleton";

export default function ImportLoading() {
  return (
    <div>
      <LoadingLabel>Loading import</LoadingLabel>
      <SkeletonBlock className="mb-2 h-8 w-56" />
      <SkeletonBlock className="mb-6 h-4 w-80 max-w-full" />
      <div className="grid gap-6 lg:grid-cols-12">
        <SkeletonBlock className="h-64 lg:col-span-7" />
        <SkeletonBlock className="h-64 lg:col-span-5" />
      </div>
    </div>
  );
}
