import { Skeleton } from "@/components/ui/skeleton";

export default function ZonesLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading zones">
      <div className="space-y-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-[28rem] max-w-full" />
      </div>
      <div className="grid gap-4 lg:h-[calc(100vh-10.5rem)] lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Skeleton className="h-[55vh] lg:h-full" />
        <div className="space-y-3 rounded-lg border p-4">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      </div>
    </div>
  );
}
