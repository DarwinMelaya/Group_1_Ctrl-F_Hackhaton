"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable, type ColumnDef, type SortingState } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, Download, Flag, MapPin, Sailboat, Search, Users, X } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/data/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MUNICIPALITIES } from "@/lib/analytics/overview";
import { downloadCsv, toCsv } from "@/lib/csv";
import { LICENSE_STATUS_LABELS, LICENSE_STATUS_ORDER, type LicenseStatus } from "@/lib/fishers/license";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { LICENSE_STYLE, LicenseBadge } from "./license-badge";

export type FisherRow = {
  id: string;
  name: string;
  municipality: string | null;
  barangay: string | null;
  phone: string | null;
  fishrNo: string | null;
  licenseExpiry: string | null;
  licenseStatus: LicenseStatus;
  daysLeft: number | null;
  boats: { name: string; boatrNo: string | null; grossTons: number | null }[];
  logs: number;
  flagged: number;
  lastLogAt: string | null;
};

const LICENSE_RANK: Record<LicenseStatus, number> = { expired: 0, expiring: 1, missing: 2, valid: 3 };
const fmtDate = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const fmtDay = (iso: string) => new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", timeZone: "Asia/Manila" });

export function FishersView({ rows, today, activityDays }: { rows: FisherRow[]; today: string; activityDays: number }) {
  const [q, setQ] = useState("");
  const [municipality, setMunicipality] = useState<string | null>(null);
  const [license, setLicense] = useState<LicenseStatus | null>(null);
  const [sorting, setSorting] = useState<SortingState>([{ id: "license", desc: false }]);

  // Search and municipality narrow the set; license chips count within it.
  const scoped = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (!municipality || r.municipality === municipality) &&
        (!needle ||
          [r.name, r.fishrNo, r.phone, r.barangay, ...r.boats.flatMap((b) => [b.name, b.boatrNo])].some((v) => v?.toLowerCase().includes(needle))),
    );
  }, [rows, q, municipality]);
  const visible = useMemo(() => (license ? scoped.filter((r) => r.licenseStatus === license) : scoped), [scoped, license]);
  const counts = useMemo(
    () => LICENSE_STATUS_ORDER.reduce((acc, s) => ({ ...acc, [s]: scoped.filter((r) => r.licenseStatus === s).length }), {} as Record<LicenseStatus, number>),
    [scoped],
  );

  const columns = useMemo<ColumnDef<FisherRow>[]>(
    () => [
      {
        id: "name",
        header: "Fisher",
        accessorFn: (r) => r.name,
        cell: ({ row: { original: r } }) => (
          <span className="block min-w-40">
            <span className="block font-medium">{r.name}</span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3" aria-hidden />
              {[r.barangay, r.municipality].filter(Boolean).join(", ") || "No address"}
            </span>
          </span>
        ),
      },
      {
        id: "fishr",
        header: "FishR no.",
        accessorFn: (r) => r.fishrNo ?? "",
        cell: ({ row: { original: r } }) =>
          r.fishrNo ? <span className="whitespace-nowrap font-mono text-xs">{r.fishrNo}</span> : <span className="text-muted-foreground">Not registered</span>,
      },
      {
        id: "phone",
        header: "Phone",
        enableSorting: false,
        cell: ({ row: { original: r } }) => <span className="whitespace-nowrap tabular">{r.phone ?? <span className="text-muted-foreground">None</span>}</span>,
      },
      {
        id: "boats",
        header: "Boats (BoatR)",
        accessorFn: (r) => r.boats.length,
        cell: ({ row: { original: r } }) =>
          r.boats.length === 0 ? (
            <span className="text-muted-foreground">No boat registered</span>
          ) : (
            <ul className="space-y-1">
              {r.boats.map((b) => (
                <li key={b.boatrNo ?? b.name} className="min-w-44">
                  <span className="flex items-center gap-1.5">
                    <Sailboat className="size-3.5 text-muted-foreground" aria-hidden />
                    {b.name}
                    {b.grossTons != null && <span className="text-xs text-muted-foreground tabular">{b.grossTons} GT</span>}
                  </span>
                  {b.boatrNo && <span className="block pl-5 font-mono text-xs text-muted-foreground">{b.boatrNo}</span>}
                </li>
              ))}
            </ul>
          ),
      },
      {
        id: "license",
        header: "License",
        accessorFn: (r) => LICENSE_RANK[r.licenseStatus] * 100_000 + (r.daysLeft ?? 0),
        cell: ({ row: { original: r } }) => (
          <span className="block space-y-1">
            <LicenseBadge status={r.licenseStatus} daysLeft={r.daysLeft} />
            {r.licenseExpiry && (
              <span className="block whitespace-nowrap text-xs text-muted-foreground tabular">
                {r.licenseStatus === "expired" ? "Expired " : "Until "}
                {fmtDate(r.licenseExpiry)}
              </span>
            )}
          </span>
        ),
      },
      {
        id: "logs",
        header: `Logs, ${activityDays} days`,
        accessorFn: (r) => r.logs,
        cell: ({ row: { original: r } }) => (
          <span className="block text-right tabular">
            {formatNumber(r.logs)}
            <span className="block text-xs text-muted-foreground">{r.lastLogAt ? `last ${fmtDay(r.lastLogAt)}` : "none"}</span>
          </span>
        ),
      },
      {
        id: "flagged",
        header: "For review",
        accessorFn: (r) => r.flagged,
        cell: ({ row: { original: r } }) =>
          r.flagged > 0 ? (
            <Link
              href={`/admin/catches?status=flagged&q=${encodeURIComponent(r.name)}`}
              prefetch={false}
              className="inline-flex items-center gap-1 whitespace-nowrap text-sm text-coral hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <Flag className="size-3.5" aria-hidden />
              {r.flagged} flagged
            </Link>
          ) : (
            <span className="text-sm text-muted-foreground">None</span>
          ),
      },
    ],
    [activityDays],
  );

  const table = useReactTable({
    data: visible,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  function exportCsv() {
    const sorted = table.getRowModel().rows.map((r) => r.original);
    const csv = toCsv(
      ["Name", "Municipality", "Barangay", "Phone", "FishR no.", "License expiry", "License status", "Boats", "BoatR nos.", "Gross tons", `Logs (last ${activityDays} days)`, "Last log", "Flagged for review"],
      sorted.map((r) => [
        r.name,
        r.municipality,
        r.barangay,
        r.phone,
        r.fishrNo,
        r.licenseExpiry,
        LICENSE_STATUS_LABELS[r.licenseStatus],
        r.boats.map((b) => b.name).join("; "),
        r.boats.map((b) => b.boatrNo ?? "").join("; "),
        r.boats.map((b) => b.grossTons ?? "").join("; "),
        r.logs,
        r.lastLogAt ? r.lastLogAt.slice(0, 10) : "",
        r.flagged,
      ]),
    );
    downloadCsv(`maraine-fishers-${today}.csv`, csv);
    toast.success(`Exported ${sorted.length} ${sorted.length === 1 ? "fisher" : "fishers"} to CSV`);
  }

  const totalBoats = rows.reduce((n, r) => n + r.boats.length, 0);
  const filtered = Boolean(q || municipality || license);

  return (
    <>
      <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Tile label="Registered fishers" value={rows.length} icon={Users} />
        <Tile label="Registered boats" value={totalBoats} icon={Sailboat} />
        <Tile label="Expired licenses" value={rows.filter((r) => r.licenseStatus === "expired").length} icon={LICENSE_STYLE.expired.icon} tone="text-coral" />
        <Tile label="Expiring in 30 days" value={rows.filter((r) => r.licenseStatus === "expiring").length} icon={LICENSE_STYLE.expiring.icon} tone="text-warning" />
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2" role="search" aria-label="Filter fishers">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <label htmlFor="fisher-search" className="sr-only">
            Search fishers
          </label>
          <Input id="fisher-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, FishR, phone or boat" className="h-9 bg-card pl-8" />
        </div>
        <Select value={municipality ?? "all"} onValueChange={(v) => setMunicipality(v === "all" ? null : v)}>
          <SelectTrigger className="h-9 w-48 bg-card" aria-label="Municipality">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All municipalities</SelectItem>
            {MUNICIPALITIES.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {filtered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQ("");
              setMunicipality(null);
              setLicense(null);
            }}
          >
            <X className="mr-1 size-4" /> Clear filters
          </Button>
        )}
        <Button variant="outline" size="sm" className="ml-auto" onClick={exportCsv} disabled={visible.length === 0}>
          <Download className="mr-1.5 size-4" /> Export CSV
          <span className="ml-1.5 text-xs text-muted-foreground tabular">({visible.length})</span>
        </Button>
      </div>

      <div role="group" aria-label="License status" className="mb-4 flex flex-wrap gap-2">
        <Chip pressed={license === null} onClick={() => setLicense(null)}>
          All <span className="tabular text-muted-foreground">{scoped.length}</span>
        </Chip>
        {LICENSE_STATUS_ORDER.map((s) => {
          const Icon = LICENSE_STYLE[s].icon;
          return (
            <Chip key={s} pressed={license === s} onClick={() => setLicense(license === s ? null : s)}>
              <Icon className={cn("size-3.5", LICENSE_STYLE[s].className.split(" ").find((c) => c.startsWith("text-")))} aria-hidden />
              {LICENSE_STATUS_LABELS[s]} <span className="tabular text-muted-foreground">{counts[s]}</span>
            </Chip>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <EmptyState icon={Users} title="No fishers match these filters" description="Try a different name, municipality or license status." />
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              {table.getHeaderGroups().map((group) => (
                <tr key={group.id}>
                  {group.headers.map((header) => {
                    const sorted = header.column.getIsSorted();
                    const numeric = header.column.id === "logs";
                    return (
                      <th
                        key={header.id}
                        scope="col"
                        aria-sort={sorted ? (sorted === "desc" ? "descending" : "ascending") : undefined}
                        className={cn("whitespace-nowrap px-3 py-2.5 text-xs font-medium text-muted-foreground", numeric ? "text-right" : "text-left")}
                      >
                        {header.column.getCanSort() ? (
                          <button
                            type="button"
                            onClick={header.column.getToggleSortingHandler()}
                            className={cn("inline-flex items-center gap-1 rounded hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", sorted && "text-foreground")}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {sorted === "desc" ? <ArrowDown className="size-3" /> : sorted === "asc" ? <ArrowUp className="size-3" /> : <ArrowUpDown className="size-3 opacity-50" />}
                          </button>
                        ) : (
                          flexRender(header.column.columnDef.header, header.getContext())
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y">
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className={cn(row.original.licenseStatus === "expired" && "bg-coral-soft/40")}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-2.5 align-top">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        {visible.length} of {rows.length} fishers shown. A license is valid through its expiry date. Names, numbers and dates are SAMPLE DATA.
      </p>
    </>
  );
}

function Tile({ label, value, icon: Icon, tone }: { label: string; value: number; icon: typeof Users; tone?: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon className={cn("size-4 text-muted-foreground", tone)} aria-hidden />
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-tight tabular">{formatNumber(value)}</p>
    </div>
  );
}

function Chip({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        pressed ? "border-primary bg-primary text-primary-foreground [&_span]:text-primary-foreground/80" : "bg-card hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}
