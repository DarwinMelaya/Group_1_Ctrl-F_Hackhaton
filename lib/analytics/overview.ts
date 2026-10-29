import { z } from "zod";
import type { CatchStatus } from "@/lib/types";

// ---------------------------------------------------------------------------
// Shape of public.overview_stats() (supabase/migrations/005_analytics.sql)
// ---------------------------------------------------------------------------
export type OverviewStats = {
  range: { from: string; to: string; prev_from: string; prev_to: string; days: number };
  kpis: {
    total_kg: number;
    total_kg_prev: number;
    logs: number;
    logs_prev: number;
    active_fishers: number;
    active_fishers_prev: number;
    registered_fishers: number;
    flagged: number;
    flagged_prev: number;
    open_reports: number;
    new_reports: number;
  };
  by_species: { species: string; english: string; kg: number; logs: number }[];
  by_day: { day: string; kg: number; logs: number }[];
  by_status: Partial<Record<CatchStatus, number>>;
  by_municipality: { municipality: string; kg: number; logs: number }[];
};

// ---------------------------------------------------------------------------
// Filters (URL search params)
// ---------------------------------------------------------------------------
export const RANGE_PRESETS = [
  { value: "7d", label: "7 days", days: 7 },
  { value: "30d", label: "30 days", days: 30 },
  { value: "60d", label: "60 days", days: 60 },
  { value: "90d", label: "90 days", days: 90 },
] as const;

export type RangePreset = (typeof RANGE_PRESETS)[number]["value"];
export const DEFAULT_RANGE: RangePreset = "30d";
export const MAX_RANGE_DAYS = 366;

export type OverviewFilters = {
  from: string;
  to: string;
  /** Preset in use, or "custom" when from/to were picked. */
  preset: RangePreset | "custom";
  municipality: string | null;
};

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** Today's date in the Philippines as YYYY-MM-DD. */
export function todayInManila(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(now);
}

export function addDays(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string) {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000) + 1;
}

/** Reads ?range=30d or ?from=…&to=…, plus ?m=<municipality>. Invalid values fall back to defaults. */
export function parseOverviewFilters(params: Record<string, string | string[] | undefined>, today = todayInManila()): OverviewFilters {
  const get = (key: string) => (Array.isArray(params[key]) ? params[key]?.[0] : params[key]) as string | undefined;

  const municipalityParam = get("m");
  const municipality = validMunicipality(municipalityParam);

  const from = isoDate.safeParse(get("from"));
  const to = isoDate.safeParse(get("to"));
  if (from.success && to.success) {
    const end = to.data > today ? today : to.data;
    const span = daysBetween(from.data, end);
    if (span >= 1 && span <= MAX_RANGE_DAYS) return { from: from.data, to: end, preset: "custom", municipality };
  }

  const preset = RANGE_PRESETS.find((p) => p.value === get("range")) ?? RANGE_PRESETS.find((p) => p.value === DEFAULT_RANGE)!;
  return { from: addDays(today, -(preset.days - 1)), to: today, preset: preset.value, municipality };
}

export const MUNICIPALITIES = ["Boac", "Mogpog", "Gasan", "Buenavista", "Torrijos", "Santa Cruz"] as const;

function validMunicipality(value: string | undefined) {
  return value && (MUNICIPALITIES as readonly string[]).includes(value) ? value : null;
}

/** Percent change vs the previous period; null when there is no previous value to compare with. */
export function percentChange(current: number, previous: number) {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}
