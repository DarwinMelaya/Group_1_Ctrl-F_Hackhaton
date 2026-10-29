import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { CatchFilters } from "@/components/catches/catch-filters";
import { CatchesTable } from "@/components/catches/catches-table";
import { ErrorState, TableSkeleton } from "@/components/data/states";
import { NO_ZONE, PAGE_SIZE, parseCatchFilters, sanitizeSearch, type CatchFilters as Filters } from "@/lib/catch/query";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Catches" };

export default async function CatchesPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const filters = parseCatchFilters(searchParams);
  const supabase = createClient();
  const [species, zones] = await Promise.all([
    supabase.from("species").select("id, local_name").order("local_name"),
    supabase.from("zones").select("id, name").order("name"),
  ]);

  return (
    <>
      <PageHeader
        title="Catches"
        description="Every catch log with its zone check. Flagged logs are for review: open one to see why, then mark it Reviewed or Verified with a note."
      />
      <CatchFilters
        filters={filters}
        species={(species.data ?? []).map((s) => ({ id: s.id, label: s.local_name }))}
        zones={(zones.data ?? []).map((z) => ({ id: z.id, label: z.name }))}
      />
      <Suspense key={JSON.stringify(filters)} fallback={<TableSkeleton rows={10} columns={8} />}>
        <CatchRows filters={filters} openId={typeof searchParams.open === "string" ? searchParams.open : null} />
      </Suspense>
    </>
  );
}

async function CatchRows({ filters, openId }: { filters: Filters; openId: string | null }) {
  let query = createClient().from("catch_details").select("*", { count: "exact" });

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.species) query = query.eq("species_id", filters.species);
  if (filters.zone === NO_ZONE) query = query.is("zone_id", null);
  else if (filters.zone) query = query.eq("zone_id", filters.zone);
  if (filters.municipality) query = query.eq("municipality", filters.municipality);

  const q = sanitizeSearch(filters.q);
  if (q) {
    query = query.or(
      [`fisher_name.ilike.*${q}*`, `species_local_name.ilike.*${q}*`, `species_english_name.ilike.*${q}*`, `fishr_no.ilike.*${q}*`, `qr_token.eq.${q}`].join(","),
    );
  }

  const start = (filters.page - 1) * PAGE_SIZE;
  const { data, count, error } = await query
    .order(filters.sort, { ascending: !filters.desc, nullsFirst: false })
    .order("id")
    .range(start, start + PAGE_SIZE - 1);

  if (error) return <ErrorState title="Could not load catches" description={error.message} />;
  return <CatchesTable rows={data ?? []} total={count ?? 0} filters={filters} initialOpenId={openId} />;
}
