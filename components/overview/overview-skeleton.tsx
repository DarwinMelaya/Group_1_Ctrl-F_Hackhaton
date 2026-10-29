import { Skeleton } from "@/components/ui/skeleton";

export function OverviewSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading overview">
      <Skeleton className="h-3 w-96 max-w-full" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="space-y-3 rounded-lg border bg-card p-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-40" />
          </div>
        ))}
      </div>
      <div className="space-y-3 rounded-lg border bg-card p-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-64 w-full" />
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="space-y-3 rounded-lg border bg-card p-4">
          <Skeleton className="h-4 w-32" />
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-5" style={{ width: `${90 - i * 9}%` }} />
          ))}
        </div>
        <div className="space-y-3 rounded-lg border bg-card p-4">
          <Skeleton className="h-4 w-24" />
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-9" />
          ))}
        </div>
      </div>
    </div>
  );
}
