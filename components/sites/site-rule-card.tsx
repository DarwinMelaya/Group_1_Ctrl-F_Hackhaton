"use client";

import { useState, useTransition } from "react";
import { CircleAlert, CircleCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { saveSiteRule } from "@/app/admin/sites/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SiteRule } from "@/lib/sites/types";
import { cn } from "@/lib/utils";

const str = (v: number | string | null) => (v === null ? "" : String(v));
const hhmm = (v: string | null) => (v ? v.slice(0, 5) : "");

/** One coastal site: live visitors against capacity, and the form to set its rules. */
export function SiteRuleCard({ site, visitorsNow }: { site: SiteRule; visitorsNow: number }) {
  const [pending, start] = useTransition();
  const [form, setForm] = useState({
    capacity: str(site.capacity),
    maxStayMinutes: str(site.max_stay_minutes),
    openFrom: hhmm(site.open_from),
    openTo: hhmm(site.open_to),
    feePhp: str(site.fee_php),
    notes: site.notes ?? "",
    source: site.source ?? "",
  });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const full = site.capacity !== null && visitorsNow >= site.capacity;
  const share = site.capacity ? Math.min(100, Math.round((visitorsNow / site.capacity) * 100)) : 0;

  const save = () =>
    start(async () => {
      const r = await saveSiteRule({ placeId: site.place_id, ...form });
      if (r.ok) toast.success(`${site.name} saved`);
      else toast.error(r.error);
    });

  return (
    <Card>
      <CardHeader className="space-y-1 pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">{site.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{site.municipality}</p>
          </div>
          <div className="text-right">
            <p className="flex items-center justify-end gap-1.5 text-sm font-medium tabular-nums">
              <Users className="size-4 text-muted-foreground" aria-hidden />
              {visitorsNow}
              {site.capacity !== null && <span className="text-muted-foreground">/ {site.capacity}</span>}
            </p>
            <p className={cn("flex items-center justify-end gap-1 text-xs", full ? "text-coral" : "text-muted-foreground")}>
              {full ? <CircleAlert className="size-3.5" aria-hidden /> : <CircleCheck className="size-3.5" aria-hidden />}
              {site.capacity === null ? "No limit set" : full ? "Full" : "Visitors now"}
            </p>
          </div>
        </div>
        {site.capacity !== null && (
          <div className="h-1.5 overflow-hidden rounded-full bg-muted" role="presentation">
            <div className={cn("h-full rounded-full", full ? "bg-coral" : "bg-teal")} style={{ width: `${share}%` }} />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <form
          className="grid grid-cols-2 gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <Field id={`${site.place_id}-cap`} label="Capacity (people at once)">
            <Input id={`${site.place_id}-cap`} inputMode="numeric" placeholder="No limit" value={form.capacity} onChange={set("capacity")} />
          </Field>
          <Field id={`${site.place_id}-stay`} label="Time limit per visit (minutes)">
            <Input id={`${site.place_id}-stay`} inputMode="numeric" placeholder="No limit" value={form.maxStayMinutes} onChange={set("maxStayMinutes")} />
          </Field>
          <Field id={`${site.place_id}-from`} label="Opens">
            <Input id={`${site.place_id}-from`} type="time" value={form.openFrom} onChange={set("openFrom")} />
          </Field>
          <Field id={`${site.place_id}-to`} label="Closes">
            <Input id={`${site.place_id}-to`} type="time" value={form.openTo} onChange={set("openTo")} />
          </Field>
          <Field id={`${site.place_id}-fee`} label="Fee per person (PHP)">
            <Input id={`${site.place_id}-fee`} inputMode="decimal" placeholder="None" value={form.feePhp} onChange={set("feePhp")} />
          </Field>
          <Field id={`${site.place_id}-notes`} label="Notes for visitors">
            <Input id={`${site.place_id}-notes`} placeholder="e.g. Low tide only" value={form.notes} onChange={set("notes")} />
          </Field>
          <Field id={`${site.place_id}-src`} label="Source of these rules" className="col-span-2">
            <Input id={`${site.place_id}-src`} placeholder="e.g. Barangay Maniwaya Ordinance No. __, s. 2025" value={form.source} onChange={set("source")} />
          </Field>
          <div className="col-span-2 flex justify-end">
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({ id, label, className, children }: { id: string; label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}
