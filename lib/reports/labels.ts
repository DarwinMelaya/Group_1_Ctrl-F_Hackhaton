import type { ReportStatus, ReportType } from "@/lib/types";

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  illegal_fishing: "Illegal fishing",
  destructive_fishing: "Blast or poison fishing",
  commercial_intrusion: "Commercial boat in municipal waters",
  pollution: "Pollution",
  habitat_damage: "Habitat damage",
  other: "Other",
};

export const REPORT_STATUS_LABELS: Record<ReportStatus, { label: string; detail: string }> = {
  received: { label: "Received", detail: "New report, not yet assigned." },
  investigating: { label: "Investigating", detail: "MAO, BFAR or Bantay Dagat is following up." },
  resolved: { label: "Resolved", detail: "Follow-up finished." },
};

export const REPORT_STATUS_ORDER: ReportStatus[] = ["received", "investigating", "resolved"];
