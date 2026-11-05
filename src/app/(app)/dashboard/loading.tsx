import { LoadingLabel, SkeletonBlock, SkeletonRow } from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <div>
      <LoadingLabel>Loading your insights</LoadingLabel>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <SkeletonBlock className="h-8 w-36" />
          <SkeletonBlock className="mt-2 h-4 w-52" />
        </div>
        <SkeletonBlock className="h-12 w-full sm:w-64" />
      </div>
      <div className="grid gap-4 lg:grid-cols-12 lg:gap-6">
        <div className="grid content-start gap-4 lg:col-span-8 lg:gap-6">
          <div className="rounded-md bg-surface p-6 shadow-paper">
            <div className="flex justify-between">
              <SkeletonBlock className="h-12 w-40" />
              <SkeletonBlock className="h-12 w-32" />
            </div>
            <SkeletonBlock className="mt-4 h-2 w-full" />
          </div>
          <div className="flex h-48 items-end gap-[2px] rounded-md bg-surface p-6 shadow-paper">
            {Array.from({ length: 30 }, (_, i) => (
              <div key={i} aria-hidden className="skeleton flex-1" style={{ height: `${20 + ((i * 37) % 70)}%` }} />
            ))}
          </div>
          <div className="rounded-md bg-surface px-6 py-3 shadow-paper">
            {Array.from({ length: 5 }, (_, i) => (
              <SkeletonRow key={i} wide={i === 0} />
            ))}
          </div>
        </div>
        <div className="grid content-start gap-4 lg:col-span-4 lg:gap-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-md bg-surface px-6 py-3 shadow-paper">
              <SkeletonRow />
              <SkeletonRow wide />
              <SkeletonRow />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
