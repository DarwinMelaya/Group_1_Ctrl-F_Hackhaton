"use client";

import Link from "next/link";
import { WifiOff } from "lucide-react";
import { useI18n } from "@/components/mobile/i18n-provider";

/** Service-worker fallback for pages that were never saved on the phone. */
export default function OfflinePage() {
  const { t } = useI18n();
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-sand text-sand-foreground">
        <WifiOff className="size-7" aria-hidden />
      </span>
      <h1 className="text-2xl font-semibold">{t("offline.title")}</h1>
      <p className="text-base text-muted-foreground">{t("offline.body")}</p>
      <Link
        href="/app"
        className="mt-4 flex h-14 w-full items-center justify-center rounded-xl bg-primary text-lg font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/40"
      >
        {t("offline.home")}
      </Link>
    </main>
  );
}
