import { Skeleton } from "@/components/ui/skeleton";

export default function HotspotsLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading hotspots">
      <div className="space-y-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-[30rem] max-w-full" />
      </div>
      <Skeleton className="h-9 w-[40rem] max-w-full" />
      <div className="grid gap-4 lg:h-[calc(100vh-13rem)] lg:grid-cols-[minmax(0,1fr)_24rem]">
        <Skeleton className="h-[55vh] lg:h-full" />
        <div className="space-y-3 rounded-lg border p-4">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      </div>
    </div>
  );
}
