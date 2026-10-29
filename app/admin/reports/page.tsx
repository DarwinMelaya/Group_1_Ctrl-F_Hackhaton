import type { Metadata } from "next";
import Link from "next/link";
import { MousePointerClick } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState, ErrorState } from "@/components/data/states";
import { ReportDetail } from "@/components/reports/report-detail";
import { ReportQueue } from "@/components/reports/report-queue";
import { ReportTypeFilter } from "@/components/reports/report-type-filter";
import { Constants } from "@/lib/database.types";
import { REPORT_STATUS_LABELS } from "@/lib/reports/labels";
import { createClient } from "@/lib/supabase/server";
import type { ReportStatus, ReportType } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Reports" };

const TABS = ["open", "received", "investigating", "resolved", "all"] as const;
type Tab = (typeof TABS)[number];
const TAB_LABELS: Record<Tab, string> = {
  open: "Open",
  received: REPORT_STATUS_LABELS.received.label,
  investigating: REPORT_STATUS_LABELS.investigating.label,
  resolved: REPORT_STATUS_LABELS.resolved.label,
  all: "All",
};
const PHOTO_BUCKET = "report-photos";

type Params = { tab?: string; type?: string; id?: string };

export default async function ReportsPage({ searchParams }: { searchParams: Params }) {
  const tab: Tab = (TABS as readonly string[]).includes(searchParams.tab ?? "") ? (searchParams.tab as Tab) : "open";
  const type = (Constants.public.Enums.report_type as readonly string[]).includes(searchParams.type ?? "") ? (searchParams.type as ReportType) : null;
  const supabase = createClient();

  const [{ data: all, error }, { data: zones }] = await Promise.all([
    supabase.from("report_details").select("*").order("created_at", { ascending: false }).limit(500),
    supabase.from("zones_geojson").select("*"),
  ]);

  const header = <PageHeader title="Reports" description="Community reports of illegal fishing, pollution and habitat damage. Move each one from Received to Resolved and keep notes." />;
  if (error) {
    return (
      <>
        {header}
        <ErrorState title="Could not load reports" description={error.message} />
      </>
    );
  }

  const reports = all ?? [];
  const byType = type ? reports.filter((r) => r.type === type) : reports;
  const counts: Record<Tab, number> = {
    open: byType.filter((r) => r.status !== "resolved").length,
    received: byType.filter((r) => r.status === "received").length,
    investigating: byType.filter((r) => r.status === "investigating").length,
    resolved: byType.filter((r) => r.status === "resolved").length,
    all: byType.length,
  };
  // Open work first: Received, then Investigating, newest first within each.
  const rank: Record<ReportStatus, number> = { received: 0, investigating: 1, resolved: 2 };
  const visible = byType
    .filter((r) => (tab === "all" ? true : tab === "open" ? r.status !== "resolved" : r.status === tab))
    .sort((a, b) => rank[a.status!] - rank[b.status!] || b.created_at!.localeCompare(a.created_at!));

  // Open the first report in the queue when none is chosen, so the detail panel is never empty on arrival.
  const selected = searchParams.id ? (reports.find((r) => r.id === searchParams.id) ?? null) : (visible[0] ?? null);
  let photoUrl: string | null = null;
  if (selected?.photo_url) {
    // photo_url holds the storage path ("<user id>/<file>"); full URLs are used as-is.
    if (/^https?:\/\//.test(selected.photo_url)) photoUrl = selected.photo_url;
    else photoUrl = (await supabase.storage.from(PHOTO_BUCKET).createSignedUrl(selected.photo_url, 600)).data?.signedUrl ?? null;
  }

  const href = (update: Partial<Params>) => {
    const p = new URLSearchParams();
    const merged = { tab: tab === "open" ? undefined : tab, type: type ?? undefined, id: selected?.id ?? undefined, ...update };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const qs = p.toString();
    return `/admin/reports${qs ? `?${qs}` : ""}`;
  };

  return (
    <>
      {header}
      <div className="grid gap-4 lg:h-[calc(100vh-10.5rem)] lg:grid-cols-[minmax(20rem,26rem)_minmax(0,1fr)]">
        <section className="flex min-h-0 flex-col rounded-lg border bg-card" aria-label="Report queue">
          <div className="space-y-3 border-b px-3 py-3">
            <nav aria-label="Status" className="flex flex-wrap gap-1">
              {TABS.map((t) => (
                <Link
                  key={t}
                  href={href({ tab: t === "open" ? undefined : t, id: undefined })}
                  scroll={false}
                  aria-current={tab === t ? "page" : undefined}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    tab === t ? "bg-primary font-medium text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {TAB_LABELS[t]}
                  <span className={cn("rounded px-1 text-xs tabular", tab === t ? "bg-primary-foreground/15" : "bg-muted")}>{counts[t]}</span>
                </Link>
              ))}
            </nav>
            <ReportTypeFilter value={type} />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <ReportQueue reports={visible} selectedId={selected?.id ?? null} hrefFor={(id) => href({ id })} />
          </div>
        </section>

        <section className="flex min-h-[32rem] flex-col overflow-hidden rounded-lg border bg-card" aria-label="Report detail">
          {selected ? (
            <ReportDetail report={selected} photoUrl={photoUrl} zones={zones ?? []} />
          ) : (
            <EmptyState
              className="m-4 flex-1"
              icon={MousePointerClick}
              title="Select a report"
              description="Choose a report from the queue to see the photo, location and next step."
            />
          )}
        </section>
      </div>
    </>
  );
}
