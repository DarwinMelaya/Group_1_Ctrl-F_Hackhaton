import type { CommunityIconName } from './icons';

// WMO weather interpretation codes, as returned by Open-Meteo's `weather_code`.
// Words are kept simple and match what people say at the shore.

export interface Sky {
  en: string;
  tl: string;
  icon: CommunityIconName;
  rainy: boolean;
}

export function skyOf(code: number | null, isDay: boolean): Sky {
  const sun = isDay ? 'weather-sunny' : 'weather-night';
  if (code === null) return { en: 'No sky report', tl: 'Walang ulat ng langit', icon: 'weather-cloudy', rainy: false };
  if (code === 0) return { en: isDay ? 'Sunny' : 'Clear night', tl: isDay ? 'Maaraw' : 'Maaliwalas na gabi', icon: sun, rainy: false };
  if (code === 1) return { en: isDay ? 'Mostly sunny' : 'Mostly clear', tl: isDay ? 'Halos maaraw' : 'Halos maaliwalas', icon: isDay ? 'weather-sunny' : 'weather-night', rainy: false };
  if (code === 2) return { en: 'Partly cloudy', tl: 'Medyo maulap', icon: isDay ? 'weather-partly-cloudy' : 'weather-night-partly-cloudy', rainy: false };
  if (code === 3) return { en: 'Cloudy', tl: 'Maulap', icon: 'weather-cloudy', rainy: false };
  if (code === 45 || code === 48) return { en: 'Foggy', tl: 'Mahamog', icon: 'weather-fog', rainy: false };
  if (code >= 51 && code <= 57) return { en: 'Light drizzle', tl: 'Ambon', icon: 'weather-partly-rainy', rainy: true };
  if (code === 61 || code === 80) return { en: 'Light rain', tl: 'Mahinang ulan', icon: 'weather-rainy', rainy: true };
  if (code === 63 || code === 81) return { en: 'Rain', tl: 'Umuulan', icon: 'weather-rainy', rainy: true };
  if (code === 65 || code === 82 || code === 66 || code === 67) return { en: 'Heavy rain', tl: 'Malakas na ulan', icon: 'weather-pouring', rainy: true };
  if (code >= 95) return { en: 'Thunderstorm', tl: 'May kidlat at ulan', icon: 'weather-lightning-rainy', rainy: true };
  return { en: 'Cloudy', tl: 'Maulap', icon: 'weather-cloudy', rainy: false };
}

// "2 PM" from "2026-10-30T14:00".
export const hourLabel = (iso: string) => {
  const h = Number(iso.slice(11, 13));
  return `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? 'AM' : 'PM'}`;
};

// The look of the Home scene. 'live' readings pick one; the chips let people preview the others.
export const MOODS = ['sunny', 'cloudy', 'windy', 'rain', 'clearing'] as const;
export type Mood = (typeof MOODS)[number] | 'night';

export const MOOD_LOOK: Record<(typeof MOODS)[number], { label: string; icon: CommunityIconName }> = {
  sunny: { label: 'Sunny', icon: 'weather-sunny' },
  cloudy: { label: 'Cloudy', icon: 'weather-cloudy' },
  windy: { label: 'Windy', icon: 'weather-windy' },
  rain: { label: 'Rain', icon: 'weather-pouring' },
  clearing: { label: 'Clearing up', icon: 'weather-partly-cloudy' },
};

interface MoodInput {
  weatherCode: number | null;
  isDay: boolean;
  rainNowMm: number | null;
  gustKmh: number | null;
  rainTodayMm: number | null;
  rainStartsAt: string | null;
}

// Picks the scene from the live reading. Rain wins, then strong wind, then sky cover.
export function moodOf(d: MoodInput): Mood {
  if (!d.isDay) return 'night';
  const code = d.weatherCode ?? 0;
  if (skyOf(code, true).rainy || (d.rainNowMm ?? 0) > 0) return 'rain';
  if ((d.gustKmh ?? 0) >= 40) return 'windy';
  // Rain earlier today, none falling now and none coming: the sky is clearing.
  if ((d.rainTodayMm ?? 0) > 0.5 && !d.rainStartsAt && code <= 2) return 'clearing';
  if (code >= 3 || d.rainStartsAt) return 'cloudy';
  return code === 2 ? 'cloudy' : 'sunny';
}
