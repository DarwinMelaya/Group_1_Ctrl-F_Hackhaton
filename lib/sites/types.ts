import type { SupabaseClient } from "@supabase/supabase-js";

// Visitor rules for coastal sites (migration 010). These tables are newer than lib/database.types.ts;
// after running 010, regenerate the types (README, "Generate types") and drop this file's casts.
export type SiteStatus = {
  place_id: string;
  capacity: number | null;
  max_stay_minutes: number | null;
  open_from: string | null;
  open_to: string | null;
  fee_php: number | null;
  notes: string | null;
  source: string | null;
  visitors_now: number;
};

export type SiteRule = Omit<SiteStatus, "visitors_now"> & { name: string; municipality: string; updated_at: string };

// Untyped view of the client for the two tables above, until the generated types include them.
export const untyped = (client: unknown) => client as SupabaseClient;
