import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { getDb, type Me } from "@/lib/offline/db";

/** Reads the signed-in user's own profile and boats (RLS: own rows only) and keeps a copy on the phone. */
export async function fetchAndCacheMe(supabase: SupabaseClient<Database>, userId: string): Promise<Me | null> {
  const [{ data: profile, error }, { data: boats }] = await Promise.all([
    supabase.from("profiles").select("id, role, full_name, municipality, barangay, phone, fishr_no, license_expiry").eq("id", userId).maybeSingle(),
    supabase.from("boats").select("name, boatr_no, gross_tons").eq("owner_id", userId).order("boatr_no"),
  ]);
  if (error) throw error;
  if (!profile) return null;

  const me: Me = {
    id: profile.id,
    role: profile.role,
    fullName: profile.full_name,
    municipality: profile.municipality,
    barangay: profile.barangay,
    phone: profile.phone,
    fishrNo: profile.fishr_no,
    licenseExpiry: profile.license_expiry,
    boats: (boats ?? []).map((b) => ({ name: b.name, boatrNo: b.boatr_no, grossTons: b.gross_tons === null ? null : Number(b.gross_tons) })),
    cachedAt: Date.now(),
  };
  if (me.role !== "admin") {
    const db = getDb();
    await db.transaction("rw", db.me, async () => {
      await db.me.clear();
      await db.me.put(me);
    });
  }
  return me;
}

export function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] || fullName;
}
