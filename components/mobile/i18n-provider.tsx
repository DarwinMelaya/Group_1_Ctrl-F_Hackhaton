"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { DEFAULT_LANG, LANG_STORAGE_KEY, translate, type Lang, type MessageKey } from "@/lib/i18n";

type I18n = { lang: Lang; setLang: (lang: Lang) => void; t: (key: MessageKey, vars?: Record<string, string | number>) => string };

const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LANG_STORAGE_KEY);
      if (saved === "tl" || saved === "en") setLangState(saved);
    } catch {
      // Storage blocked: stay on Tagalog.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang === "tl" ? "fil" : "en";
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {
      // Not remembered, still switched for this visit.
    }
  }, []);

  const t = useCallback((key: MessageKey, vars?: Record<string, string | number>) => translate(lang, key, vars), [lang]);

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
