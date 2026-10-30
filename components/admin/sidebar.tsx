"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { AppLogo } from "@/components/brand/app-logo";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { NAV_GROUPS, isActive } from "./nav";

type SidebarProps = {
  collapsed?: boolean;
  onToggle?: () => void;
  onNavigate?: () => void;
};

export function Sidebar({ collapsed = false, onToggle, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className={cn("flex h-14 items-center gap-2 border-b border-sidebar-border px-4", collapsed && "justify-center px-0")}>
        <AppLogo />
        {!collapsed && (
          <div className="leading-tight">
            <p className="text-sm font-semibold">MarAIne</p>
            <p className="text-xs text-sidebar-muted">Admin · Marinduque</p>
          </div>
        )}
      </div>

      <nav aria-label="Main" className="flex-1 space-y-6 overflow-y-auto px-2 py-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="space-y-1">
            {collapsed ? (
              <div className="mx-auto my-2 h-px w-6 bg-sidebar-border" aria-hidden />
            ) : (
              <p className="px-2 pb-1 text-[11px] font-medium uppercase tracking-wider text-sidebar-muted">{group.label}</p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(pathname, item.href);
                const link = (
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex h-9 items-center gap-3 rounded-md px-2 text-sm transition-colors",
                      "hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-active",
                      active ? "bg-sidebar-accent font-medium text-sidebar-foreground" : "text-sidebar-muted",
                      collapsed && "justify-center px-0",
                    )}
                  >
                    {active && <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-sidebar-active" aria-hidden />}
                    <item.icon className={cn("size-4 shrink-0", active && "text-sidebar-active")} aria-hidden />
                    {collapsed ? <span className="sr-only">{item.label}</span> : item.label}
                  </Link>
                );
                return (
                  <li key={item.href}>
                    {collapsed ? (
                      <Tooltip>
                        <TooltipTrigger asChild>{link}</TooltipTrigger>
                        <TooltipContent side="right">{item.label}</TooltipContent>
                      </Tooltip>
                    ) : (
                      link
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {onToggle && (
        <div className="border-t border-sidebar-border p-2">
          <button
            type="button"
            onClick={onToggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            className={cn(
              "flex h-9 w-full items-center gap-3 rounded-md px-2 text-sm text-sidebar-muted transition-colors",
              "hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-active",
              collapsed && "justify-center px-0",
            )}
          >
            {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
            {!collapsed && "Collapse"}
          </button>
        </div>
      )}
    </div>
  );
}
