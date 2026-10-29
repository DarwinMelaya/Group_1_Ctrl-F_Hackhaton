"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { reviewSchema } from "@/lib/validation/review";

export type ReviewResult = { ok: true } | { ok: false; error: string };

/** Marks a catch Reviewed or Verified with a note. The trigger records who reviewed it and when. RLS: admins only. */
export async function reviewCatch(input: unknown): Promise<ReviewResult> {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the review details." };

  const { id, status, note } = parsed.data;
  const { error, count } = await createClient()
    .from("catches")
    .update({ status, admin_note: note }, { count: "exact" })
    .eq("id", id);
  if (error || count === 0) return { ok: false, error: "Could not save the review. You may not have admin access." };

  revalidatePath("/admin/catches");
  revalidatePath("/admin");
  return { ok: true };
}
