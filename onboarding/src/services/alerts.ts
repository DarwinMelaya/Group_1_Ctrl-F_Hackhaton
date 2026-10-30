import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { STORAGE_PREFIX } from '@/constants/app';
import type { Municipality } from '@/constants/municipalities';

import { SEA_ALERTS_CHANNEL_ID } from './permissions';
import type { Zone } from './zones';

// Reminders shown in the app (bell on Home, banner at the top) and, on a phone that allowed
// notifications, as a system notification. Two sources:
//  - zones: near or inside a restricted area or sanctuary, or inside a safe fishing zone;
//  - weather: the next 24 hours of wind and waves from Open-Meteo.
// Storm surge itself is not forecast by Open-Meteo. Very strong wind with very high waves is shown
// as "storm surge possible" and always points to PAGASA, which issues the official warnings.

export type AlertLevel = 'danger' | 'warn' | 'good' | 'info';

export interface Alert {
  id: string;
  kind: 'zone' | 'weather';
  level: AlertLevel;
  title: { en: string; fil: string };
  body: { en: string; fil: string };
  at: number;
}

const LIST_KEY = `${STORAGE_PREFIX}/alerts/v1`;
const SEEN_KEY = `${STORAGE_PREFIX}/alerts-seen/v1`;
const KEEP = 30;

let list: Alert[] = [];
let lastSeen = 0;
let loaded = false;
let latest: Alert | null = null; // newest alert not yet dismissed from the banner
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

// When the same alert key was last raised, so it repeats only after its cooldown.
const raisedAt = new Map<string, number>();

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
  });
}

async function load() {
  if (loaded) return;
  loaded = true;
  try {
    const [l, s] = await Promise.all([AsyncStorage.getItem(LIST_KEY), AsyncStorage.getItem(SEEN_KEY)]);
    list = l ? (JSON.parse(l) as Alert[]) : [];
    lastSeen = s ? Number(s) : 0;
    emit();
  } catch {
    // Starts empty.
  }
}

async function systemNotify(a: Alert, lang: 'en' | 'fil') {
  if (Platform.OS === 'web') return;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;
    await Notifications.scheduleNotificationAsync({
      content: { title: a.title[lang], body: a.body[lang] },
      trigger: Platform.OS === 'android' ? { channelId: SEA_ALERTS_CHANNEL_ID } : null,
    });
  } catch {
    // The in-app banner still shows it.
  }
}

/** Raise an alert unless the same key was raised within `cooldownMs`. */
export async function raise(key: string, a: Omit<Alert, 'id' | 'at'>, cooldownMs: number, lang: 'en' | 'fil') {
  await load();
  const now = Date.now();
  const last = raisedAt.get(key) ?? list.find((x) => x.id.startsWith(`${key}|`))?.at ?? 0;
  if (now - last < cooldownMs) return;
  raisedAt.set(key, now);
  const alert: Alert = { ...a, id: `${key}|${now}`, at: now };
  list = [alert, ...list].slice(0, KEEP);
  latest = alert;
  emit();
  AsyncStorage.setItem(LIST_KEY, JSON.stringify(list)).catch(() => {});
  systemNotify(alert, lang);
}

export function dismissBanner() {
  latest = null;
  emit();
}

export function markAllSeen() {
  lastSeen = Date.now();
  emit();
  AsyncStorage.setItem(SEEN_KEY, String(lastSeen)).catch(() => {});
}

export function useAlerts() {
  const [, bump] = useState(0);
  useEffect(() => {
    const l = () => bump((n) => n + 1);
    listeners.add(l);
    load();
    return () => {
      listeners.delete(l);
    };
  }, []);
  return { list, unread: list.filter((a) => a.at > lastSeen).length, latest };
}

// ---------- zones ----------

const R = 6371000;
// Metres between a point and a segment, on a local flat projection (fine at these distances).
function segDist(lat: number, lng: number, a: [number, number], b: [number, number]) {
  const k = Math.cos((lat * Math.PI) / 180);
  const x = (p: [number, number]) => (p[0] - lng) * k;
  const y = (p: [number, number]) => p[1] - lat;
  const ax = x(a), ay = y(a), bx = x(b), by = y(b);
  const dx = bx - ax, dy = by - ay;
  const t = dx || dy ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / (dx * dx + dy * dy))) : 0;
  const px = ax + t * dx, py = ay + t * dy;
  return Math.sqrt(px * px + py * py) * (Math.PI / 180) * R;
}

/** Metres from the point to the zone's edge. */
export function distanceToZone(z: Zone, lat: number, lng: number) {
  const polys = z.geometry.type === 'Polygon' ? [z.geometry.coordinates] : z.geometry.coordinates;
  let best = Infinity;
  for (const poly of polys) for (const ring of poly) for (let i = 1; i < ring.length; i++) best = Math.min(best, segDist(lat, lng, ring[i - 1]!, ring[i]!));
  return best;
}

export const NEAR_M = 500;
const ZONE_COOLDOWN = 30 * 60_000;

/** Raise reminders for where the person is now. `inside` comes from zonesAt(). */
export function checkZones(zones: Zone[], inside: Zone[], lat: number, lng: number, lang: 'en' | 'fil') {
  const insideIds = new Set(inside.map((z) => z.id));
  for (const z of inside) {
    if (z.type === 'restricted')
      raise(`zone-in-${z.id}`, { kind: 'zone', level: 'danger', title: { en: `You are inside ${z.name}`, fil: `Nasa loob ka ng ${z.name}` }, body: { en: 'This is a restricted area. Fishing is limited here. Please move out.', fil: 'Bawal na lugar ito. May limitasyon ang pangingisda rito. Lumabas po muna.' } }, ZONE_COOLDOWN, lang);
    else if (z.type === 'sanctuary')
      raise(`zone-in-${z.id}`, { kind: 'zone', level: 'danger', title: { en: `You are inside ${z.name}`, fil: `Nasa loob ka ng ${z.name}` }, body: { en: 'Marine sanctuary: no fishing at all. Fish breed here.', fil: 'Santuwaryo ng dagat: bawal mangisda. Dito nangingitlog ang isda.' } }, ZONE_COOLDOWN, lang);
    else if (z.type === 'safe')
      raise(`zone-in-${z.id}`, { kind: 'zone', level: 'good', title: { en: `You are in a safe fishing zone`, fil: 'Nasa ligtas na pangisdaan ka' }, body: { en: `${z.name}: open for fishing. Follow the usual rules.`, fil: `${z.name}: puwedeng mangisda. Sundin ang karaniwang patakaran.` } }, ZONE_COOLDOWN, lang);
    else if (z.type === 'pollution')
      raise(`zone-in-${z.id}`, { kind: 'zone', level: 'warn', title: { en: `Pollution advisory: ${z.name}`, fil: `Abiso sa polusyon: ${z.name}` }, body: { en: 'The water may be unsafe. Avoid fishing or swimming here.', fil: 'Baka hindi ligtas ang tubig. Iwasang mangisda o lumangoy rito.' } }, ZONE_COOLDOWN, lang);
  }
  for (const z of zones) {
    if (insideIds.has(z.id) || (z.type !== 'restricted' && z.type !== 'sanctuary')) continue;
    const d = distanceToZone(z, lat, lng);
    if (d > NEAR_M) continue;
    const m = Math.round(d / 10) * 10;
    raise(`zone-near-${z.id}`, {
      kind: 'zone',
      level: 'warn',
      title: { en: `${z.type === 'restricted' ? 'Restricted area' : 'Sanctuary'} about ${m} m away`, fil: `${z.type === 'restricted' ? 'Bawal na lugar' : 'Santuwaryo'} mga ${m} m ang layo` },
      body: { en: `You are close to ${z.name}. Do not fish past its edge. Check the Map.`, fil: `Malapit ka na sa ${z.name}. Huwag mangisda lampas sa hangganan. Tingnan ang Mapa.` },
    }, ZONE_COOLDOWN, lang);
  }
}

// ---------- weather ----------

interface Outlook {
  maxWaveM: number | null;
  maxWaveAt: string | null;
  maxGustKmh: number | null;
  maxGustAt: string | null;
  thunder: boolean;
  heavyRain: boolean;
}

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

function peak(times: string[], values: unknown[]) {
  let best: number | null = null;
  let at: string | null = null;
  values.forEach((v, i) => {
    const n = num(v);
    if (n !== null && (best === null || n > best)) {
      best = n;
      at = times[i] ?? null;
    }
  });
  return { best, at };
}

async function fetchOutlook(town: Municipality): Promise<Outlook> {
  const at = `latitude=${town.sea.lat}&longitude=${town.sea.lng}&timezone=Asia%2FManila&forecast_hours=24`;
  const [marine, weather] = await Promise.all([
    fetch(`https://marine-api.open-meteo.com/v1/marine?${at}&hourly=wave_height`).then((r) => r.json()),
    fetch(`https://api.open-meteo.com/v1/forecast?${at}&hourly=wind_gusts_10m,weather_code,precipitation&wind_speed_unit=kmh`).then((r) => r.json()),
  ]);
  const mh = (marine?.hourly ?? {}) as { time?: string[]; wave_height?: unknown[] };
  const wh = (weather?.hourly ?? {}) as { time?: string[]; wind_gusts_10m?: unknown[]; weather_code?: unknown[]; precipitation?: unknown[] };
  const wave = peak(mh.time ?? [], mh.wave_height ?? []);
  const gust = peak(wh.time ?? [], wh.wind_gusts_10m ?? []);
  return {
    maxWaveM: wave.best,
    maxWaveAt: wave.at,
    maxGustKmh: gust.best,
    maxGustAt: gust.at,
    thunder: (wh.weather_code ?? []).some((c) => (num(c) ?? 0) >= 95),
    heavyRain: (wh.precipitation ?? []).some((p) => (num(p) ?? 0) >= 7.6),
  };
}

const hour = (iso: string | null) => {
  if (!iso) return '';
  const h = Number(iso.slice(11, 13));
  return `${((h + 11) % 12) + 1} ${h >= 12 ? 'PM' : 'AM'}`;
};

const WEATHER_COOLDOWN = 6 * 60 * 60_000;

/**
 * Thresholds (next 24 h):
 *  - storm surge possible: gusts >= 89 km/h (typhoon-strength wind) AND waves >= 4 m;
 *  - stay ashore: gusts >= 62 km/h (gale) or waves >= 2.5 m (rough sea);
 *  - take care: gusts >= 40 km/h, waves >= 1.25 m, thunderstorms or heavy rain;
 *  - good: none of the above.
 */
export async function checkWeather(town: Municipality, lang: 'en' | 'fil') {
  const o = await fetchOutlook(town);
  const wave = o.maxWaveM ?? 0;
  const gust = o.maxGustKmh ?? 0;
  const w = o.maxWaveM === null ? '' : `${wave.toFixed(1)} m`;
  const pagasa = { en: ' Follow PAGASA for official warnings.', fil: ' Sundin ang PAGASA para sa opisyal na babala.' };

  if (gust >= 89 && wave >= 4) {
    return raise(`wx-surge-${town.id}`, { kind: 'weather', level: 'danger', title: { en: 'Storm surge possible', fil: 'Posibleng storm surge' }, body: { en: `Very strong wind (${Math.round(gust)} km/h) and waves up to ${w} near ${town.name} in the next 24 hours. Stay away from the shore.${pagasa.en}`, fil: `Napakalakas na hangin (${Math.round(gust)} km/h) at alon hanggang ${w} sa ${town.name} sa susunod na 24 oras. Lumayo sa dalampasigan.${pagasa.fil}` } }, WEATHER_COOLDOWN, lang);
  }
  if (gust >= 62 || wave >= 2.5) {
    return raise(`wx-rough-${town.id}`, { kind: 'weather', level: 'danger', title: { en: 'Rough sea coming: stay ashore', fil: 'Paparating ang maalong dagat: huwag lumaot' }, body: { en: `Waves up to ${w} around ${hour(o.maxWaveAt)}, gusts up to ${Math.round(gust)} km/h near ${town.name}. Small boats should not go out.${pagasa.en}`, fil: `Alon hanggang ${w} bandang ${hour(o.maxWaveAt)}, hangin hanggang ${Math.round(gust)} km/h sa ${town.name}. Huwag nang lumaot ang maliliit na bangka.${pagasa.fil}` } }, WEATHER_COOLDOWN, lang);
  }
  if (gust >= 40 || wave >= 1.25 || o.thunder || o.heavyRain) {
    const why = o.thunder ? { en: 'thunderstorms', fil: 'may kidlat' } : o.heavyRain ? { en: 'heavy rain', fil: 'malakas na ulan' } : { en: `waves up to ${w}`, fil: `alon hanggang ${w}` };
    return raise(`wx-care-${town.id}`, { kind: 'weather', level: 'warn', title: { en: 'Take care at sea today', fil: 'Mag-ingat sa dagat ngayon' }, body: { en: `Expect ${why.en} near ${town.name} in the next 24 hours. Stay close to shore.`, fil: `Asahan ang ${why.fil} sa ${town.name} sa susunod na 24 oras. Manatiling malapit sa pampang.` } }, WEATHER_COOLDOWN, lang);
  }
  return raise(`wx-good-${town.id}`, { kind: 'weather', level: 'good', title: { en: 'Good weather at sea', fil: 'Maganda ang panahon sa dagat' }, body: { en: `Calm sea${w ? ` (waves up to ${w})` : ''} and light wind near ${town.name} for the next 24 hours. Still check PAGASA before a long trip.`, fil: `Kalmado ang dagat${w ? ` (alon hanggang ${w})` : ''} at mahina ang hangin sa ${town.name} sa susunod na 24 oras. Tingnan pa rin ang PAGASA bago bumiyahe nang malayo.` } }, 12 * 60 * 60_000, lang);
}
