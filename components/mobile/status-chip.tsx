"use client";

import Link from "next/link";
import { CloudUpload, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "./i18n-provider";
import { useSync } from "./sync-provider";
import { useOnline } from "./use-online";

/** Always-visible connection and sync state: color + icon + word. Tapping opens "Mga Huli" (the sync list). */
export function StatusChip() {
  const online = useOnline();
  const { unsynced, syncing } = useSync();
  const { t } = useI18n();

  const state = !online ? "offline" : syncing ? "syncing" : unsynced > 0 ? "waiting" : "online";
  const Icon = { offline: WifiOff, syncing: RefreshCw, waiting: CloudUpload, online: Wifi }[state];
  const label = { offline: t("status.offline"), syncing: t("status.syncing"), waiting: t("status.online"), online: t("status.online") }[state];
  const detail = unsynced > 0 ? t("status.waiting", { n: unsynced }) : t("status.allSynced");

  return (
    <Link
      href="/app/catches"
      prefetch={online ? undefined : false}
      aria-label={`${label}. ${detail}`}
      className="flex min-h-14 items-center rounded-full px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold",
          state === "offline" && "border-sand-foreground/30 bg-sand text-sand-foreground",
          state === "syncing" && "border-teal/30 bg-teal-soft text-teal",
          state === "waiting" && "border-warning/30 bg-warning-soft text-warning",
          state === "online" && "border-teal/30 bg-teal-soft text-teal",
        )}
      >
        <Icon className={cn("size-4", state === "syncing" && "animate-spin motion-reduce:animate-none")} aria-hidden />
        {label}
        {unsynced > 0 && <span className="tabular">· {unsynced}</span>}
      </span>
    </Link>
  );
}
