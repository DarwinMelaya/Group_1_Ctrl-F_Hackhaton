// Biodiversity trend rule. Pure functions: shared by the admin dashboard and the mobile app.
//
// RULE (shown in the map legend):
// 1. Waters are split into square grid cells of CELL_SIZE_DEG (about 5.5 km).
// 2. For each cell (and species, when one is selected) we compare logged catch per day
//    in the current window (last N days) with the previous window of the same length.
// 3. change = (current kg/day - previous kg/day) / previous kg/day
//      Abundant   change >= -15%           (stable or rising)
//      Declining  -40% <= change < -15%
//      Critical   change < -40%
// 4. Not enough data: fewer than MIN_LOGS logs across both windows, or nothing logged
//    in the previous window (no baseline to compare with).
//
// Limitation: this uses logged catch, not catch per fishing trip, so a drop in how many
// fishers use the app also looks like a decline. Treat it as an early signal to investigate.

export const CELL_SIZE_DEG = 0.05;
export const DECLINING_BELOW = -15;
export const CRITICAL_BELOW = -40;
export const MIN_LOGS = 3;
export const WINDOW_OPTIONS = [14, 30] as const;
export type WindowDays = (typeof WINDOW_OPTIONS)[number];

export type TrendStatus = "abundant" | "declining" | "critical" | "insufficient";

export type CatchPoint = { lat: number; lng: number; kg: number; day: string };

export type TrendCell = {
  key: string;
  /** South-west corner */
  south: number;
  west: number;
  north: number;
  east: number;
  centerLat: number;
  centerLng: number;
  area: string;
  currentKgPerDay: number;
  previousKgPerDay: number;
  currentLogs: number;
  previousLogs: number;
  /** Percent; null when there is no baseline. */
  change: number | null;
  status: TrendStatus;
};

export type HeatPoint = { lat: number; lng: number; kg: number; status: TrendStatus };

export type Windows = { currentFrom: string; currentTo: string; previousFrom: string; previousTo: string; days: number };

export function classify(change: number | null, totalLogs: number): TrendStatus {
  if (change === null || totalLogs < MIN_LOGS) return "insufficient";
  if (change < CRITICAL_BELOW) return "critical";
  if (change < DECLINING_BELOW) return "declining";
  return "abundant";
}

function cellIndex(value: number) {
  // Round before flooring so values on a boundary land in the same cell in every runtime.
  return Math.floor(Math.round((value / CELL_SIZE_DEG) * 1e6) / 1e6);
}

/** Groups catches into grid cells and applies the rule. Points outside both windows are ignored. */
export function computeTrendCells(points: CatchPoint[], w: Windows): { cells: TrendCell[]; heat: HeatPoint[] } {
  type Acc = { i: number; j: number; cur: number; prev: number; curLogs: number; prevLogs: number; curPoints: CatchPoint[] };
  const acc = new Map<string, Acc>();

  for (const p of points) {
    const inCurrent = p.day >= w.currentFrom && p.day <= w.currentTo;
    const inPrevious = p.day >= w.previousFrom && p.day <= w.previousTo;
    if (!inCurrent && !inPrevious) continue;

    const i = cellIndex(p.lat);
    const j = cellIndex(p.lng);
    const key = `${i}:${j}`;
    const a = acc.get(key) ?? { i, j, cur: 0, prev: 0, curLogs: 0, prevLogs: 0, curPoints: [] };
    if (inCurrent) {
      a.cur += p.kg;
      a.curLogs += 1;
      a.curPoints.push(p);
    } else {
      a.prev += p.kg;
      a.prevLogs += 1;
    }
    acc.set(key, a);
  }

  const cells: TrendCell[] = [];
  const heat: HeatPoint[] = [];
  for (const [key, a] of Array.from(acc)) {
    const current = a.cur / w.days;
    const previous = a.prev / w.days;
    const change = previous > 0 ? ((current - previous) / previous) * 100 : null;
    const status = classify(change, a.curLogs + a.prevLogs);
    const south = a.i * CELL_SIZE_DEG;
    const west = a.j * CELL_SIZE_DEG;
    const centerLat = south + CELL_SIZE_DEG / 2;
    const centerLng = west + CELL_SIZE_DEG / 2;
    cells.push({
      key,
      south,
      west,
      north: south + CELL_SIZE_DEG,
      east: west + CELL_SIZE_DEG,
      centerLat,
      centerLng,
      area: nearestTown(centerLat, centerLng),
      currentKgPerDay: current,
      previousKgPerDay: previous,
      currentLogs: a.curLogs,
      previousLogs: a.prevLogs,
      change,
      status,
    });
    for (const p of a.curPoints) heat.push({ lat: p.lat, lng: p.lng, kg: p.kg, status });
  }

  const order: Record<TrendStatus, number> = { critical: 0, declining: 1, abundant: 2, insufficient: 3 };
  cells.sort((x, y) => order[x.status] - order[y.status] || (x.change ?? 0) - (y.change ?? 0));
  return { cells, heat };
}

export type SpeciesTrend = {
  speciesId: string;
  species: string;
  english: string;
  currentKgPerDay: number;
  previousKgPerDay: number;
  currentLogs: number;
  previousLogs: number;
  change: number | null;
  status: TrendStatus;
};

/**
 * Same rule applied island-wide, one row per species. Pools every log (including SMS logs
 * without a location), so it gives a signal even where single cells have too little data.
 */
export function computeSpeciesTrends(
  rows: { speciesId: string; species: string; english: string; kg: number; day: string }[],
  w: Windows,
): SpeciesTrend[] {
  type Acc = { speciesId: string; species: string; english: string; cur: number; prev: number; currentLogs: number; previousLogs: number };
  const acc = new Map<string, Acc>();
  for (const r of rows) {
    const inCurrent = r.day >= w.currentFrom && r.day <= w.currentTo;
    const inPrevious = r.day >= w.previousFrom && r.day <= w.previousTo;
    if (!inCurrent && !inPrevious) continue;
    const a = acc.get(r.speciesId) ?? { speciesId: r.speciesId, species: r.species, english: r.english, cur: 0, prev: 0, currentLogs: 0, previousLogs: 0 };
    if (inCurrent) {
      a.cur += r.kg;
      a.currentLogs += 1;
    } else {
      a.prev += r.kg;
      a.previousLogs += 1;
    }
    acc.set(r.speciesId, a);
  }

  const order: Record<TrendStatus, number> = { critical: 0, declining: 1, abundant: 2, insufficient: 3 };
  return Array.from(acc.values())
    .map(({ cur, prev, ...t }) => {
      const currentKgPerDay = cur / w.days;
      const previousKgPerDay = prev / w.days;
      const change = previousKgPerDay > 0 ? ((currentKgPerDay - previousKgPerDay) / previousKgPerDay) * 100 : null;
      return { ...t, currentKgPerDay, previousKgPerDay, change, status: classify(change, t.currentLogs + t.previousLogs) };
    })
    .sort((x, y) => order[x.status] - order[y.status] || (x.change ?? 0) - (y.change ?? 0));
}

// Town centres of Marinduque's municipalities, for a readable "Off Gasan" label.
// Offshore islands are added as extra points so their waters take the right municipality's name.
const TOWNS: [string, number, number][] = [
  ["Boac", 13.447, 121.84],
  ["Mogpog", 13.475, 121.862],
  ["Gasan", 13.322, 121.846],
  ["Gasan", 13.255, 121.855], // Tres Reyes Islands
  ["Buenavista", 13.257, 121.942],
  ["Torrijos", 13.322, 122.083],
  ["Santa Cruz", 13.474, 122.029],
  ["Santa Cruz", 13.535, 122.1], // Maniwaya and Mongpong islands
];

/** "Off Gasan": the municipality with the nearest town centre or island. General area only. */
export function nearestTown(lat: number, lng: number) {
  let best = TOWNS[0];
  let bestD = Infinity;
  for (const t of TOWNS) {
    const d = (t[1] - lat) ** 2 + ((t[2] - lng) * Math.cos((lat * Math.PI) / 180)) ** 2;
    if (d < bestD) {
      bestD = d;
      best = t;
    }
  }
  return `Off ${best[0]}`;
}
