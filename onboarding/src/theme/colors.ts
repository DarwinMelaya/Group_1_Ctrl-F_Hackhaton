// Raw palette, drawn from Marinduque's coast. Screens should use the semantic
// scheme from useTheme(); reach for these only in illustrations.
export const colors = {
  sea950: '#081B26',
  sea900: '#0E2A3B',
  sea800: '#163A4E',
  sea700: '#1D4558',
  sea500: '#3C6E84',
  sea300: '#8FB2C2',
  sea100: '#E3ECF0',

  reef700: '#146A66',
  reef500: '#1F8A84',
  reef300: '#7CC2BA',
  reef100: '#D7ECE8',
  reef50: '#EAF5F2',

  sand50: '#FAF6EE',
  sand100: '#F3EBDD',
  sand200: '#E8DCC7',
  sand400: '#C9B48F',

  mangrove700: '#2F5329',
  mangrove600: '#3F6B3A',
  mangrove100: '#DFE8D5',

  coral700: '#A8441F',
  coral500: '#E2683C',
  coral300: '#F0A07F',
  coral100: '#FBE3D6',

  ink600: '#4A5F6B',
  ink400: '#7A8B94',
  white: '#FFFFFF',
} as const;

export type PaletteToken = keyof typeof colors;

// Accent families used by icon badges and illustrations.
export type Tone = 'sea' | 'reef' | 'mangrove' | 'coral';

export interface ToneColors {
  fg: string;
  bg: string;
}

export const lightTones: Record<Tone, ToneColors> = {
  sea: { fg: colors.sea800, bg: colors.sea100 },
  reef: { fg: colors.reef700, bg: colors.reef100 },
  mangrove: { fg: colors.mangrove700, bg: colors.mangrove100 },
  coral: { fg: colors.coral700, bg: colors.coral100 },
};

export const darkTones: Record<Tone, ToneColors> = {
  sea: { fg: colors.sea300, bg: colors.sea800 },
  reef: { fg: colors.reef300, bg: colors.sea800 },
  mangrove: { fg: colors.mangrove100, bg: colors.sea800 },
  coral: { fg: colors.coral300, bg: colors.sea800 },
};

export interface ColorScheme {
  background: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  textOnPrimary: string;
  primary: string;
  primaryPressed: string;
  accent: string;
  accentText: string;
  accentSoft: string;
  selected: string;
  selectedSoft: string;
  success: string;
  successSoft: string;
  disabled: string;
  disabledText: string;
}

export const lightScheme: ColorScheme = {
  background: colors.sand50,
  surface: colors.white,
  surfaceMuted: colors.sand100,
  border: colors.sand200,
  borderStrong: colors.sand400,
  text: colors.sea900,
  textMuted: colors.ink600,
  textOnPrimary: colors.sand50,
  primary: colors.sea900,
  primaryPressed: colors.sea700,
  accent: colors.coral500,
  accentText: colors.coral700,
  accentSoft: colors.coral100,
  selected: colors.reef700,
  selectedSoft: colors.reef50,
  success: colors.mangrove600,
  successSoft: colors.mangrove100,
  disabled: colors.sand200,
  disabledText: colors.ink600,
};

// Prepared for later; not wired to the system setting yet.
export const darkScheme: ColorScheme = {
  background: colors.sea950,
  surface: colors.sea900,
  surfaceMuted: colors.sea800,
  border: colors.sea700,
  borderStrong: colors.sea500,
  text: colors.sand50,
  textMuted: colors.sea300,
  textOnPrimary: colors.sea950,
  primary: colors.sand100,
  primaryPressed: colors.sand200,
  accent: colors.coral300,
  accentText: colors.coral300,
  accentSoft: colors.sea800,
  selected: colors.reef300,
  selectedSoft: colors.sea800,
  success: colors.mangrove100,
  successSoft: colors.sea800,
  disabled: colors.sea800,
  disabledText: colors.sea300,
};
