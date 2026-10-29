import { CircleHelp, SignalHigh, SignalLow, SignalMedium, type LucideIcon } from "lucide-react";
import { REEF_LABELS } from "@/lib/gallery/labels";
import type { ReefCondition } from "@/lib/types";
import { cn } from "@/lib/utils";

// Signal-strength icons carry the level without relying on color.
export const REEF_STYLE: Record<ReefCondition, { icon: LucideIcon; badge: string; bar: string }> = {
  good: { icon: SignalHigh, badge: "bg-teal-soft text-teal", bar: "bg-teal" },
  fair: { icon: SignalMedium, badge: "bg-warning-soft text-warning", bar: "bg-warning" },
  poor: { icon: SignalLow, badge: "bg-coral-soft text-coral", bar: "bg-coral" },
};

/** Reef condition as color + icon + word. */
export function ReefBadge({ condition, className }: { condition: ReefCondition | null; className?: string }) {
  if (!condition) {
    return (
      <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground", className)}>
        <CircleHelp className="size-3" aria-hidden />
        Not rated
      </span>
    );
  }
  const { icon: Icon, badge } = REEF_STYLE[condition];
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-medium", badge, className)}>
      <Icon className="size-3" aria-hidden />
      Reef: {REEF_LABELS[condition].label}
    </span>
  );
}
