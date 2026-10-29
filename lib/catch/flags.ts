// Flag reason codes written by public.evaluate_catch() (supabase/migrations/002).
// Keep this list and the SQL in sync.

export const FLAG_REASONS = {
  restricted_zone: {
    label: "Logged inside a restricted area",
    detail: "The catch location is inside an active restricted zone, such as a seasonal spawning area.",
    aiAssisted: false,
  },
  sanctuary: {
    label: "Logged inside a marine sanctuary",
    detail: "The catch location is inside an active no-take marine sanctuary.",
    aiAssisted: false,
  },
  license_expired: {
    label: "Fisher license had expired",
    detail: "The fisher's license expiry date is before the catch date.",
    aiAssisted: false,
  },
  license_missing: {
    label: "No license on record",
    detail: "There is no license expiry date on the fisher's profile.",
    aiAssisted: false,
  },
  closed_season: {
    label: "Species in closed season",
    detail: "The species was in its yearly closed season on the catch date.",
    aiAssisted: false,
  },
  undersized: {
    label: "Below minimum legal size",
    detail: "The recorded size is below the species' minimum legal size.",
    aiAssisted: false,
  },
  late_entry: {
    label: "Logged more than 48 hours late",
    detail: "The log was entered more than 48 hours after the catch, and no reason was given.",
    aiAssisted: false,
  },
  anomaly_large_catch: {
    label: "Unusually large for the boat size",
    detail: "Weight is above 100 kg per gross ton of the boat used.",
    aiAssisted: true,
  },
  anomaly_near_boundary: {
    label: "Repeated logs near a protected boundary",
    detail: "Third or later log within 300 m of a restricted zone or sanctuary by the same fisher in 14 days.",
    aiAssisted: true,
  },
} as const satisfies Record<string, { label: string; detail: string; aiAssisted: boolean }>;

export type FlagReason = keyof typeof FLAG_REASONS;

export function isFlagReason(code: string): code is FlagReason {
  return code in FLAG_REASONS;
}

/** Plain-language label for a flag code; unknown codes are shown as-is. */
export function flagLabel(code: string): string {
  return isFlagReason(code) ? FLAG_REASONS[code].label : code;
}
