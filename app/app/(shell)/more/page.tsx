"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight, CloudSun, Images, LogOut, Monitor, Moon, Siren, Sun, UserRoundPen, type LucideIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useI18n } from "@/components/mobile/i18n-provider";
import { useMe, useSession } from "@/components/mobile/session-provider";
import { useSync } from "@/components/mobile/sync-provider";
import type { MessageKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const LINKS: { href: string; key: MessageKey; icon: LucideIcon; picOnly?: boolean }[] = [
  { href: "/app/report", key: "more.report", icon: Siren },
  { href: "/app/weather", key: "more.weather", icon: CloudSun },
  { href: "/app/gallery", key: "more.gallery", icon: Images },
  { href: "/app/pic", key: "more.pic", icon: UserRoundPen, picOnly: true },
];

export default function MorePage() {
  const { me } = useMe();
  const { signOut } = useSession();
  const { unsynced } = useSync();
  const { t, lang, setLang } = useI18n();
  const { theme, setTheme } = useTheme();
  const [confirmLogout, setConfirmLogout] = useState(false);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t("more.title")}</h1>

      <ul className="divide-y overflow-hidden rounded-xl border bg-card">
        {LINKS.filter((l) => !l.picOnly || me.role === "pic").map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="flex min-h-16 items-center gap-4 px-4 text-base font-medium hover:bg-muted focus-visible:bg-muted focus-visible:outline-none">
              <l.icon className="size-6 text-teal" aria-hidden />
              <span className="flex-1">{t(l.key)}</span>
              <ChevronRight className="size-5 text-muted-foreground" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>

      <section className="space-y-3" aria-labelledby="settings-heading">
        <h2 id="settings-heading" className="text-lg font-semibold">
          {t("more.settings")}
        </h2>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-muted-foreground">{t("lang.label")}</legend>
          <div className="grid grid-cols-2 gap-2">
            {(["tl", "en"] as const).map((l) => (
              <Choice key={l} selected={lang === l} onClick={() => setLang(l)}>
                {l === "tl" ? "Filipino" : "English"}
              </Choice>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-muted-foreground">{t("more.theme")}</legend>
          <div className="grid grid-cols-3 gap-2">
            <Choice selected={theme === "light"} onClick={() => setTheme("light")}>
              <Sun className="size-5" aria-hidden /> {t("more.themeLight")}
            </Choice>
            <Choice selected={theme === "dark"} onClick={() => setTheme("dark")}>
              <Moon className="size-5" aria-hidden /> {t("more.themeDark")}
            </Choice>
            <Choice selected={theme === "system"} onClick={() => setTheme("system")}>
              <Monitor className="size-5" aria-hidden /> {t("more.themeSystem")}
            </Choice>
          </div>
        </fieldset>
      </section>

      <section className="space-y-3" aria-labelledby="account-heading">
        <h2 id="account-heading" className="text-lg font-semibold">
          {t("more.account")}
        </h2>
        <p className="text-base">
          {me.fullName}
          <span className="block text-sm text-muted-foreground">{[me.phone, me.municipality].filter(Boolean).join(" · ")}</span>
        </p>
        {confirmLogout && unsynced > 0 && (
          <p role="alert" className="rounded-lg border border-coral/30 bg-coral-soft px-4 py-3 text-base text-coral">
            {t("more.logoutWarn", { n: unsynced })}
          </p>
        )}
        <button
          type="button"
          onClick={() => (unsynced > 0 && !confirmLogout ? setConfirmLogout(true) : signOut())}
          className="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl border text-base font-semibold hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <LogOut className="size-5" aria-hidden />
          {confirmLogout && unsynced > 0 ? t("more.logoutConfirm") : t("more.logout")}
        </button>
      </section>
    </div>
  );
}

function Choice({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "flex min-h-14 items-center justify-center gap-2 rounded-xl border px-2 text-base font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected ? "border-teal bg-teal-soft text-teal" : "bg-card hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}
