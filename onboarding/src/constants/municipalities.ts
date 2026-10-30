export const MUNICIPALITY_IDS = [
  'boac',
  'buenavista',
  'gasan',
  'mogpog',
  'santa-cruz',
  'torrijos',
] as const;

export type MunicipalityId = (typeof MUNICIPALITY_IDS)[number];

export interface Municipality {
  id: MunicipalityId;
  name: string;
  // One short line to help people orient themselves.
  note: string;
  // A point just offshore of the town. The marine model has no data over land.
  sea: { lat: number; lng: number };
}

export const MUNICIPALITIES: readonly Municipality[] = [
  { id: 'boac', name: 'Boac', note: 'Capital town, on the west coast', sea: { lat: 13.45, lng: 121.78 } },
  { id: 'buenavista', name: 'Buenavista', note: 'South coast, below Mt. Malindig', sea: { lat: 13.2, lng: 121.94 } },
  { id: 'gasan', name: 'Gasan', note: 'West coast, near the Tres Reyes Islands', sea: { lat: 13.32, lng: 121.8 } },
  { id: 'mogpog', name: 'Mogpog', note: 'North coast, facing Tayabas Bay', sea: { lat: 13.54, lng: 121.86 } },
  { id: 'santa-cruz', name: 'Santa Cruz', note: 'Northeast, with Maniwaya and Mongpong', sea: { lat: 13.55, lng: 122.08 } },
  { id: 'torrijos', name: 'Torrijos', note: 'East coast, toward the Sibuyan Sea', sea: { lat: 13.32, lng: 122.14 } },
];

export function isMunicipalityId(value: unknown): value is MunicipalityId {
  return typeof value === 'string' && (MUNICIPALITY_IDS as readonly string[]).includes(value);
}

export function getMunicipality(id: MunicipalityId): Municipality | undefined {
  return MUNICIPALITIES.find((m) => m.id === id);
}
