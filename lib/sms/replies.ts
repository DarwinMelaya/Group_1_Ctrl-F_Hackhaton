// Reply texts for SMS logging, in the language the fisher used. Kept short for one SMS where possible.
import { flagLabel } from "@/lib/catch/flags";
import type { CatchStatus } from "@/lib/types";
import type { SmsLang } from "./parse";

const FORMAT = { tl: "HULI <isda> <kilo>KG [haba]CM, hal. HULI TULINGAN 10KG", en: "CATCH <fish> <weight>KG [length]CM, e.g. CATCH TULINGAN 10KG" };

export function helpReply(lang: SmsLang) {
  return lang === "tl"
    ? `Huli Ko: Para magtala ng huli, i-text: ${FORMAT.tl}`
    : `Huli Ko: To log a catch, text: ${FORMAT.en}`;
}

export function errorReply(lang: SmsLang, reason: string, extra?: string) {
  const tl: Record<string, string> = {
    no_keyword: `Huli Ko: Hindi maintindihan ang mensahe. I-text: ${FORMAT.tl}`,
    no_species: `Huli Ko: Kulang ang pangalan ng isda. I-text: ${FORMAT.tl}`,
    no_weight: `Huli Ko: Kulang ang timbang. I-text: ${FORMAT.tl}`,
    unknown_species: `Huli Ko: Hindi kilala ang isdang "${extra ?? ""}". Gamitin ang lokal na pangalan, hal. TULINGAN, GALUNGGONG.`,
    unknown_phone: "Huli Ko: Hindi rehistrado ang numerong ito. Magparehistro sa Municipal Agriculture Office (MAO).",
    invalid_weight: "Huli Ko: Mali ang timbang. Ilagay sa kilo, hal. 10KG.",
    invalid_size: "Huli Ko: Mali ang haba. Ilagay sa sentimetro, hal. 32CM.",
    unavailable: "Huli Ko: Hindi maitala ngayon. Subukan muli mamaya.",
  };
  const en: Record<string, string> = {
    no_keyword: `Huli Ko: Message not understood. Text: ${FORMAT.en}`,
    no_species: `Huli Ko: Fish name missing. Text: ${FORMAT.en}`,
    no_weight: `Huli Ko: Weight missing. Text: ${FORMAT.en}`,
    unknown_species: `Huli Ko: Unknown fish "${extra ?? ""}". Use the local name, e.g. TULINGAN, GALUNGGONG.`,
    unknown_phone: "Huli Ko: This number is not registered. Please register at the Municipal Agriculture Office (MAO).",
    invalid_weight: "Huli Ko: Invalid weight. Use kilograms, e.g. 10KG.",
    invalid_size: "Huli Ko: Invalid length. Use centimetres, e.g. 32CM.",
    unavailable: "Huli Ko: Could not log right now. Please try again later.",
  };
  return (lang === "tl" ? tl : en)[reason] ?? (lang === "tl" ? tl.no_keyword : en.no_keyword);
}

export function successReply(
  lang: SmsLang,
  r: { firstName: string; species: string; weightKg: number; sizeCm: number | null; status: CatchStatus; flagReasons: string[]; qrToken: string },
) {
  const what = `${r.species} ${r.weightKg}kg${r.sizeCm ? ` ${r.sizeCm}cm` : ""}`;
  const reasons = r.flagReasons.map(flagLabel).join("; ");
  if (lang === "tl") {
    const status =
      r.status === "flagged" ? `Para sa pagsusuri ng MAO: ${reasons}.` : r.status === "pending" ? "Hinihintay ang lokasyon (walang GPS sa SMS)." : "Napatunayan.";
    return `Salamat, ${r.firstName}! Naitala: ${what}. ${status} Code: ${r.qrToken}`;
  }
  const status =
    r.status === "flagged" ? `For review by the MAO: ${reasons}.` : r.status === "pending" ? "Pending location (SMS has no GPS)." : "Verified.";
  return `Thanks, ${r.firstName}! Logged: ${what}. ${status} Code: ${r.qrToken}`;
}
