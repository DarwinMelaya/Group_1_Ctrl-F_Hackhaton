import { Children, type ReactNode } from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';

import { useLanguage } from '@/hooks/useLanguage';
import { toFil } from '@/i18n/fil';

import { maxFontScale, useTheme, type ColorScheme, type TextVariant } from '@/theme';

export interface AppTextProps extends TextProps {
  variant?: TextVariant;
  color?: keyof ColorScheme;
  align?: TextStyle['textAlign'];
}

export function AppText({
  variant = 'body',
  color = 'text',
  align,
  style,
  maxFontSizeMultiplier,
  children,
  ...rest
}: AppTextProps) {
  const theme = useTheme();
  const { lang } = useLanguage();
  // In Tagalog, plain text children are looked up in the dictionary (src/i18n/fil.ts).
  const text: ReactNode = lang === 'fil' ? Children.map(children, (c) => (typeof c === 'string' ? toFil(c) : c)) : children;
  return (
    <Text
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? maxFontScale[variant]}
      style={[theme.typography[variant], { color: theme.colors[color], textAlign: align }, style]}
      {...rest}
    >
      {text}
    </Text>
  );
}
