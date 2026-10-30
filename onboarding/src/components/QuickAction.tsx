import { Pressable, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

import type { CommunityIconName } from '@/constants/icons';
import { usePressScale } from '@/hooks/usePressScale';
import { useTheme, type Tone } from '@/theme';

import { AppText } from './AppText';
import { IconBadge } from './IconBadge';

interface QuickActionProps {
  icon: CommunityIconName;
  tone: Tone;
  label: string;
  hint: string;
  onPress: () => void;
}

// Big, thumb-sized home shortcut: icon, a verb, and one line on what it does.
export function QuickAction({ icon, tone, label, hint, onPress }: QuickActionProps) {
  const { colors, radii, spacing } = useTheme();
  const { animatedStyle, onPressIn, onPressOut } = usePressScale(0.96);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      style={styles.cell}
    >
      {({ pressed }) => (
        <Animated.View
          style={[
            styles.tile,
            {
              borderRadius: radii.lg,
              padding: spacing.md,
              gap: spacing.sm,
              backgroundColor: pressed ? colors.surfaceMuted : colors.surface,
              borderColor: colors.border,
            },
            animatedStyle,
          ]}
        >
          <IconBadge icon={icon} tone={tone} size="sm" />
          <AppText variant="heading">{label}</AppText>
          <AppText variant="caption" color="textMuted" numberOfLines={2}>
            {hint}
          </AppText>
        </Animated.View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cell: { flexBasis: '47%', flexGrow: 1 },
  tile: { borderWidth: 1.5, minHeight: 132 },
});
