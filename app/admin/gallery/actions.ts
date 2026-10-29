"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type GalleryResult = { ok: true } | { ok: false; error: string };

const moderateSchema = z.object({
  id: z.guid(),
  approved: z.boolean().optional(),
  reefCondition: z.enum(["good", "fair", "poor"]).optional(),
});

/** Approve (make public), hide, or correct the reef condition of a gallery upload. RLS: admins only. */
export async function moderateGalleryItem(input: unknown): Promise<GalleryResult> {
  const parsed = moderateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the gallery item." };

  const { id, approved, reefCondition } = parsed.data;
  const patch = {
    ...(approved !== undefined ? { approved } : {}),
    ...(reefCondition ? { reef_condition: reefCondition } : {}),
  };
  if (Object.keys(patch).length === 0) return { ok: false, error: "Nothing to change." };

  const { error, count } = await createClient().from("spots_gallery").update(patch, { count: "exact" }).eq("id", id);
  if (error || count === 0) return { ok: false, error: "Could not update the photo. You may not have admin access." };

  revalidatePath("/admin/gallery");
  return { ok: true };
}
