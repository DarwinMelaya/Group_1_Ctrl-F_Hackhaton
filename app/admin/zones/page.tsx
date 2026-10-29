import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { ErrorState } from "@/components/data/states";
import { ZonesManager } from "@/components/zones/zones-manager";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Zones" };

export default async function ZonesPage() {
  const { data: zones, error } = await createClient()
    .from("zones_geojson")
    .select("*")
    .order("created_at", { ascending: true });

  return (
    <>
      <PageHeader
        title="Zones"
        description="Draw and manage restricted areas, marine sanctuaries, safe fishing grounds and pollution advisories. Every new catch log is checked against active zones."
      />
      {error ? <ErrorState title="Could not load zones" description={error.message} /> : <ZonesManager zones={zones ?? []} />}
    </>
  );
}
