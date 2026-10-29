"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { CalendarRange, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MAX_RANGE_DAYS, MUNICIPALITIES, RANGE_PRESETS, daysBetween, type OverviewFilters as Filters } from "@/lib/analytics/overview";
import { cn } from "@/lib/utils";

export function OverviewFilters({ filters, today }: { filters: Filters; today: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [customOpen, setCustomOpen] = useState(filters.preset === "custom");
  const [from, setFrom] = useState(filters.from);
  const [to, setTo] = useState(filters.to);

  function push(update: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(update)) {
      if (value === null) params.delete(key);
      else params.set(key, value);
    }
    startTransition(() => router.push(`${pathname}?${params.toString()}`, { scroll: false }));
  }

  const customError =
    from > to ? "Start date must be on or before the end date." : daysBetween(from, to) > MAX_RANGE_DAYS ? "Choose a range of one year or less." : "";

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2" role="toolbar" aria-label="Overview filters">
      <div role="group" aria-label="Date range" className="flex rounded-md border bg-card p-0.5">
        {RANGE_PRESETS.map((preset) => (
          <button
            key={preset.value}
            type="button"
            aria-pressed={filters.preset === preset.value}
            onClick={() => {
              setCustomOpen(false);
              push({ range: preset.value, from: null, to: null });
            }}
            className={cn(
              "rounded px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              filters.preset === preset.value ? "bg-primary font-medium text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {preset.label}
          </button>
        ))}
        <button
          type="button"
          aria-pressed={filters.preset === "custom"}
          aria-expanded={customOpen}
          onClick={() => setCustomOpen((v) => !v)}
          className={cn(
            "flex items-center gap-1.5 rounded px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            filters.preset === "custom" ? "bg-primary font-medium text-primary-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <CalendarRange className="size-3.5" aria-hidden /> Custom
        </button>
      </div>

      {customOpen && (
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!customError) push({ from, to, range: null });
          }}
        >
          <label className="sr-only" htmlFor="range-from">
            From
          </label>
          <Input id="range-from" type="date" value={from} max={today} onChange={(e) => setFrom(e.target.value)} className="h-9 w-auto" />
          <span className="text-sm text-muted-foreground">to</span>
          <label className="sr-only" htmlFor="range-to">
            To
          </label>
          <Input id="range-to" type="date" value={to} max={today} onChange={(e) => setTo(e.target.value)} className="h-9 w-auto" />
          <Button type="submit" size="sm" variant="outline" disabled={!!customError || !from || !to}>
            Apply
          </Button>
          {customError && <p className="w-full text-xs text-coral">{customError}</p>}
        </form>
      )}

      <Select value={filters.municipality ?? "all"} onValueChange={(v) => push({ m: v === "all" ? null : v })}>
        <SelectTrigger className="h-9 w-48 bg-card" aria-label="Municipality">
          <MapPin className="mr-2 size-3.5 text-muted-foreground" aria-hidden />
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

      {pending && (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground" role="status">
          <Loader2 className="size-3.5 animate-spin" aria-hidden /> Updating
        </span>
      )}
    </div>
  );
}
