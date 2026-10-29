"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, LayoutGrid, ListChecks, Map, SquarePen, type LucideIcon } from "lucide-react";
import type { MessageKey } from "@/lib/i18n";
import type { UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useI18n } from "./i18n-provider";
import { useOnline } from "./use-online";

type Tab = { href: string; key: MessageKey; icon: LucideIcon };

function tabsFor(role: UserRole): Tab[] {
  return [
    { href: "/app", key: "nav.home", icon: House },
    // A PIC logs on behalf of fishers, so their main action opens PIC mode.
    { href: role === "pic" ? "/app/pic" : "/app/log", key: "nav.log", icon: SquarePen },
    { href: "/app/map", key: "nav.map", icon: Map },
    { href: "/app/catches", key: "nav.catches", icon: ListChecks },
    { href: "/app/more", key: "nav.more", icon: LayoutGrid },
  ];
}

const isActive = (pathname: string, href: string) => (href === "/app" ? pathname === "/app" : pathname === href || pathname.startsWith(`${href}/`));

/** Bottom tab bar on phones; the same items as a side rail from md up. 56px+ targets. */
export function AppNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const { t } = useI18n();
  const online = useOnline();
  const tabs = tabsFor(role);

  return (
    <nav
      aria-label={t("nav.main")}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t bg-card pb-[env(safe-area-inset-bottom)]",
        "md:inset-y-0 md:left-0 md:right-auto md:w-24 md:border-r md:border-t-0 md:pb-0 md:pt-20",
      )}
    >
      <ul className="flex md:flex-col md:gap-2 md:px-2">
        {tabs.map((tab) => {
          const active = isActive(pathname, tab.href);
          return (
            <li key={tab.key} className="flex-1 md:flex-none">
              <Link
                href={tab.href}
                // Prefetching offline only produces failed requests; pages come from the service worker instead.
                prefetch={online ? undefined : false}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-xs font-semibold transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring md:rounded-lg md:py-3",
                  active ? "text-teal" : "text-muted-foreground hover:text-foreground",
                  active && "md:bg-teal-soft",
                )}
              >
                {active && <span className="absolute inset-x-6 top-0 h-1 rounded-b-full bg-teal md:hidden" aria-hidden />}
                <tab.icon className="size-6" aria-hidden />
                <span className="text-center leading-tight">{t(tab.key)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
