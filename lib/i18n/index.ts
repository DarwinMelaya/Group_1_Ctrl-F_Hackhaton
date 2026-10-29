// Simple JSON dictionaries. Tagalog is the default; English is a toggle. Shared with the mobile app only.
import en from "./en.json";
import tl from "./tl.json";

export type Lang = "tl" | "en";
export type MessageKey = keyof typeof tl;

const DICTS: Record<Lang, Record<MessageKey, string>> = { tl, en };

export const DEFAULT_LANG: Lang = "tl";
export const LANG_STORAGE_KEY = "huliko.lang";

/** Looks up a message and fills {placeholders}. Falls back to Tagalog, then the key. */
export function translate(lang: Lang, key: MessageKey, vars?: Record<string, string | number>) {
  const text = DICTS[lang][key] ?? DICTS.tl[key] ?? key;
  return vars ? text.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? "")) : text;
}
