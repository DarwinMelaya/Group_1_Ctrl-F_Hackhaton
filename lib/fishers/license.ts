// License status for FishR registration. Pure: shared by the dashboard and the mobile app.
// Dates are calendar days (YYYY-MM-DD) in Philippine time.

export const EXPIRING_WITHIN_DAYS = 30;

export type LicenseStatus = "expired" | "expiring" | "valid" | "missing";

export const LICENSE_STATUS_ORDER: LicenseStatus[] = ["expired", "expiring", "missing", "valid"];

export const LICENSE_STATUS_LABELS: Record<LicenseStatus, string> = {
  expired: "Expired",
  expiring: `Expiring in ${EXPIRING_WITHIN_DAYS} days`,
  valid: "Valid",
  missing: "No license on record",
};

/** Whole days from `today` to `expiry` (negative when already expired). */
export function daysUntil(expiry: string, today: string) {
  return Math.round((Date.parse(`${expiry}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);
}

/** A license is still valid on its expiry date; expired from the day after. */
export function licenseStatus(expiry: string | null, today: string): LicenseStatus {
  if (!expiry) return "missing";
  const days = daysUntil(expiry, today);
  if (days < 0) return "expired";
  if (days <= EXPIRING_WITHIN_DAYS) return "expiring";
  return "valid";
}
