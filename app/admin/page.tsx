import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { OverviewData } from "@/components/overview/overview-data";
import { OverviewFilters } from "@/components/overview/overview-filters";
import { OverviewSkeleton } from "@/components/overview/overview-skeleton";
import { parseOverviewFilters, todayInManila } from "@/lib/analytics/overview";

export const metadata: Metadata = { title: "Overview" };

export default function OverviewPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const today = todayInManila();
  const filters = parseOverviewFilters(searchParams, today);

  return (
    <>
      <PageHeader
        title="Overview"
        description="Catch volume, species mix and items that need attention across Marinduque. Figures are SAMPLE DATA."
      />
      <OverviewFilters filters={filters} today={today} />
      <Suspense key={`${filters.from}|${filters.to}|${filters.municipality}`} fallback={<OverviewSkeleton />}>
        <OverviewData filters={filters} />
      </Suspense>
    </>
  );
}
