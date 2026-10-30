// Flag reason codes written by public.evaluate_catch(). Mirrors lib/catch/flags.ts in the web app;
// change the SQL, that file and this one together. Wording is always "for review", never accusatory.

const FLAG_LABELS: Record<string, string> = {
  restricted_zone: 'Logged inside a restricted area',
  sanctuary: 'Logged inside a marine sanctuary',
  license_expired: 'Fisher license had expired',
  license_missing: 'No license on record',
  closed_season: 'Species in closed season',
  undersized: 'Below minimum legal size',
  late_entry: 'Logged more than 48 hours late',
  anomaly_large_catch: 'Unusually large for the boat size',
  anomaly_near_boundary: 'Repeated logs near a protected boundary',
};

export function flagLabel(code: string): string {
  return FLAG_LABELS[code] ?? code;
}
