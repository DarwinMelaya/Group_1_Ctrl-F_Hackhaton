"use client";

import type { ReactNode } from "react";
import { Fish, Loader2, WifiOff } from "lucide-react";
import { AppNav } from "./app-nav";
import { useI18n } from "./i18n-provider";
import { LangToggle } from "./lang-toggle";
import { SessionProvider, useSession } from "./session-provider";
import { StatusChip } from "./status-chip";
import { SyncProvider } from "./sync-provider";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <SyncProvider>
        <ShellFrame>{children}</ShellFrame>
      </SyncProvider>
    </SessionProvider>
  );
}

function ShellFrame({ children }: { children: ReactNode }) {
  const session = useSession();
  const { t } = useI18n();

  if (session.status !== "ready") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 text-muted-foreground" role="status" aria-live="polite">
        <Brand />
        <span className="flex items-center gap-2 text-base">
          <Loader2 className="size-5 animate-spin motion-reduce:animate-none" aria-hidden />
          {t("shell.loading")}
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-dvh md:pl-24">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur-sm supports-[backdrop-filter]:bg-background/85">
        <Brand />
        <div className="ml-auto flex items-center gap-1">
          <StatusChip />
          <LangToggle />
        </div>
      </header>

      {!session.signedIn && (
        <p className="flex items-start gap-2 border-b bg-sand px-4 py-2 text-sm text-sand-foreground">
          <WifiOff className="mt-0.5 size-4 shrink-0" aria-hidden />
          {t("shell.offlineCached")}
        </p>
      )}

      <main id="main" className="mx-auto w-full max-w-3xl px-4 pb-28 pt-4 md:pb-10">
        {children}
      </main>

      <AppNav role={session.me.role} />
    </div>
  );
}

function Brand() {
  return (
    <span className="flex items-center gap-2">
      <span className="flex size-9 items-center justify-center rounded-lg bg-navy text-[#5EEAD4]">
        <Fish className="size-5" aria-hidden />
      </span>
      <span className="text-lg font-semibold tracking-tight">Huli Ko</span>
    </span>
  );
}
