"use client";

import { Languages } from "lucide-react";
import { useI18n } from "./i18n-provider";

/** One tap switches Tagalog and English. Shows the language you will switch to. */
export function LangToggle() {
  const { lang, setLang, t } = useI18n();
  return (
    <button
      type="button"
      onClick={() => setLang(lang === "tl" ? "en" : "tl")}
      aria-label={`${t("lang.label")}: ${t("lang.switch")}`}
      className="flex min-h-14 min-w-14 items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Languages className="size-5" aria-hidden />
      {lang === "tl" ? "EN" : "TL"}
    </button>
  );
}
