"use client";

import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Fish, Info, Loader2 } from "lucide-react";
import { EmptyState } from "@/components/data/states";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  CELL_SIZE_DEG,
  WINDOW_OPTIONS,
  type HeatPoint,
  type SpeciesTrend,
  type TrendCell,
  type TrendStatus,
  type Windows,
} from "@/lib/analytics/biodiversity";
import { formatDayShort, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { TREND_META, TREND_ORDER, TrendBadge } from "./trend-status";

const BiodiversityMap = dynamic(() => import("./biodiversity-map"), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-none" />,
});

type Props = {
  cells: TrendCell[];
  heat: HeatPoint[];
  windows: Windows;
  species: { id: string; local_name: string; english_name: string }[];
  speciesId: string | null;
  speciesTrends: SpeciesTrend[];
};

export function BiodiversityView({ cells, heat, windows, species, speciesId, speciesTrends }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const [showCells, setShowCells] = useState(true);

  function push(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null) params.delete(key);
    else params.set(key, value);
    setFocusKey(null);
    startTransition(() => router.push(`${pathname}?${params}`, { scroll: false }));
  }

  const counts = TREND_ORDER.reduce((acc, s) => ({ ...acc, [s]: cells.filter((c) => c.status === s).length }), {} as Record<TrendStatus, number>);
  const watchList = cells.filter((c) => c.status === "critical" || c.status === "declining");
  const selectedSpecies = species.find((s) => s.id === speciesId);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2" role="toolbar" aria-label="Map filters">
        <Select value={speciesId ?? "all"} onValueChange={(v) => push("species", v === "all" ? null : v)}>
          <SelectTrigger className="h-9 w-56 bg-card" aria-label="Species">
            <Fish className="mr-2 size-3.5 text-muted-foreground" aria-hidden />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All species</SelectItem>
            {species.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.local_name} <span className="text-muted-foreground">({s.english_name})</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div role="group" aria-label="Comparison window" className="flex rounded-md border bg-card p-0.5">
          {WINDOW_OPTIONS.map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={windows.days === d}
              onClick={() => push("window", String(d))}
              className={cn(
                "rounded px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                windows.days === d ? "bg-primary font-medium text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {d} vs {d} days
            </button>
          ))}
        </div>

        <div className="ml-1 flex items-center gap-2">
          <Switch id="show-cells" checked={showCells} onCheckedChange={setShowCells} />
          <Label htmlFor="show-cells" className="text-sm font-normal">
            Show grid cells
          </Label>
        </div>

        {pending && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground" role="status">
            <Loader2 className="size-3.5 animate-spin" aria-hidden /> Updating
          </span>
        )}
      </div>

      <p className="mb-4 text-xs text-muted-foreground">
        {selectedSpecies ? `${selectedSpecies.local_name} (${selectedSpecies.english_name})` : "All species"}: {formatDayShort(windows.currentFrom)} to{" "}
        {formatDayShort(windows.currentTo)} compared with {formatDayShort(windows.previousFrom)} to {formatDayShort(windows.previousTo)}. Logs without a
        location (SMS) are not mapped.
      </p>

      <div className="grid gap-4 lg:h-[calc(100vh-14rem)] lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="relative h-[55vh] overflow-hidden rounded-lg border lg:h-full">
          {cells.length === 0 ? (
            <EmptyState
              className="h-full rounded-none border-0"
              icon={Fish}
              title="No mapped catches in these two periods"
              description="Try another species or the longer comparison window."
            />
          ) : (
            <BiodiversityMap cells={cells} heat={heat} focusKey={focusKey} showCells={showCells} windowDays={windows.days} onFocus={setFocusKey} />
          )}
        </div>

        <aside className="flex min-h-0 flex-col gap-4 overflow-y-auto" aria-label="Legend and watch list">
          <section className="rounded-lg border bg-card p-4">
            <h2 className="text-sm font-semibold">Legend</h2>
            <p className="mb-3 text-xs text-muted-foreground">
              Color shows the trend of each {Math.round(CELL_SIZE_DEG * 111)} km cell. Brightness shows how much was caught there recently.
            </p>
            <ul className="space-y-2.5">
              {TREND_ORDER.map((status) => {
                const meta = TREND_META[status];
                const Icon = meta.icon;
                return (
                  <li key={status} className="flex items-start gap-2.5">
                    <Icon className="mt-0.5 size-4 shrink-0" style={{ color: meta.color }} aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-baseline justify-between gap-2 text-sm">
                        {meta.label}
                        <span className="text-xs text-muted-foreground tabular">
                          {counts[status]} {counts[status] === 1 ? "cell" : "cells"}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">{meta.rule}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 flex gap-2 border-t pt-3 text-xs text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              Based on logged catch, not catch per trip. Fewer fishers logging also looks like a decline, so treat this as a signal to check on the
              ground. SAMPLE DATA.
            </p>
          </section>

          <section className="rounded-lg border bg-card">
            <header className="px-4 pb-2 pt-4">
              <h2 className="text-sm font-semibold">Species trend, all waters</h2>
              <p className="text-xs text-muted-foreground">Same rule across all of Marinduque, including SMS logs. Select a species to map it.</p>
            </header>
            {speciesTrends.length === 0 ? (
              <p className="px-4 pb-4 text-sm text-muted-foreground">No catches logged in these two periods.</p>
            ) : (
              <ul className="divide-y pb-1">
                {speciesTrends.map((t) => (
                  <li key={t.speciesId}>
                    <button
                      type="button"
                      onClick={() => push("species", t.speciesId === speciesId ? null : t.speciesId)}
                      aria-pressed={t.speciesId === speciesId}
                      className={cn(
                        "flex w-full items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none",
                        t.speciesId === speciesId && "bg-muted/60",
                      )}
                    >
                      <span className="min-w-0 flex-1 space-y-1">
                        <span className="block truncate text-sm">
                          {t.species} <span className="text-xs text-muted-foreground">{t.english}</span>
                        </span>
                        <TrendBadge status={t.status} />
                      </span>
                      <span className="text-right text-xs tabular">
                        <span className="block text-sm font-medium">{formatChange(t.change)}</span>
                        <span className="text-muted-foreground">{t.currentLogs + t.previousLogs} logs</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-lg border bg-card">
            <header className="px-4 pb-2 pt-4">
              <h2 className="text-sm font-semibold">Watch list</h2>
              <p className="text-xs text-muted-foreground">Critical and declining cells, steepest drop first</p>
            </header>
            {watchList.length === 0 ? (
              <p className="px-4 pb-4 text-sm text-muted-foreground">No declining or critical cells for this selection.</p>
            ) : (
              <ul className="divide-y pb-1">
                {watchList.map((cell) => (
                  <li key={cell.key}>
                    <button
                      type="button"
                      onClick={() => setFocusKey(cell.key)}
                      aria-pressed={focusKey === cell.key}
                      className={cn(
                        "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none",
                        focusKey === cell.key && "bg-muted/60",
                      )}
                    >
                      <span className="min-w-0 flex-1 space-y-1">
                        <span className="block text-sm">{cell.area}</span>
                        <TrendBadge status={cell.status} />
                      </span>
                      <span className="text-right text-xs tabular">
                        <span className="block text-sm font-medium">{formatChange(cell.change)}</span>
                        <span className="text-muted-foreground">
                          {cell.currentLogs + cell.previousLogs} logs
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}

function formatChange(change: number | null) {
  if (change === null) return "No baseline";
  if (Math.abs(change) < 0.5) return "0%";
  return `${change > 0 ? "+" : "-"}${formatPercent(Math.abs(change))}`;
}
