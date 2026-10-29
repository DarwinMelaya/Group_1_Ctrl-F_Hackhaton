import {
  Fish,
  Images,
  LayoutDashboard,
  Leaf,
  Map,
  MessageSquareText,
  ShieldAlert,
  Siren,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };
export type NavGroup = { label: string; items: NavItem[] };

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Monitor",
    items: [
      { href: "/admin", label: "Overview", icon: LayoutDashboard },
      { href: "/admin/catches", label: "Catches", icon: Fish },
      { href: "/admin/reports", label: "Reports", icon: Siren },
      { href: "/admin/biodiversity", label: "Biodiversity", icon: Leaf },
      { href: "/admin/hotspots", label: "Hotspots", icon: ShieldAlert },
      { href: "/admin/anomalies", label: "AI-assisted checks", icon: Sparkles },
    ],
  },
  {
    label: "Manage",
    items: [
      { href: "/admin/zones", label: "Zones", icon: Map },
      { href: "/admin/fishers", label: "Fishers", icon: Users },
      { href: "/admin/gallery", label: "Gallery", icon: Images },
    ],
  },
  {
    label: "Tools",
    items: [{ href: "/admin/sms", label: "SMS Simulator", icon: MessageSquareText }],
  },
];

export function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}

/** Cookie that remembers whether the sidebar is collapsed (read on the server to avoid a layout flash). */
export const SIDEBAR_COOKIE = "huliko_sidebar";
