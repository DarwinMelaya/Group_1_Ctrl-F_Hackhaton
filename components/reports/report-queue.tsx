import Link from "next/link";
import { ImageOff, Image as ImageIcon, MapPin, Siren } from "lucide-react";
import { EmptyState } from "@/components/data/states";
import { nearestTown } from "@/lib/analytics/biodiversity";
import { formatRelative } from "@/lib/format";
import { REPORT_TYPE_LABELS } from "@/lib/reports/labels";
import type { ReportDetail } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ReportStatusBadge } from "./report-status";

/** Server-rendered queue. Each item links to ?id= so the detail (and its signed photo URL) loads on the server. */
export function ReportQueue({ reports, selectedId, hrefFor }: { reports: ReportDetail[]; selectedId: string | null; hrefFor: (id: string) => string }) {
  if (reports.length === 0) {
    return <EmptyState className="m-4" icon={Siren} title="No reports here" description="Nothing matches this status and type." />;
  }
  return (
    <ul className="divide-y">
      {reports.map((r) => {
        const selected = r.id === selectedId;
        return (
          <li key={r.id}>
            <Link
              href={hrefFor(r.id!)}
              scroll={false}
              aria-current={selected ? "true" : undefined}
              className={cn(
                "relative block space-y-1.5 px-4 py-3 transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none",
                selected && "bg-muted/80",
              )}
            >
              {selected && <span className="absolute inset-y-0 left-0 w-0.5 bg-teal" aria-hidden />}
              <span className="flex items-start justify-between gap-2">
                <span className="text-sm font-medium">{REPORT_TYPE_LABELS[r.type!]}</span>
                <ReportStatusBadge status={r.status!} />
              </span>
              <span className="line-clamp-2 block text-xs text-muted-foreground">{r.description}</span>
              <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span>{formatRelative(r.created_at!)}</span>
                {r.lat !== null && r.lng !== null && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3" aria-hidden />
                    {nearestTown(r.lat, r.lng)}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  {r.photo_url ? <ImageIcon className="size-3" aria-hidden /> : <ImageOff className="size-3" aria-hidden />}
                  {r.photo_url ? "Photo" : "No photo"}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
