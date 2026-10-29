"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { reportUpdateSchema } from "@/lib/validation/report";

export type ReportResult = { ok: true } | { ok: false; error: string };

/** Moves a report through Received, Investigating, Resolved and saves the admin note. RLS: admins only. */
export async function updateReport(input: unknown): Promise<ReportResult> {
  const parsed = reportUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the report details." };

  const { id, status, note } = parsed.data;
  const { error, count } = await createClient()
    .from("reports")
    .update({ status, admin_note: note || null }, { count: "exact" })
    .eq("id", id);
  if (error || count === 0) return { ok: false, error: "Could not update the report. You may not have admin access." };

  revalidatePath("/admin/reports");
  revalidatePath("/admin/hotspots");
  revalidatePath("/admin");
  return { ok: true };
}
