import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme, type ColorScheme } from '@/theme';

import { AppText } from './AppText';

interface TextLinkProps {
  label: string;
  onPress: () => void;
  color?: keyof ColorScheme;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}

export function TextLink({ label, onPress, color = 'text', accessibilityHint, style }: TextLinkProps) {
  const { touchTarget, spacing } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      hitSlop={spacing.xs}
      style={({ pressed }) => [
        styles.base,
        { minHeight: touchTarget, minWidth: touchTarget, paddingHorizontal: spacing.xs },
        pressed && styles.pressed,
        style,
      ]}
    >
      <AppText variant="label" color={color} style={styles.underline}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { justifyContent: 'center', alignItems: 'center' },
  pressed: { opacity: 0.6 },
  underline: { textDecorationLine: 'underline' },
});
