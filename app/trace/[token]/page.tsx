import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarDays, CircleCheck, ClipboardCheck, Clock, Flag, MapPin, MessageSquareText, Smartphone, TriangleAlert, UserCheck, UserRound, type LucideIcon } from "lucide-react";
import { AppLogo } from "@/components/brand/app-logo";
import { createClient } from "@/lib/supabase/server";
import { isValidTraceToken } from "@/lib/trace";
import type { CatchSource, CatchStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Catch trace",
  description: "Where and when this catch was landed in Marinduque, and whether it passed the checks.",
  robots: { index: false, follow: false },
};

// Plain words for buyers. A flag is a prompt for a check, never a verdict.
const STATUS: Record<CatchStatus, { icon: LucideIcon; title: string; tl: string; body: string; tone: string }> = {
  verified: {
    icon: CircleCheck,
    title: "Verified",
    tl: "Napatunayan",
    body: "This catch passed every check when it was logged: a licensed fisher, an open fishing area, the right season and legal size.",
    tone: "border-teal/30 bg-teal-soft text-teal",
  },
  reviewed: {
    icon: ClipboardCheck,
    title: "Reviewed",
    tl: "Nasuri na",
    body: "This catch was checked by the Municipal Agriculture Office after it was logged.",
    tone: "border-navy/20 bg-secondary text-navy dark:text-foreground",
  },
  flagged: {
    icon: Flag,
    title: "Flagged for review",
    tl: "Sinusuri pa",
    body: "Something in this log needs a check by the Municipal Agriculture Office, for example the area or the fisher's license. It does not mean the catch was illegal.",
    tone: "border-coral/30 bg-coral-soft text-coral",
  },
  pending: {
    icon: Clock,
    title: "Pending verification",
    tl: "Hinihintay pa",
    body: "This catch was logged without a location, so the fishing area has not been checked yet.",
    tone: "border-warning/30 bg-warning-soft text-warning",
  },
};

const SOURCE: Record<CatchSource, { icon: LucideIcon; label: string }> = {
  app: { icon: Smartphone, label: "Logged by the fisher in the MarAIne app" },
  sms: { icon: MessageSquareText, label: "Logged by the fisher by text message" },
  pic: { icon: UserCheck, label: "Logged by staff at the landing site" },
};

const SHOW_SAMPLE_NOTICE = process.env.NEXT_PUBLIC_SAMPLE_DATA !== "false";

export default async function TracePage({ params }: { params: { token: string } }) {
  if (!isValidTraceToken(params.token)) notFound();

  // get_trace() returns one sanitized row: no coordinates, no full name, no phone or license data.
  const { data, error } = await createClient().rpc("get_trace", { p_token: params.token });
  if (error) throw new Error("Trace lookup failed");
  const trace = data?.[0];
  if (!trace) notFound();

  const status = STATUS[trace.status ?? "pending"];
  const StatusIcon = status.icon;
  const source = trace.source ? SOURCE[trace.source] : null;
  const caughtOn = trace.caught_on
    ? new Date(`${trace.caught_on}T00:00:00Z`).toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })
    : "Not recorded";

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-md space-y-4">
        <header className="flex items-center gap-2">
          <AppLogo />
          <div className="leading-tight">
            <p className="text-sm font-semibold">MarAIne</p>
            <p className="text-xs text-muted-foreground">Catch trace · Marinduque</p>
          </div>
        </header>

        {SHOW_SAMPLE_NOTICE && (
          <p className="rounded-md bg-sand px-3 py-2 text-xs text-sand-foreground">SAMPLE DATA: this is a demonstration record, not a real catch.</p>
        )}

        <article className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="space-y-1 border-b px-5 pb-4 pt-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Ang huli · The catch</p>
            <h1 className="text-2xl font-semibold tracking-tight">{trace.species_local_name}</h1>
            <p className="text-sm text-muted-foreground">{trace.species_english_name}</p>
          </div>

          <section className={cn("m-4 rounded-lg border px-4 py-3", status.tone)} aria-label="Check result">
            <p className="flex items-center gap-2 text-base font-semibold">
              <StatusIcon className="size-5 shrink-0" aria-hidden />
              {status.title}
              <span className="text-sm font-normal opacity-80">· {status.tl}</span>
            </p>
            <p className="mt-1 text-sm text-foreground">{status.body}</p>
          </section>

          {trace.pollution_advisory && (
            <section className="mx-4 mb-4 flex gap-2 rounded-lg border border-[#7C3AED]/30 bg-[#7C3AED]/10 px-4 py-3 text-sm" aria-label="Advisory">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-[#7C3AED]" aria-hidden />
              <p>
                <span className="font-semibold">Pollution advisory area.</span> This catch came from waters under a local advisory. Follow the Municipal
                Agriculture Office&apos;s guidance, especially for shellfish.
              </p>
            </section>
          )}

          <dl className="divide-y border-t text-sm">
            <Row icon={CalendarDays} label="Petsa ng huli · Date caught" value={caughtOn} />
            <Row icon={UserRound} label="Mangingisda · Fisher" value={trace.fisher_first_name ?? "Registered fisher"} />
            <Row icon={MapPin} label="Lugar · General area" value={trace.municipality ? `${trace.municipality}, Marinduque` : "Marinduque"} />
            {source && <Row icon={source.icon} label="Paano naitala · How it was logged" value={source.label} />}
          </dl>
        </article>

        <footer className="space-y-2 px-1 text-xs text-muted-foreground">
          <p>
            To protect fishers&apos; privacy and fishing grounds, this page shows only the first name and the municipality, never the exact
            location.
          </p>
          <p className="font-mono">Code {trace.qr_token}</p>
        </footer>
      </div>
    </main>
  );
}

function Row({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex gap-3 px-5 py-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="font-medium">{value}</dd>
      </div>
    </div>
  );
}
