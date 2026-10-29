"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { ArrowRight, CircleCheck, ImageOff, Inbox, Loader2, MapPinOff, RotateCcw, Search, UserRound } from "lucide-react";
import { toast } from "sonner";
import { updateReport } from "@/app/admin/reports/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { REPORT_STATUS_LABELS, REPORT_STATUS_ORDER, REPORT_TYPE_LABELS } from "@/lib/reports/labels";
import type { ReportDetail as Report, ReportStatus, ZoneWithGeoJson } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ReportStatusBadge } from "./report-status";

const ReportLocationMap = dynamic(() => import("./report-location-map"), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-none" />,
});

const STEP_ICONS = { received: Inbox, investigating: Search, resolved: CircleCheck };
const MARKER = { received: "#D64933", investigating: "#B45309", resolved: "#0F766E" };

const dateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Manila" });

export function ReportDetail({ report, photoUrl, zones }: { report: Report; photoUrl: string | null; zones: ZoneWithGeoJson[] }) {
  const status = report.status!;
  return (
    <article className="flex min-h-0 flex-1 flex-col" aria-labelledby="report-title">
      <header className="space-y-2 border-b px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="report-title" className="text-base font-semibold">
            {REPORT_TYPE_LABELS[report.type!]}
          </h2>
          <ReportStatusBadge status={status} />
        </div>
        <p className="text-xs text-muted-foreground">
          Filed {dateTime(report.created_at!)}
          {report.updated_at && report.updated_at !== report.created_at && ` · updated ${dateTime(report.updated_at)}`}
        </p>
        <Stepper status={status} />
      </header>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
        <div className="grid gap-4 xl:grid-cols-2">
          <figure className="overflow-hidden rounded-md border bg-muted">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL from private storage
              <img src={photoUrl} alt={`Photo attached to the ${REPORT_TYPE_LABELS[report.type!].toLowerCase()} report`} className="aspect-[4/3] w-full object-cover" />
            ) : (
              <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 text-muted-foreground">
                <ImageOff className="size-6" aria-hidden />
                <span className="text-xs">{report.photo_url ? "Photo could not be loaded" : "No photo attached"}</span>
              </div>
            )}
          </figure>
          <div className="aspect-[4/3] overflow-hidden rounded-md border">
            {report.lat !== null && report.lng !== null ? (
              <ReportLocationMap lat={report.lat} lng={report.lng} color={MARKER[status]} zones={zones} />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 bg-muted text-muted-foreground">
                <MapPinOff className="size-6" aria-hidden />
                <span className="text-xs">No location given</span>
              </div>
            )}
          </div>
        </div>

        <section className="space-y-1.5">
          <h3 className="text-sm font-semibold">What was reported</h3>
          <p className="whitespace-pre-line text-sm">{report.description}</p>
        </section>

        <dl className="grid grid-cols-[7rem_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Reported by</dt>
          <dd className="flex items-center gap-1.5">
            <UserRound className="size-3.5 text-muted-foreground" aria-hidden />
            {report.reporter_name ? `${report.reporter_name}${report.reporter_municipality ? `, ${report.reporter_municipality}` : ""}` : "Anonymous or hotline"}
          </dd>
          <dt className="text-muted-foreground">Location</dt>
          <dd className="tabular">
            {report.lat !== null && report.lng !== null ? `${report.lat.toFixed(5)}, ${report.lng.toFixed(5)}` : "Not given"}
          </dd>
        </dl>
      </div>

      <StatusForm key={`${report.id}-${status}-${report.updated_at}`} report={report} />
    </article>
  );
}

function Stepper({ status }: { status: ReportStatus }) {
  const current = REPORT_STATUS_ORDER.indexOf(status);
  return (
    <ol className="flex items-center gap-1 pt-1" aria-label="Report progress">
      {REPORT_STATUS_ORDER.map((s, i) => {
        const Icon = STEP_ICONS[s];
        const done = i <= current;
        return (
          <li key={s} className="flex items-center gap-1" aria-current={i === current ? "step" : undefined}>
            <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs", done ? "bg-teal-soft font-medium text-teal" : "text-muted-foreground")}>
              <Icon className="size-3" aria-hidden />
              {REPORT_STATUS_LABELS[s].label}
            </span>
            {i < REPORT_STATUS_ORDER.length - 1 && <ArrowRight className="size-3 text-muted-foreground" aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}

function StatusForm({ report }: { report: Report }) {
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const [note, setNote] = useState(report.admin_note ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState<ReportStatus | null>(null);
  const status = report.status!;

  useEffect(() => {
    setError("");
  }, [note]);

  async function save(next: ReportStatus) {
    setSaving(next);
    const result = await updateReport({ id: report.id, status: next, note });
    setSaving(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast.success(next === status ? "Note saved" : `Report moved to ${REPORT_STATUS_LABELS[next].label}`);
    startRefresh(() => router.refresh());
  }

  const busy = saving !== null || refreshing;
  const next: { to: ReportStatus; label: string; icon: typeof Search } | null =
    status === "received"
      ? { to: "investigating", label: "Start investigating", icon: Search }
      : status === "investigating"
        ? { to: "resolved", label: "Mark resolved", icon: CircleCheck }
        : { to: "investigating", label: "Reopen", icon: RotateCcw };

  return (
    <form
      className="space-y-3 border-t bg-card px-5 py-4"
      onSubmit={(e) => {
        e.preventDefault();
        save(next.to);
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="report-note">Admin note</Label>
        <Textarea
          id="report-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="Who is following up and what was done, e.g. Bantay Dagat Gasan patrol scheduled for Friday."
          aria-invalid={!!error}
          aria-describedby={error ? "report-error" : "report-note-help"}
        />
        {error ? (
          <p id="report-error" className="text-sm text-coral">
            {error}
          </p>
        ) : (
          <p id="report-note-help" className="text-xs text-muted-foreground">
            Visible to admins only. Required when resolving.
          </p>
        )}
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" disabled={busy || note === (report.admin_note ?? "")} onClick={() => save(status)}>
          {saving === status && <Loader2 className="mr-2 size-4 animate-spin" />}
          Save note
        </Button>
        <Button type="submit" disabled={busy} variant={status === "resolved" ? "outline" : "default"}>
          {saving === next.to ? <Loader2 className="mr-2 size-4 animate-spin" /> : <next.icon className="mr-2 size-4" />}
          {next.label}
        </Button>
      </div>
    </form>
  );
}
