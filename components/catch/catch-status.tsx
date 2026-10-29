import { CircleCheck, ClipboardCheck, Clock, Flag, type LucideIcon } from "lucide-react";
import { CATCH_STATUS_LABELS } from "@/lib/catch/status";
import type { CatchStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export const CATCH_STATUS_STYLE: Record<CatchStatus, { icon: LucideIcon; text: string; soft: string; bar: string }> = {
  verified: { icon: CircleCheck, text: "text-teal", soft: "bg-teal-soft", bar: "bg-teal" },
  flagged: { icon: Flag, text: "text-coral", soft: "bg-coral-soft", bar: "bg-coral" },
  pending: { icon: Clock, text: "text-warning", soft: "bg-warning-soft", bar: "bg-warning" },
  reviewed: { icon: ClipboardCheck, text: "text-navy dark:text-sand-foreground", soft: "bg-secondary", bar: "bg-navy dark:bg-sand-foreground" },
};

/** Catch status as color + icon + word. */
export function CatchStatusBadge({ status, className }: { status: CatchStatus; className?: string }) {
  const style = CATCH_STATUS_STYLE[status];
  const Icon = style.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-medium", style.text, style.soft, className)}>
      <Icon className="size-3" aria-hidden />
      {CATCH_STATUS_LABELS[status].label}
    </span>
  );
}
