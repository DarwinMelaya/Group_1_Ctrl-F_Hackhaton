"use client";

import { Construction } from "lucide-react";
import type { MessageKey } from "@/lib/i18n";
import { useI18n } from "./i18n-provider";

/** Temporary body for screens built in later steps. */
export function ScreenPlaceholder({ titleKey, step }: { titleKey: MessageKey; step: number }) {
  const { t } = useI18n();
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">{t(titleKey)}</h1>
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Construction className="size-6" aria-hidden />
        </span>
        <p className="text-lg font-semibold">{t("placeholder.title")}</p>
        <p className="max-w-xs text-base text-muted-foreground">
          {t("placeholder.body")} ({step})
        </p>
      </div>
    </section>
  );
}
