import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState, ErrorState } from "@/components/data/states";
import { SiteRuleCard } from "@/components/sites/site-rule-card";
import { untyped, type SiteRule, type SiteStatus } from "@/lib/sites/types";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Visitor sites" };
export const dynamic = "force-dynamic";

export default async function SitesPage() {
  const supabase = untyped(createClient());
  const [rules, status] = await Promise.all([
    supabase.from("site_rules").select("place_id, name, municipality, capacity, max_stay_minutes, open_from, open_to, fee_php, notes, source, updated_at").order("municipality").order("name"),
    supabase.rpc("site_status"),
  ]);

  const header = (
    <PageHeader
      title="Visitor sites"
      description="Visitor capacity, time limit per visit, opening hours and fees for coastal sites. Tourists see these in the app and check in when they arrive. Use only limits from an ordinance, the barangay or the tourism office, and name the source."
    />
  );

  if (rules.error || status.error) {
    const missing = /site_rules|site_status/.test(rules.error?.message ?? status.error?.message ?? "");
    return (
      <>
        {header}
        <ErrorState
          title="Could not load the visitor sites"
          description={missing ? "Run supabase/migrations/010_visitor_capacity.sql in the Supabase SQL Editor first." : (rules.error ?? status.error)?.message ?? ""}
        />
      </>
    );
  }

  const live = new Map(((status.data ?? []) as SiteStatus[]).map((s) => [s.place_id, s.visitors_now]));
  const sites = (rules.data ?? []) as SiteRule[];

  return (
    <>
      {header}
      {sites.length === 0 ? (
        <EmptyState title="No sites yet" description="Run migration 010 to add the coastal sites." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {sites.map((s) => (
            <SiteRuleCard key={s.place_id} site={s} visitorsNow={live.get(s.place_id) ?? 0} />
          ))}
        </div>
      )}
    </>
  );
}
