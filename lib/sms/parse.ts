// SMS catch message parser. Pure: shared by the webhook, the simulator and the mobile app.
//
// Accepted (case-insensitive, Tagalog or English keyword):
//   HULI TULINGAN 10KG
//   HULI ng lapu-lapu 3 kilo 32cm
//   CATCH frigate tuna 12.5 kg
//   HULI GALUNGGONG 8          (a bare number is read as kilograms)
//   TULONG / HELP              (reply with the format)

export type SmsLang = "tl" | "en";

export type ParsedSms =
  | { kind: "catch"; lang: SmsLang; species: string; weightKg: number; sizeCm: number | null }
  | { kind: "help"; lang: SmsLang }
  | { kind: "error"; lang: SmsLang; reason: "no_keyword" | "no_species" | "no_weight" };

const KEYWORDS: Record<string, SmsLang> = { huli: "tl", catch: "en", log: "en" };
const HELP: Record<string, SmsLang> = { tulong: "tl", help: "en", info: "en" };
const FILLER = new Set(["ng", "na", "nang", "of", "isda", "fish"]);

const num = (s: string) => Number(s.replace(",", "."));

export function parseSms(text: string): ParsedSms {
  const words = text.trim().replace(/\s+/g, " ").split(" ").filter(Boolean);
  const first = (words[0] ?? "").toLowerCase();

  if (HELP[first]) return { kind: "help", lang: HELP[first] };
  const lang = KEYWORDS[first];
  if (!lang) return { kind: "error", lang: "tl", reason: "no_keyword" };

  // Join the rest so "10 KG", "10KG" and "10kg." all read the same.
  const rest = words.slice(1).join(" ");
  const size = rest.match(/(\d+(?:[.,]\d+)?)\s*(?:cm|sentimetro|sm)\b/i);
  const withoutSize = size ? rest.replace(size[0], " ") : rest;
  const weight =
    withoutSize.match(/(\d+(?:[.,]\d+)?)\s*(?:kg|kgs|kilo|kilos|kilogramo|k)\b/i) ?? withoutSize.match(/(?:^|\s)(\d+(?:[.,]\d+)?)(?=\s|$)/);

  const speciesText = (weight ? withoutSize.replace(weight[0], " ") : withoutSize)
    .split(" ")
    .filter((w) => w && !FILLER.has(w.toLowerCase()) && !/\d/.test(w))
    .join(" ")
    .trim();

  if (!speciesText) return { kind: "error", lang, reason: "no_species" };
  if (!weight) return { kind: "error", lang, reason: "no_weight" };

  const weightKg = num(weight[1]);
  if (!(weightKg > 0)) return { kind: "error", lang, reason: "no_weight" };
  return { kind: "catch", lang, species: speciesText, weightKg, sizeCm: size ? num(size[1]) : null };
}
