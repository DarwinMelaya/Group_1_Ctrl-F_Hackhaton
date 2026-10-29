import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CATCH_STATUS_STYLE } from "@/components/catch/catch-status";
import { CATCH_STATUS_LABELS, CATCH_STATUS_ORDER } from "@/lib/catch/status";
import { formatNumber, formatPercent } from "@/lib/format";
import type { CatchStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Log status counts as status icon + word + count + share meter. Each row opens the filtered Catches table. */
export function StatusBreakdown({ counts, total, municipality }: { counts: Partial<Record<CatchStatus, number>>; total: number; municipality: string | null }) {
  return (
    <section className="rounded-lg border bg-card" aria-label="Log status">
      <header className="px-4 pb-2 pt-4">
        <h2 className="text-sm font-semibold">Log status</h2>
        <p className="text-xs text-muted-foreground">Status of catch logs in this period</p>
      </header>
      <ul className="divide-y px-1 pb-2">
        {CATCH_STATUS_ORDER.map((status) => {
          const n = counts[status] ?? 0;
          const share = total > 0 ? (n / total) * 100 : 0;
          const style = CATCH_STATUS_STYLE[status];
          const Icon = style.icon;
          const params = new URLSearchParams({ status, ...(municipality ? { m: municipality } : {}) });
          return (
            <li key={status}>
              <Link
                href={`/admin/catches?${params}`}
                className="group flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Icon className={cn("size-4 shrink-0", style.text)} aria-hidden />
                <span className="min-w-0 flex-1 space-y-1.5">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm">{CATCH_STATUS_LABELS[status].label}</span>
                    <span className="text-sm font-medium tabular">
                      {formatNumber(n)}
                      <span className="ml-1.5 text-xs font-normal text-muted-foreground">{formatPercent(share)}</span>
                    </span>
                  </span>
                  <span className={cn("block h-1.5 overflow-hidden rounded-full", style.soft)} aria-hidden>
                    <span className={cn("block h-full rounded-full", style.bar)} style={{ width: `${share}%` }} />
                  </span>
                </span>
                <ChevronRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
