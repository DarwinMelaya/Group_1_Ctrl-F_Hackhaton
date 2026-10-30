import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import type { CommunityIconName } from '@/constants/icons';
import { usePressScale } from '@/hooks/usePressScale';
import { useTheme, type Tone } from '@/theme';

import { AppText } from './AppText';
import { IconBadge } from './IconBadge';

interface SelectCardProps {
  title: string;
  description?: string;
  icon?: CommunityIconName;
  tone?: Tone;
  selected: boolean;
  onPress: () => void;
  // Compact rows drop the icon and tighten padding, for longer lists.
  compact?: boolean;
}

export function SelectCard({
  title,
  description,
  icon,
  tone,
  selected,
  onPress,
  compact = false,
}: SelectCardProps) {
  const { colors, radii, spacing } = useTheme();
  const { animatedStyle, onPressIn, onPressOut } = usePressScale(0.98);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={description ? `${title}. ${description}` : title}
    >
      <Animated.View
        style={[
          styles.card,
          {
            borderRadius: compact ? radii.sm : radii.lg,
            paddingVertical: compact ? spacing.sm : spacing.md,
            paddingHorizontal: spacing.md,
            gap: spacing.md,
            backgroundColor: selected ? colors.selectedSoft : colors.surface,
            borderColor: selected ? colors.selected : colors.border,
            borderWidth: selected ? 2 : 1.5,
          },
          animatedStyle,
        ]}
      >
        {icon && !compact ? <IconBadge icon={icon} tone={tone} size="md" /> : null}
        <View style={styles.text}>
          <AppText variant={compact ? 'label' : 'heading'}>{title}</AppText>
          {description ? (
            <AppText variant="caption" color="textMuted">
              {description}
            </AppText>
          ) : null}
        </View>
        <View
          style={[
            styles.radio,
            {
              borderColor: selected ? colors.selected : colors.borderStrong,
              backgroundColor: selected ? colors.selected : 'transparent',
            },
          ]}
        >
          {selected ? <MaterialIcons name="check" size={16} color={colors.surface} /> : null}
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', minHeight: 56 },
  text: { flex: 1, gap: 2 },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
