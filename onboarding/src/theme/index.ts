import { createContext, createElement, useContext, useMemo, type ReactNode } from 'react';

import {
  darkScheme,
  darkTones,
  lightScheme,
  lightTones,
  type ColorScheme,
  type Tone,
  type ToneColors,
} from './colors';
import { radii, spacing, touchTarget } from './spacing';
import { fonts, typography } from './typography';

export { colors, darkScheme, lightScheme } from './colors';
export type { ColorScheme, PaletteToken, Tone, ToneColors } from './colors';
export { fonts, maxFontScale, typography } from './typography';
export type { TextVariant } from './typography';
export { radii, spacing, touchTarget } from './spacing';

export type SchemeName = 'light' | 'dark';

export interface Theme {
  scheme: SchemeName;
  colors: ColorScheme;
  tones: Record<Tone, ToneColors>;
  spacing: typeof spacing;
  radii: typeof radii;
  fonts: typeof fonts;
  typography: typeof typography;
  touchTarget: number;
}

function buildTheme(scheme: SchemeName): Theme {
  return {
    scheme,
    colors: scheme === 'dark' ? darkScheme : lightScheme,
    tones: scheme === 'dark' ? darkTones : lightTones,
    spacing,
    radii,
    fonts,
    typography,
    touchTarget,
  };
}

const ThemeContext = createContext<Theme>(buildTheme('light'));

interface ThemeProviderProps {
  // Light only for now. Pass useColorScheme() here once dark mode is designed.
  scheme?: SchemeName;
  children: ReactNode;
}

export function ThemeProvider({ scheme = 'light', children }: ThemeProviderProps) {
  const theme = useMemo(() => buildTheme(scheme), [scheme]);
  return createElement(ThemeContext.Provider, { value: theme }, children);
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
