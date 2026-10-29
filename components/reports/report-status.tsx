import { CircleCheck, Inbox, Search, type LucideIcon } from "lucide-react";
import { REPORT_STATUS_LABELS } from "@/lib/reports/labels";
import type { ReportStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export const REPORT_STATUS_STYLE: Record<ReportStatus, { icon: LucideIcon; text: string; soft: string }> = {
  received: { icon: Inbox, text: "text-coral", soft: "bg-coral-soft" },
  investigating: { icon: Search, text: "text-warning", soft: "bg-warning-soft" },
  resolved: { icon: CircleCheck, text: "text-teal", soft: "bg-teal-soft" },
};

/** Report status as color + icon + word. */
export function ReportStatusBadge({ status, className }: { status: ReportStatus; className?: string }) {
  const style = REPORT_STATUS_STYLE[status];
  const Icon = style.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium", style.text, style.soft, className)}>
      <Icon className="size-3" aria-hidden />
      {REPORT_STATUS_LABELS[status].label}
    </span>
  );
}
