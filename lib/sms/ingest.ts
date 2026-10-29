import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/env";
import type { CatchStatus } from "@/lib/types";
import { parseSms } from "./parse";
import { errorReply, helpReply, successReply } from "./replies";

export type SmsOutcome = {
  reply: string;
  result: "logged" | "help" | "parse_error" | "unknown_phone" | "unknown_species" | "invalid_weight" | "invalid_size" | "unavailable";
  qrToken?: string;
  status?: CatchStatus;
};

export const MAX_SMS_LENGTH = 320;

/**
 * Parses an inbound SMS and logs it through ingest_sms_catch(). Uses only the publishable key: the database
 * function checks SMS_WEBHOOK_SECRET itself and can do nothing except log an SMS catch.
 */
export async function ingestSms(from: string, message: string): Promise<SmsOutcome> {
  const parsed = parseSms(message.slice(0, MAX_SMS_LENGTH));
  if (parsed.kind === "help") return { reply: helpReply(parsed.lang), result: "help" };
  if (parsed.kind === "error") return { reply: errorReply(parsed.lang, parsed.reason), result: "parse_error" };

  const secret = process.env.SMS_WEBHOOK_SECRET;
  if (!secret) return { reply: errorReply(parsed.lang, "unavailable"), result: "unavailable" };

  const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data, error } = await supabase.rpc("ingest_sms_catch", {
    p_secret: secret,
    p_phone: from,
    p_species: parsed.species,
    p_weight_kg: parsed.weightKg,
    ...(parsed.sizeCm !== null ? { p_size_cm: parsed.sizeCm } : {}),
  });
  const row = data?.[0];
  if (error || !row || row.result === "bad_secret") return { reply: errorReply(parsed.lang, "unavailable"), result: "unavailable" };

  if (row.result !== "ok") {
    return { reply: errorReply(parsed.lang, row.result, parsed.species), result: row.result as SmsOutcome["result"] };
  }
  return {
    result: "logged",
    qrToken: row.qr_token,
    status: row.status,
    reply: successReply(parsed.lang, {
      firstName: row.fisher_first_name,
      species: row.species_local_name,
      weightKg: Number(row.weight_kg),
      sizeCm: row.size_cm === null ? null : Number(row.size_cm),
      status: row.status,
      flagReasons: row.flag_reasons ?? [],
      qrToken: row.qr_token,
    }),
  };
}
