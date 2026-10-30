import { MaterialIcons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import type { MaterialIconName } from '@/constants/icons';
import { usePressScale } from '@/hooks/usePressScale';
import { useTheme } from '@/theme';

import { AppText } from './AppText';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  trailingIcon?: MaterialIconName;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  trailingIcon,
  disabled = false,
  loading = false,
  fullWidth = true,
  accessibilityHint,
  style,
}: ButtonProps) {
  const { colors, radii, spacing } = useTheme();
  const { animatedStyle, onPressIn, onPressOut } = usePressScale();
  const inactive = disabled || loading;

  const textColor =
    variant === 'primary' ? (inactive ? colors.disabledText : colors.textOnPrimary) : colors.text;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={[fullWidth ? styles.full : styles.auto, style]}
    >
      {({ pressed }) => (
        <Animated.View
          style={[
            styles.base,
            { borderRadius: radii.md, paddingHorizontal: spacing.lg, gap: spacing.xs },
            variant === 'primary' && {
              backgroundColor: inactive
                ? colors.disabled
                : pressed
                  ? colors.primaryPressed
                  : colors.primary,
            },
            variant === 'secondary' && {
              backgroundColor: pressed ? colors.surfaceMuted : colors.surface,
              borderWidth: 1.5,
              borderColor: colors.borderStrong,
            },
            variant === 'ghost' && {
              backgroundColor: pressed ? colors.surfaceMuted : 'transparent',
            },
            animatedStyle,
          ]}
        >
          {loading ? (
            <ActivityIndicator color={textColor} />
          ) : (
            <View style={styles.row}>
              <AppText variant="label" style={{ color: textColor }} numberOfLines={2} align="center">
                {label}
              </AppText>
              {trailingIcon ? (
                <MaterialIcons name={trailingIcon} size={22} color={textColor} />
              ) : null}
            </View>
          )}
        </Animated.View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  full: { alignSelf: 'stretch' },
  auto: { alignSelf: 'flex-start' },
  base: {
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12 },
});
