const LOCALE = "en-PH";

export function formatNumber(value: number, maxFractionDigits = 0) {
  return value.toLocaleString(LOCALE, { maximumFractionDigits: maxFractionDigits });
}

/** 950 kg, 1,284 kg, 12.9K kg: compact from 10,000 up. */
export function formatKg(value: number) {
  if (Math.abs(value) >= 10_000) {
    return `${value.toLocaleString(LOCALE, { notation: "compact", maximumFractionDigits: 1 })} kg`;
  }
  return `${formatNumber(value, value < 100 ? 1 : 0)} kg`;
}

/** Axis ticks: 0, 500, 1K, 2.5K */
export function formatCompact(value: number) {
  return value.toLocaleString(LOCALE, { notation: "compact", maximumFractionDigits: 1 });
}

/** "Oct 3" from YYYY-MM-DD (calendar date, no timezone shift). */
export function formatDayShort(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(LOCALE, { month: "short", day: "numeric", timeZone: "UTC" });
}

/** "Fri, Oct 3, 2026" */
export function formatDayLong(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(LOCALE, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatPercent(value: number) {
  return `${Math.abs(value) >= 10 ? Math.round(value) : value.toFixed(1)}%`;
}

/** "3 days ago", "in 2 hours": relative to now. */
export function formatRelative(iso: string, now = Date.now()) {
  const seconds = (Date.parse(iso) - now) / 1000;
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["week", 604_800],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];
  const rtf = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto" });
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return "just now";
}
