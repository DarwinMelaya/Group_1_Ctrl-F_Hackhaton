import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { ErrorState } from "@/components/data/states";
import { FishersView, type FisherRow } from "@/components/fishers/fishers-view";
import { addDays, todayInManila } from "@/lib/analytics/overview";
import { daysUntil, licenseStatus } from "@/lib/fishers/license";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Fishers" };

const ACTIVITY_DAYS = 60;

export default async function FishersPage() {
  const today = todayInManila();
  const since = `${addDays(today, -(ACTIVITY_DAYS - 1))}T00:00:00+08:00`;
  const supabase = createClient();

  const [profiles, boats, catches] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, municipality, barangay, phone, fishr_no, license_expiry, created_at")
      .eq("role", "fisher")
      .order("full_name"),
    supabase.from("boats").select("owner_id, name, boatr_no, gross_tons, registered_at").order("boatr_no"),
    supabase.from("catches").select("fisher_id, caught_at, status").gte("caught_at", since).limit(20000),
  ]);

  const header = (
    <PageHeader
      title="Fishers"
      description="FishR and BoatR registration and license status for registered fishers. Export the current list to CSV for MAO or BFAR records."
    />
  );
  const error = profiles.error ?? boats.error ?? catches.error;
  if (error) {
    return (
      <>
        {header}
        <ErrorState title="Could not load fishers" description={error.message} />
      </>
    );
  }

  const activity = new Map<string, { logs: number; flagged: number; last: string | null }>();
  for (const c of catches.data ?? []) {
    const a = activity.get(c.fisher_id) ?? { logs: 0, flagged: 0, last: null };
    a.logs += 1;
    if (c.status === "flagged") a.flagged += 1;
    if (!a.last || c.caught_at > a.last) a.last = c.caught_at;
    activity.set(c.fisher_id, a);
  }

  const rows: FisherRow[] = (profiles.data ?? []).map((p) => {
    const a = activity.get(p.id);
    return {
      id: p.id,
      name: p.full_name || "Unnamed fisher",
      municipality: p.municipality,
      barangay: p.barangay,
      phone: p.phone,
      fishrNo: p.fishr_no,
      licenseExpiry: p.license_expiry,
      licenseStatus: licenseStatus(p.license_expiry, today),
      daysLeft: p.license_expiry ? daysUntil(p.license_expiry, today) : null,
      boats: (boats.data ?? [])
        .filter((b) => b.owner_id === p.id)
        .map((b) => ({ name: b.name, boatrNo: b.boatr_no, grossTons: b.gross_tons === null ? null : Number(b.gross_tons) })),
      logs: a?.logs ?? 0,
      flagged: a?.flagged ?? 0,
      lastLogAt: a?.last ?? null,
    };
  });

  return (
    <>
      {header}
      <FishersView rows={rows} today={today} activityDays={ACTIVITY_DAYS} />
    </>
  );
}
