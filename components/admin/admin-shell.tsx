"use client";

import { useState, type ReactNode } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { SIDEBAR_COOKIE } from "./nav";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

type AdminShellProps = {
  user: { name: string; email: string; municipality: string | null };
  initialCollapsed: boolean;
  children: ReactNode;
};

export function AdminShell({ user, initialCollapsed, children }: AdminShellProps) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    // Cookie, not localStorage, so the server renders the right width with no flash.
    document.cookie = `${SIDEBAR_COOKIE}=${next ? "collapsed" : "expanded"}; path=/admin; max-age=31536000; samesite=lax`;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 hidden transition-[width] duration-200 lg:block",
            collapsed ? "w-16" : "w-60",
          )}
        >
          <Sidebar collapsed={collapsed} onToggle={toggle} />
        </aside>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-64 border-sidebar-border p-0 [&>button]:text-sidebar-foreground">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className={cn("flex min-h-screen flex-col transition-[padding] duration-200", collapsed ? "lg:pl-16" : "lg:pl-60")}>
          <Topbar user={user} onOpenMenu={() => setMobileOpen(true)} />
          <main id="main" className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
