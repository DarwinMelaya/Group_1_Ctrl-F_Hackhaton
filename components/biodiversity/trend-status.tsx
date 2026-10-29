import { CircleDashed, Sprout, TrendingDown, TriangleAlert, type LucideIcon } from "lucide-react";
import { CRITICAL_BELOW, DECLINING_BELOW, MIN_LOGS, type TrendStatus } from "@/lib/analytics/biodiversity";
import { cn } from "@/lib/utils";

export const TREND_META: Record<TrendStatus, { label: string; rule: string; color: string; icon: LucideIcon; gradient: Record<number, string> }> = {
  abundant: {
    label: "Abundant",
    rule: `Catch per day changed by ${DECLINING_BELOW}% or better`,
    color: "#16A34A",
    icon: Sprout,
    gradient: { 0.3: "#bbf7d0", 0.65: "#4ade80", 1: "#15803d" },
  },
  declining: {
    label: "Declining",
    rule: `Catch per day fell ${-DECLINING_BELOW}% to ${-CRITICAL_BELOW}%`,
    color: "#EA580C",
    icon: TrendingDown,
    gradient: { 0.3: "#fed7aa", 0.65: "#fb923c", 1: "#c2410c" },
  },
  critical: {
    label: "Critical",
    rule: `Catch per day fell more than ${-CRITICAL_BELOW}%`,
    color: "#DC2626",
    icon: TriangleAlert,
    gradient: { 0.3: "#fecaca", 0.65: "#f87171", 1: "#b91c1c" },
  },
  insufficient: {
    label: "Not enough data",
    rule: `Fewer than ${MIN_LOGS} logs, or nothing logged in the previous period`,
    color: "#94A3B8",
    icon: CircleDashed,
    gradient: { 0.3: "#94a3b8", 0.65: "#64748b", 1: "#475569" },
  },
};

export const TREND_ORDER: TrendStatus[] = ["critical", "declining", "abundant", "insufficient"];

/** Trend status as color + icon + word. */
export function TrendBadge({ status, className }: { status: TrendStatus; className?: string }) {
  const meta = TREND_META[status];
  const Icon = meta.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium", className)} style={{ color: meta.color, backgroundColor: `${meta.color}1A` }}>
      <Icon className="size-3" aria-hidden />
      {meta.label}
    </span>
  );
}
