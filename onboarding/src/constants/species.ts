// Mirrors public.species (004_seed.sql). local_name is unique there, so it is the key a later sync
// maps to species.id. Legal sizes and closed seasons are left out on purpose: the seeded values are
// sample data, and the server's evaluate_catch decides what is flagged for review.

export interface Species {
  localName: string;
  englishName: string;
}

export const SPECIES: readonly Species[] = [
  { localName: 'Tulingan', englishName: 'Frigate tuna' },
  { localName: 'Galunggong', englishName: 'Round scad' },
  { localName: 'Lapu-lapu', englishName: 'Grouper' },
  { localName: 'Tanguige', englishName: 'Spanish mackerel' },
  { localName: 'Bangus', englishName: 'Milkfish' },
  { localName: 'Pusit', englishName: 'Squid' },
  { localName: 'Dalagang-bukid', englishName: 'Redbelly fusilier' },
  { localName: 'Maya-maya', englishName: 'Red snapper' },
  { localName: 'Talakitok', englishName: 'Trevally' },
  { localName: 'Danggit', englishName: 'Rabbitfish' },
];

export function getSpecies(localName: string): Species | undefined {
  return SPECIES.find((s) => s.localName === localName);
}
