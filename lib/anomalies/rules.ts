// AI-assisted (rule-based) checks. Plain rules, no machine learning: each one puts a log up for review and
// never decides anything. Thresholds mirror evaluate_catch() (002) and anomaly_review() (007). Change all three together.

import type { Database } from "@/lib/database.types";

export type AnomalyRow = Database["public"]["Functions"]["anomaly_review"]["Returns"][number];

export const THRESHOLDS = { kgPerTon: 100, boundaryMeters: 300, windowDays: 14, priorLogs: 2 } as const;

export type AnomalyCode = "anomaly_large_catch" | "anomaly_near_boundary" | "closed_season" | "license_expired";

export const ANOMALY_RULES: Record<AnomalyCode, { title: string; kind: "Pattern" | "Compliance"; rule: string; why: string }> = {
  anomaly_large_catch: {
    title: "Unusually large catch for the boat",
    kind: "Pattern",
    rule: `More than ${THRESHOLDS.kgPerTon} kg per gross ton of the boat used (or the fisher's largest registered boat). Skipped when the fisher has no registered boat.`,
    why: "Small municipal boats rarely land this much in one trip. It can point to a typing error, an unregistered larger boat, or gear that needs checking.",
  },
  anomaly_near_boundary: {
    title: "Repeated logs near a protected boundary",
    kind: "Pattern",
    rule: `The ${THRESHOLDS.priorLogs + 1}rd or later log within ${THRESHOLDS.boundaryMeters} m of a restricted zone or sanctuary by the same fisher in ${THRESHOLDS.windowDays} days.`,
    why: "Fishing right at the edge again and again can mean the boundary is unclear on the water, or that fishing is drifting inside.",
  },
  closed_season: {
    title: "Species in closed season",
    kind: "Compliance",
    rule: "The species was caught during its yearly closed season.",
    why: "Closed seasons protect spawning. A log here may be bycatch, a wrong species name or a wrong date.",
  },
  license_expired: {
    title: "License had expired",
    kind: "Compliance",
    rule: "The fisher's license expiry date is before the catch date.",
    why: "Usually a renewal that has not been recorded yet. Check with the fisher and update their registration.",
  },
};

export const ANOMALY_ORDER: AnomalyCode[] = ["anomaly_large_catch", "anomaly_near_boundary", "closed_season", "license_expired"];

const day = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-PH", { month: "short", day: "numeric", timeZone: "UTC" });

/** One plain sentence with the numbers behind the flag. */
export function evidence(row: AnomalyRow): string {
  switch (row.rule as AnomalyCode) {
    case "anomaly_large_catch":
      return row.gross_tons
        ? `${Number(row.weight_kg)} kg on a ${Number(row.gross_tons)} GT boat = ${Number(row.kg_per_ton)} kg per ton (limit ${THRESHOLDS.kgPerTon}).`
        : `${Number(row.weight_kg)} kg; boat size not recorded.`;
    case "anomaly_near_boundary":
      return row.zone_name
        ? `${row.distance_m != null ? `${Number(row.distance_m)} m from` : "Near"} ${row.zone_name}; ${row.prior_logs ?? 0} earlier logs near a protected boundary in ${THRESHOLDS.windowDays} days.`
        : `${row.prior_logs ?? 0} earlier logs near a protected boundary in ${THRESHOLDS.windowDays} days.`;
    case "closed_season":
      return row.season_start && row.season_end
        ? `${row.species} closed season runs ${day(row.season_start)} to ${day(row.season_end)} every year.`
        : `${row.species} was in its closed season.`;
    case "license_expired":
      return row.license_expiry
        ? `License expired ${day(row.license_expiry)}, ${row.days_expired} ${row.days_expired === 1 ? "day" : "days"} before this catch.`
        : "License had expired before this catch.";
    default:
      return "";
  }
}
