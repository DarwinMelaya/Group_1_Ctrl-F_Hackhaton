import { Skeleton } from "@/components/ui/skeleton";

export default function BiodiversityLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading biodiversity map">
      <div className="space-y-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-[30rem] max-w-full" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-9 w-64" />
      </div>
      <div className="grid gap-4 lg:h-[calc(100vh-14rem)] lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Skeleton className="h-[55vh] lg:h-full" />
        <div className="space-y-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-48" />
        </div>
      </div>
    </div>
  );
}
