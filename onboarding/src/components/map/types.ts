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
  // 'tourist': no street tiles; colored towns with labels and pins for coastal places.
  mode?: 'zones' | 'tourist';
  towns?: MapTown[];
  places?: MapPlace[];
}

export interface MapTown {
  id: string;
  name: string;
  color: string;
  count: number;
  geometry: unknown; // GeoJSON Polygon or MultiPolygon
}

export interface MapPlace {
  id: string;
  name: string;
  lat: number;
  lng: number;
  color: string;
}

export type MapCommand = { type: 'focusZone'; id: string } | { type: 'focusTown'; id: string } | { type: 'focusPlace'; id: string } | { type: 'focusMe' } | { type: 'home' };

export interface LeafletMapHandle {
  command: (c: MapCommand) => void;
}

export interface LeafletMapProps {
  data: MapData;
  onZonePress?: (id: string) => void;
  onPlacePress?: (id: string) => void;
  onTownPress?: (id: string) => void;
  // Leaflet could not load (no signal on first open).
  onError?: () => void;
  style?: StyleProp<ViewStyle>;
}

export type MapMessage = { type: 'ready' } | { type: 'error' } | { type: 'zone' | 'place' | 'town'; id: string };

export function parseMapMessage(raw: unknown): MapMessage | null {
  try {
    const m = (typeof raw === 'string' ? JSON.parse(raw) : raw) as { type?: unknown; id?: unknown } | null;
    if (m?.type === 'ready' || m?.type === 'error') return { type: m.type };
    if ((m?.type === 'zone' || m?.type === 'place' || m?.type === 'town') && typeof m.id === 'string') return { type: m.type, id: m.id };
  } catch {
    // Not ours.
  }
  return null;
}
