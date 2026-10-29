"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { zoneInputSchema } from "@/lib/validation/zone";

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

// All writes run as the signed-in user, so RLS (admin only) is the final check.

export async function saveZone(input: unknown): Promise<ActionResult> {
  const parsed = zoneInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the zone details." };

  const { id, name, type, reason, active, geometry } = parsed.data;
  const { data, error } = await createClient().rpc("upsert_zone", {
    // Generated types mark every RPC argument as required; null means "create".
    p_id: id as string,
    p_name: name,
    p_type: type,
    p_reason: reason,
    p_active: active,
    p_geojson: geometry,
  });
  if (error) return { ok: false, error: friendlyError(error.message) };

  revalidatePath("/admin/zones");
  return { ok: true, id: data };
}

export async function setZoneActive(id: string, active: boolean): Promise<ActionResult> {
  const { error, count } = await createClient().from("zones").update({ active }, { count: "exact" }).eq("id", id);
  if (error || count === 0) return { ok: false, error: "Could not update the zone. You may not have admin access." };

  revalidatePath("/admin/zones");
  return { ok: true, id };
}

export async function deleteZone(id: string): Promise<ActionResult> {
  const { error, count } = await createClient().from("zones").delete({ count: "exact" }).eq("id", id);
  if (error || count === 0) return { ok: false, error: "Could not delete the zone. You may not have admin access." };

  revalidatePath("/admin/zones");
  return { ok: true };
}

function friendlyError(message: string) {
  if (message.includes("crosses itself")) return "The outline crosses itself. Redraw it without overlapping edges.";
  if (message.includes("single polygon")) return "A zone must be a single closed shape.";
  if (message.includes("row-level security") || message.includes("not editable")) return "You do not have permission to change zones.";
  return "Could not save the zone. Try again.";
}
