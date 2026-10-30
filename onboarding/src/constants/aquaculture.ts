import type { CommunityIconName } from './icons';

export const CROP_IDS = ['cottonii', 'spinosum', 'bangus-cage', 'other'] as const;
export type CropId = (typeof CROP_IDS)[number];

export interface Crop {
  id: CropId;
  name: string;
  unit: string; // plural: "lines", "cages"
  icon: CommunityIconName;
  // Usual days from planting to harvest, when there is a common rule of thumb.
  cycleDays: [number, number] | null;
}

export const CROPS: readonly Crop[] = [
  { id: 'cottonii', name: 'Seaweed (cottonii)', unit: 'lines', icon: 'sprout', cycleDays: [45, 60] },
  { id: 'spinosum', name: 'Seaweed (spinosum)', unit: 'lines', icon: 'sprout', cycleDays: [45, 60] },
  { id: 'bangus-cage', name: 'Bangus cage', unit: 'cages', icon: 'fish', cycleDays: null },
  { id: 'other', name: 'Other', unit: 'units', icon: 'waves', cycleDays: null },
];

export const isCropId = (v: unknown): v is CropId => typeof v === 'string' && (CROP_IDS as readonly string[]).includes(v);
export const getCrop = (id: CropId) => CROPS.find((c) => c.id === id) ?? CROPS[CROPS.length - 1]!;

export interface Harvest {
  at: string; // ISO
  wetKg: number;
}

export interface FarmPlot {
  id: string;
  name: string;
  crop: CropId;
  units: number;
  plantedAt: string; // ISO date the current cycle started
  harvests: Harvest[]; // newest first
}

export function parsePlot(v: unknown): FarmPlot | null {
  if (typeof v !== 'object' || v === null) return null;
  const p = v as Record<string, unknown>;
  if (typeof p.id !== 'string' || typeof p.name !== 'string' || !isCropId(p.crop) || typeof p.units !== 'number' || typeof p.plantedAt !== 'string') return null;
  const harvests = Array.isArray(p.harvests)
    ? p.harvests.filter((h): h is Harvest => typeof h === 'object' && h !== null && typeof (h as Harvest).at === 'string' && typeof (h as Harvest).wetKg === 'number')
    : [];
  return { id: p.id, name: p.name, crop: p.crop, units: p.units, plantedAt: p.plantedAt, harvests };
}

export const daysSince = (iso: string) => Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));

export type CycleStage = { label: string; tone: 'reef' | 'mangrove' | 'coral'; icon: CommunityIconName; progress: number } | null;

// Where a seaweed cycle stands against the usual harvest window. Icon + word, never color alone.
export function cycleStage(plot: FarmPlot): CycleStage {
  const crop = getCrop(plot.crop);
  if (!crop.cycleDays) return null;
  const [from, to] = crop.cycleDays;
  const d = daysSince(plot.plantedAt);
  const progress = Math.min(1, d / from);
  if (d < from) return { label: `Growing · about ${from - d} days to the usual harvest`, tone: 'reef', icon: 'sprout', progress };
  if (d <= to) return { label: 'In the usual harvest window', tone: 'mangrove', icon: 'check-circle-outline', progress };
  return { label: 'Past the usual window · check the lines', tone: 'coral', icon: 'alert-circle-outline', progress };
}
