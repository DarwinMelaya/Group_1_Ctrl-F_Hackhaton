import AsyncStorage from '@react-native-async-storage/async-storage';

import { STORAGE_PREFIX } from '@/constants/app';
import { isZoneType, type ZoneType } from '@/constants/zones';

import { supabase } from './supabase';

// Active zones from the zones_geojson view (signed-in read, RLS). Kept on the phone so the
// "am I inside a zone?" check still works at sea without signal.

type Ring = [number, number][]; // [lng, lat]
export type ZoneGeometry = { type: 'Polygon'; coordinates: Ring[] } | { type: 'MultiPolygon'; coordinates: Ring[][] };

export interface Zone {
  id: string;
  name: string;
  type: ZoneType;
  reason: string | null;
  areaHa: number | null;
  geometry: ZoneGeometry;
}

export interface ZoneCache {
  zones: Zone[];
  fetchedAt: number;
}

const KEY = `${STORAGE_PREFIX}/zones/v1`;

function parseGeometry(v: unknown): ZoneGeometry | null {
  const g = (typeof v === 'string' ? JSON.parse(v) : v) as { type?: unknown; coordinates?: unknown } | null;
  if (!g || !Array.isArray(g.coordinates)) return null;
  if (g.type === 'Polygon') return { type: 'Polygon', coordinates: g.coordinates as Ring[] };
  if (g.type === 'MultiPolygon') return { type: 'MultiPolygon', coordinates: g.coordinates as Ring[][] };
  return null;
}

export async function fetchZones(): Promise<ZoneCache> {
  if (!supabase) throw new Error('offline');
  const { data, error } = await supabase
    .from('zones_geojson')
    .select('id, name, type, reason, area_ha, geojson')
    .eq('active', true)
    .order('name');
  if (error) throw error;

  const zones: Zone[] = [];
  for (const row of data ?? []) {
    let geometry: ZoneGeometry | null = null;
    try {
      geometry = parseGeometry(row.geojson);
    } catch {
      geometry = null;
    }
    if (!row.id || !row.name || !isZoneType(row.type) || !geometry) continue;
    zones.push({ id: row.id, name: row.name, type: row.type, reason: row.reason ?? null, areaHa: row.area_ha ?? null, geometry });
  }
  const cache = { zones, fetchedAt: Date.now() };
  AsyncStorage.setItem(KEY, JSON.stringify(cache)).catch(() => {});
  return cache;
}

export async function loadCachedZones(): Promise<ZoneCache | null> {
  try {
    const data = JSON.parse((await AsyncStorage.getItem(KEY)) ?? 'null') as ZoneCache | null;
    return data && Array.isArray(data.zones) ? data : null;
  } catch {
    return null;
  }
}

// Ray casting on [lng, lat] rings; holes subtract.
function inRing(lng: number, lat: number, ring: Ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]!;
    const [xj, yj] = ring[j]!;
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function inPolygon(lng: number, lat: number, rings: Ring[]) {
  const [outer, ...holes] = rings;
  return !!outer && inRing(lng, lat, outer) && !holes.some((h) => inRing(lng, lat, h));
}

export function zonesAt(zones: Zone[], lat: number, lng: number): Zone[] {
  return zones.filter((z) =>
    z.geometry.type === 'Polygon'
      ? inPolygon(lng, lat, z.geometry.coordinates)
      : z.geometry.coordinates.some((p) => inPolygon(lng, lat, p)),
  );
}
