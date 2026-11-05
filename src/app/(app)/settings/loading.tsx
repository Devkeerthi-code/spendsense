import { LoadingLabel, SkeletonBlock, SkeletonRow } from "@/components/ui/Skeleton";

export default function SettingsLoading() {
  return (
    <div>
      <LoadingLabel>Loading settings</LoadingLabel>
      <SkeletonBlock className="mb-6 h-8 w-36" />
      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-md bg-surface px-6 py-3 shadow-paper">
            <SkeletonRow wide />
            <SkeletonRow />
          </div>
        ))}
      </div>
    </div>
  );
}
