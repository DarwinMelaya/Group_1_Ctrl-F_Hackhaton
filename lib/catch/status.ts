import type { CatchStatus } from "@/lib/types";

/** Plain-language status wording. Flagged logs are "for review", never a verdict. */
export const CATCH_STATUS_LABELS: Record<CatchStatus, { label: string; detail: string }> = {
  verified: { label: "Verified", detail: "Passed every check when it was logged." },
  flagged: { label: "Flagged for review", detail: "One or more checks need a look from the MAO or BFAR." },
  pending: { label: "Pending", detail: "Logged without a location yet, so the zone could not be checked." },
  reviewed: { label: "Reviewed", detail: "Flagged earlier and reviewed by an administrator." },
};

export const CATCH_STATUS_ORDER: CatchStatus[] = ["flagged", "pending", "reviewed", "verified"];
