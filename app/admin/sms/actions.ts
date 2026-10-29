"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentProfile } from "@/lib/auth";
import { MAX_SMS_LENGTH, ingestSms, type SmsOutcome } from "@/lib/sms/ingest";

const schema = z.object({
  from: z.string().trim().min(7, "Enter a mobile number.").max(20),
  message: z.string().trim().min(1, "Type a message.").max(MAX_SMS_LENGTH),
});

/** Demo only: runs a message through the same path as the real webhook. Admins only, because it logs real catches. */
export async function simulateSms(input: unknown): Promise<{ ok: true; outcome: SmsOutcome } | { ok: false; error: string }> {
  const profile = await getCurrentProfile();
  if (profile?.role !== "admin") return { ok: false, error: "Only admins can use the simulator." };

  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the message." };

  const outcome = await ingestSms(parsed.data.from, parsed.data.message);
  if (outcome.result === "logged") {
    revalidatePath("/admin/catches");
    revalidatePath("/admin");
  }
  return { ok: true, outcome };
}
