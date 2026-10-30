import type { StyleProp, ViewStyle } from 'react-native';

import type { ZoneType } from '@/constants/zones';
import type { ZoneGeometry } from '@/services/zones';

export interface MapZone {
  id: string;
  name: string;
  type: ZoneType;
  color: string;
  geometry: ZoneGeometry;
}

export interface MapData {
  zones: MapZone[];
  me: { lat: number; lng: number; accuracyM: number | null } | null;
  // The user's own catches; only ever shown on their own phone.
  catches: { lat: number; lng: number; title: string; subtitle: string }[];
}

export type MapCommand = { type: 'focusZone'; id: string } | { type: 'focusMe' } | { type: 'home' };

export interface LeafletMapHandle {
  command: (c: MapCommand) => void;
}

export interface LeafletMapProps {
  data: MapData;
  onZonePress?: (id: string) => void;
  // Leaflet could not load (no signal on first open).
  onError?: () => void;
  style?: StyleProp<ViewStyle>;
}

export type MapMessage = { type: 'ready' } | { type: 'error' } | { type: 'zone'; id: string };

export function parseMapMessage(raw: unknown): MapMessage | null {
  try {
    const m = (typeof raw === 'string' ? JSON.parse(raw) : raw) as { type?: unknown; id?: unknown } | null;
    if (m?.type === 'ready' || m?.type === 'error') return { type: m.type };
    if (m?.type === 'zone' && typeof m.id === 'string') return { type: 'zone', id: m.id };
  } catch {
    // Not ours.
  }
  return null;
}
