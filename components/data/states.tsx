import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Inbox, RotateCw } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type StateProps = {
  title: string;
  description?: ReactNode;
  icon?: LucideIcon;
  action?: ReactNode;
  className?: string;
};

/** Nothing to show yet (no rows, no results for a filter). */
export function EmptyState({ title, description, icon: Icon = Inbox, action, className }: StateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-6 py-12 text-center", className)}>
      <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="max-w-sm space-y-1">
        <p className="text-sm font-medium">{title}</p>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/** A query failed. Pass onRetry from a Client Component to show a retry button. */
export function ErrorState({
  title = "Could not load this data",
  description = "Check your connection and try again.",
  onRetry,
  className,
}: Partial<StateProps> & { onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className={cn("flex flex-col items-center justify-center gap-3 rounded-lg border border-coral/40 bg-coral-soft px-6 py-12 text-center", className)}
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-coral/15 text-coral">
        <AlertTriangle className="size-5" aria-hidden />
      </span>
      <div className="max-w-sm space-y-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCw className="mr-2 size-3.5" /> Try again
        </Button>
      )}
    </div>
  );
}

/** Placeholder rows shaped like a table while data loads. */
export function TableSkeleton({ rows = 8, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-hidden rounded-lg border" aria-busy="true" aria-label="Loading">
      <div className="flex gap-4 border-b bg-muted/50 px-4 py-3">
        {Array.from({ length: columns }, (_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="flex gap-4 border-b px-4 py-3 last:border-0">
          {Array.from({ length: columns }, (_, c) => (
            <Skeleton key={c} className={cn("h-4 flex-1", c === 0 && "max-w-40")} />
          ))}
        </div>
      ))}
    </div>
  );
}
