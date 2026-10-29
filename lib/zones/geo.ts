import type { ZoneType } from "@/lib/types";

/** Point in the form PostgREST accepts for geography columns (lng first). */
export function toPointEwkt(lat: number, lng: number): string {
  return `SRID=4326;POINT(${lng} ${lat})`;
}

/** Fixed zone colors used on every map and legend. */
export const ZONE_COLORS: Record<ZoneType, string> = {
  restricted: "#DC2626",
  safe: "#16A34A",
  pollution: "#7C3AED",
  sanctuary: "#0D9488",
};

export const ZONE_LABELS: Record<ZoneType, string> = {
  restricted: "Restricted",
  safe: "Safe fishing",
  pollution: "Pollution advisory",
  sanctuary: "Marine sanctuary",
};

/** Map view that fits Marinduque and its nearby waters. */
export const MARINDUQUE_CENTER: [number, number] = [13.4, 121.97];
export const MARINDUQUE_ZOOM = 11;
