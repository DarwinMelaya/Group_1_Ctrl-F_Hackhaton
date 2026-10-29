import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { ErrorState } from "@/components/data/states";
import { SmsSimulator, type SenderOption } from "@/components/sms/sms-simulator";
import { todayInManila } from "@/lib/analytics/overview";
import { daysUntil, licenseStatus } from "@/lib/fishers/license";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "SMS Simulator" };

export default async function SmsPage() {
  const today = todayInManila();
  const { data, error } = await createClient()
    .from("profiles")
    .select("full_name, phone, municipality, license_expiry")
    .eq("role", "fisher")
    .not("phone", "is", null)
    .order("full_name");

  const header = (
    <PageHeader
      title="SMS Simulator"
      description="Fishers without smartphones log catches by text. Send a message here to see exactly what the SMS webhook logs and replies."
    />
  );
  if (error) {
    return (
      <>
        {header}
        <ErrorState title="Could not load fishers" description={error.message} />
      </>
    );
  }

  const senders: SenderOption[] = (data ?? []).map((p) => ({
    phone: p.phone!,
    name: p.full_name,
    municipality: p.municipality,
    license: licenseStatus(p.license_expiry, today),
    daysLeft: p.license_expiry ? daysUntil(p.license_expiry, today) : null,
  }));

  return (
    <>
      {header}
      <SmsSimulator senders={senders} />
    </>
  );
}
