import AsyncStorage from '@react-native-async-storage/async-storage';

import { STORAGE_PREFIX } from '@/constants/app';
import type { Municipality } from '@/constants/municipalities';

// Live sea, wind, sky and rain from Open-Meteo (free, no key, CC BY 4.0: credit shown on screen).
// These are forecast-model values (Open-Meteo's best model mix for the point, refreshed every 15 minutes),
// not readings from a station at the shore. The screens say so.
// The last good reading is kept on the phone so Home still has something to show offline.

export interface SeaConditions {
  waveHeightM: number | null;
  wavePeriodS: number | null;
  windKmh: number | null;
  gustKmh: number | null;
  // Degrees the wind blows FROM, as forecasters report it.
  windFromDeg: number | null;
  // "05:46" local time
  sunrise: string | null;
  sunset: string | null;
  // Sky right now (WMO weather code), daylight, air temperature, and rain falling now.
  weatherCode: number | null;
  isDay: boolean;
  tempC: number | null;
  rainNowMm: number | null;
  // Rain outlook: highest chance today, total expected today, and in the next 12 hours the first
  // hour with a 50% or higher chance ("2026-10-30T13:00") and the highest chance.
  rainChanceToday: number | null;
  rainTodayMm: number | null;
  rainStartsAt: string | null;
  rainChanceNext12h: number | null;
  // How it feels on the skin, and the air temperature for each of the next 12 hours (for the small chart).
  humidity: number | null;
  feelsLikeC: number | null;
  dewPointC: number | null;
  tempNext12h: number[];
  // epoch ms of when we fetched it
  fetchedAt: number;
}

const TIMEOUT_MS = 12000;

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const hhmm = (v: unknown) => (typeof v === 'string' && v.includes('T') ? v.split('T')[1]?.slice(0, 5) ?? null : null);

async function getJson(url: string): Promise<Record<string, unknown>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as Record<string, unknown>;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchSeaConditions(town: Municipality): Promise<SeaConditions> {
  const { lat, lng } = town.sea;
  const at = `latitude=${lat}&longitude=${lng}&timezone=Asia%2FManila`;
  const [marine, weather] = await Promise.all([
    getJson(`https://marine-api.open-meteo.com/v1/marine?${at}&current=wave_height,wave_period`),
    getJson(
      `https://api.open-meteo.com/v1/forecast?${at}&current=wind_speed_10m,wind_direction_10m,wind_gusts_10m,weather_code,is_day,temperature_2m,precipitation,relative_humidity_2m,apparent_temperature,dew_point_2m` +
        '&hourly=precipitation_probability,temperature_2m&daily=sunrise,sunset,precipitation_probability_max,precipitation_sum&wind_speed_unit=kmh&forecast_days=2',
    ),
  ]);

  const m = (marine.current ?? {}) as Record<string, unknown>;
  const w = (weather.current ?? {}) as Record<string, unknown>;
  const daily = (weather.daily ?? {}) as Record<string, unknown[] | undefined>;
  const hourly = (weather.hourly ?? {}) as Record<string, unknown[] | undefined>;

  // The next 12 hours from the model's current time slot.
  const nowSlot = typeof w.time === 'string' ? w.time.slice(0, 13) : '';
  const times = (hourly.time ?? []) as string[];
  const from = Math.max(0, times.findIndex((t) => t.slice(0, 13) === nowSlot));
  const next = times.slice(from, from + 12).map((t, i) => ({ t, p: num(hourly.precipitation_probability?.[from + i]) }));
  const chances = next.map((h) => h.p).filter((p): p is number => p !== null);

  const conditions: SeaConditions = {
    waveHeightM: num(m.wave_height),
    wavePeriodS: num(m.wave_period),
    windKmh: num(w.wind_speed_10m),
    gustKmh: num(w.wind_gusts_10m),
    windFromDeg: num(w.wind_direction_10m),
    sunrise: hhmm(daily.sunrise?.[0]),
    sunset: hhmm(daily.sunset?.[0]),
    weatherCode: num(w.weather_code),
    isDay: w.is_day !== 0,
    tempC: num(w.temperature_2m),
    rainNowMm: num(w.precipitation),
    rainChanceToday: num(daily.precipitation_probability_max?.[0]),
    rainTodayMm: num(daily.precipitation_sum?.[0]),
    rainStartsAt: next.find((h) => (h.p ?? 0) >= 50)?.t ?? null,
    rainChanceNext12h: chances.length ? Math.max(...chances) : null,
    humidity: num(w.relative_humidity_2m),
    feelsLikeC: num(w.apparent_temperature),
    dewPointC: num(w.dew_point_2m),
    tempNext12h: times
      .slice(from, from + 12)
      .map((_, i) => num(hourly.temperature_2m?.[from + i]))
      .filter((v): v is number => v !== null),
    fetchedAt: Date.now(),
  };
  AsyncStorage.setItem(cacheKey(town), JSON.stringify(conditions)).catch(() => {});
  return conditions;
}

const cacheKey = (town: Municipality) => `${STORAGE_PREFIX}/sea/v3/${town.id}`;

export async function loadCachedConditions(town: Municipality): Promise<SeaConditions | null> {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(town));
    if (!raw) return null;
    const data = JSON.parse(raw) as SeaConditions;
    return typeof data.fetchedAt === 'number' ? data : null;
  } catch {
    return null;
  }
}

export type SeaState = 'calm' | 'slight' | 'moderate' | 'rough' | 'veryRough';

// Douglas sea scale bands, the same words PAGASA uses in its sea condition bulletins.
export function seaStateOf(waveHeightM: number): SeaState {
  if (waveHeightM < 0.5) return 'calm';
  if (waveHeightM < 1.25) return 'slight';
  if (waveHeightM < 2.5) return 'moderate';
  if (waveHeightM < 4) return 'rough';
  return 'veryRough';
}

const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;

export function compassFrom(deg: number): string {
  return COMPASS[Math.round(((deg % 360) + 360) % 360 / 45) % 8] ?? 'N';
}
