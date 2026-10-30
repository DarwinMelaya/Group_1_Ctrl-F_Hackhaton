"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { untyped } from "@/lib/sites/types";
import { createClient } from "@/lib/supabase/server";

export type SiteResult = { ok: true } | { ok: false; error: string };

const optionalInt = (min: number, max: number) =>
  z.union([z.literal(""), z.coerce.number().int().min(min).max(max)]).transform((v) => (v === "" ? null : v));
const optionalTime = z
  .union([z.literal(""), z.string().regex(/^\d{2}:\d{2}$/)])
  .transform((v) => (v === "" ? null : v));

const schema = z
  .object({
    placeId: z.string().min(1).max(40),
    capacity: optionalInt(1, 5000),
    maxStayMinutes: optionalInt(15, 1440),
    openFrom: optionalTime,
    openTo: optionalTime,
    feePhp: z.union([z.literal(""), z.coerce.number().min(0).max(100000)]).transform((v) => (v === "" ? null : v)),
    notes: z.string().trim().max(300).transform((v) => v || null),
    source: z.string().trim().max(200).transform((v) => v || null),
  })
  .refine((v) => (v.openFrom === null) === (v.openTo === null), { message: "Set both opening and closing time, or neither." })
  .refine((v) => (v.capacity === null && v.maxStayMinutes === null) || v.source !== null, {
    message: "Add the source of the limit (ordinance, barangay or tourism office).",
  });

/** Save one site's visitor rules. RLS: admins only. */
export async function saveSiteRule(input: unknown): Promise<SiteResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the values." };
  const v = parsed.data;

  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  const { error, count } = await untyped(supabase)
    .from("site_rules")
    .update(
      {
        capacity: v.capacity,
        max_stay_minutes: v.maxStayMinutes,
        open_from: v.openFrom,
        open_to: v.openTo,
        fee_php: v.feePhp,
        notes: v.notes,
        source: v.source,
        updated_by: auth.user?.id ?? null,
        updated_at: new Date().toISOString(),
      },
      { count: "exact" },
    )
    .eq("place_id", v.placeId);
  if (error || count === 0) return { ok: false, error: "Could not save. You may not have admin access." };

  revalidatePath("/admin/sites");
  return { ok: true };
}
