import { Text, type TextProps, type TextStyle } from 'react-native';

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
  ...rest
}: AppTextProps) {
  const theme = useTheme();
  return (
    <Text
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? maxFontScale[variant]}
      style={[theme.typography[variant], { color: theme.colors[color], textAlign: align }, style]}
      {...rest}
    />
  );
}
