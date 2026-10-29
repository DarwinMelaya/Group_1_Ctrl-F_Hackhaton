import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";
import { SUPABASE_ANON_KEY, SUPABASE_URL, assertSupabaseEnv } from "./env";

/** Supabase client for Client Components. Uses the signed-in user's session from cookies. */
export function createClient() {
  assertSupabaseEnv();
  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
}
