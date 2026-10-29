import { BadgeCheck, CircleDashed, CircleX, Clock, type LucideIcon } from "lucide-react";
import { LICENSE_STATUS_LABELS, type LicenseStatus } from "@/lib/fishers/license";
import { cn } from "@/lib/utils";

export const LICENSE_STYLE: Record<LicenseStatus, { icon: LucideIcon; className: string }> = {
  expired: { icon: CircleX, className: "bg-coral-soft text-coral" },
  expiring: { icon: Clock, className: "bg-warning-soft text-warning" },
  valid: { icon: BadgeCheck, className: "bg-teal-soft text-teal" },
  missing: { icon: CircleDashed, className: "bg-muted text-muted-foreground" },
};

/** License status as color + icon + word. For "expiring", shows the actual days left. */
export function LicenseBadge({ status, daysLeft, className }: { status: LicenseStatus; daysLeft?: number | null; className?: string }) {
  const { icon: Icon, className: tone } = LICENSE_STYLE[status];
  const label =
    status === "expiring" && daysLeft != null
      ? daysLeft === 0
        ? "Expires today"
        : `Expires in ${daysLeft} ${daysLeft === 1 ? "day" : "days"}`
      : LICENSE_STATUS_LABELS[status];
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-medium", tone, className)}>
      <Icon className="size-3" aria-hidden />
      {label}
    </span>
  );
}
