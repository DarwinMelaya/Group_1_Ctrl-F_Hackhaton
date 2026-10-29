import { Ban, CircleCheck, CircleDot, CircleOff, Droplets, Shell, type LucideIcon } from "lucide-react";
import type { ZoneType } from "@/lib/types";
import { ZONE_COLORS, ZONE_LABELS } from "@/lib/zones/geo";
import { cn } from "@/lib/utils";

export const ZONE_ICONS: Record<ZoneType, LucideIcon> = {
  restricted: Ban,
  safe: CircleCheck,
  sanctuary: Shell,
  pollution: Droplets,
};

export const ZONE_TYPES: ZoneType[] = ["restricted", "sanctuary", "safe", "pollution"];

/** Zone type as color + icon + word. */
export function ZoneTypeBadge({ type, className }: { type: ZoneType; className?: string }) {
  const Icon = ZONE_ICONS[type];
  const color = ZONE_COLORS[type];
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium", className)}
      style={{ color, backgroundColor: `${color}1A` }}
    >
      <Icon className="size-3" aria-hidden />
      {ZONE_LABELS[type]}
    </span>
  );
}

export function ZoneActiveStatus({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-teal">
      <CircleDot className="size-3" aria-hidden /> Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <CircleOff className="size-3" aria-hidden /> Inactive
    </span>
  );
}

/** Map/panel key for a zone that has been drawn but not saved yet. */
export const NEW_ZONE_KEY = "__new__";
