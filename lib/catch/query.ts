import { z } from "zod";
import { Constants } from "@/lib/database.types";
import { MUNICIPALITIES } from "@/lib/analytics/overview";
import type { CatchStatus } from "@/lib/types";

// URL search params for the Catches table. Shared names with links from Overview and the top-bar search.
export const PAGE_SIZE = 25;
export const NO_ZONE = "none";

export const SORTABLE = ["caught_at", "weight_kg", "species_local_name", "fisher_name"] as const;
export type SortKey = (typeof SORTABLE)[number];

export type CatchFilters = {
  q: string;
  status: CatchStatus | null;
  species: string | null;
  zone: string | null;
  municipality: string | null;
  page: number;
  sort: SortKey;
  desc: boolean;
};

// z.guid(): any 8-4-4-4-12 hex id. Seeded sample ids are md5-derived and not RFC version-tagged, so .uuid() would reject them.
const uuid = z.guid();

export function parseCatchFilters(params: Record<string, string | string[] | undefined>): CatchFilters {
  const get = (k: string) => (Array.isArray(params[k]) ? params[k]?.[0] : params[k]) as string | undefined;
  const status = get("status");
  const zone = get("zone");
  const m = get("m");
  const [sortKey, dir] = (get("sort") ?? "caught_at.desc").split(".");
  return {
    q: (get("q") ?? "").trim().slice(0, 80),
    status: (Constants.public.Enums.catch_status as readonly string[]).includes(status ?? "") ? (status as CatchStatus) : null,
    species: uuid.safeParse(get("species")).success ? get("species")! : null,
    zone: zone === NO_ZONE || uuid.safeParse(zone).success ? zone! : null,
    municipality: m && (MUNICIPALITIES as readonly string[]).includes(m) ? m : null,
    page: Math.max(1, Math.floor(Number(get("page")) || 1)),
    sort: (SORTABLE as readonly string[]).includes(sortKey) ? (sortKey as SortKey) : "caught_at",
    desc: dir !== "asc",
  };
}

/** Removes characters that would break a PostgREST or() filter. */
export function sanitizeSearch(q: string) {
  return q.replace(/[,()*%\\:"']/g, " ").replace(/\s+/g, " ").trim();
}
