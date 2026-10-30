import type { CommunityIconName } from './icons';

// Mirrors lib/zones/geo.ts in the web app: zone colors are fixed on every map and legend.
export const ZONE_TYPES = ['restricted', 'safe', 'sanctuary', 'pollution'] as const;
export type ZoneType = (typeof ZONE_TYPES)[number];

export interface ZoneLook {
  color: string;
  label: string;
  icon: CommunityIconName;
  // What it means for someone in a banca, in one line.
  guidance: string;
}

export const ZONE_LOOK: Record<ZoneType, ZoneLook> = {
  restricted: { color: '#DC2626', label: 'Restricted', icon: 'cancel', guidance: 'Fishing is limited here. Check the posted rules or ask the MAO.' },
  safe: { color: '#16A34A', label: 'Safe fishing', icon: 'check-circle-outline', guidance: 'Open for fishing.' },
  sanctuary: { color: '#0D9488', label: 'Marine sanctuary', icon: 'shield-half-full', guidance: 'No fishing at all. This area lets fish breed.' },
  pollution: { color: '#7C3AED', label: 'Pollution advisory', icon: 'biohazard', guidance: 'Water may be unsafe. Avoid fishing or swimming here.' },
};

export const isZoneType = (v: unknown): v is ZoneType => typeof v === 'string' && (ZONE_TYPES as readonly string[]).includes(v);

// Map view that fits Marinduque and its nearby waters (same as the dashboard).
export const MARINDUQUE_CENTER = { lat: 13.4, lng: 121.97 };
export const MARINDUQUE_ZOOM = 10;

// Seeded zone outlines are illustrative, not official ordinances.
export const SAMPLE_DATA = process.env.EXPO_PUBLIC_SAMPLE_DATA === 'true';
