import type { TextStyle } from 'react-native';

// Keys match the names registered with useFonts in app/_layout.tsx.
export const fonts = {
  serif: 'Fraunces_600SemiBold',
  serifItalic: 'Fraunces_400Regular_Italic',
  sans: 'PlusJakartaSans_400Regular',
  sansMedium: 'PlusJakartaSans_500Medium',
  sansSemiBold: 'PlusJakartaSans_600SemiBold',
  sansBold: 'PlusJakartaSans_700Bold',
} as const;

export type TextVariant =
  | 'hero'
  | 'display'
  | 'title'
  | 'heading'
  | 'body'
  | 'bodyStrong'
  | 'label'
  | 'caption'
  | 'eyebrow';

export const typography: Record<TextVariant, TextStyle> = {
  hero: { fontFamily: fonts.serif, fontSize: 60, lineHeight: 64, letterSpacing: -1.2 },
  display: { fontFamily: fonts.serif, fontSize: 40, lineHeight: 46, letterSpacing: -0.6 },
  title: { fontFamily: fonts.serif, fontSize: 30, lineHeight: 36, letterSpacing: -0.3 },
  heading: { fontFamily: fonts.sansBold, fontSize: 19, lineHeight: 26 },
  body: { fontFamily: fonts.sans, fontSize: 17, lineHeight: 26 },
  bodyStrong: { fontFamily: fonts.sansSemiBold, fontSize: 17, lineHeight: 26 },
  label: { fontFamily: fonts.sansSemiBold, fontSize: 16, lineHeight: 22 },
  caption: { fontFamily: fonts.sansMedium, fontSize: 15, lineHeight: 22 },
  eyebrow: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
};

// Large serif headings get capped so they don't overflow small screens at
// the biggest accessibility sizes; body text scales freely.
export const maxFontScale: Partial<Record<TextVariant, number>> = {
  hero: 1.2,
  display: 1.4,
  title: 1.5,
  eyebrow: 1.6,
};
