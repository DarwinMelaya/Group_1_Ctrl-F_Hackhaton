import { Pressable, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

import { usePressScale } from '@/hooks/usePressScale';
import { useTheme } from '@/theme';

import { AppText } from './AppText';

interface ChoiceChipProps {
  label: string;
  sublabel?: string;
  selected: boolean;
  onPress: () => void;
  // Grid tiles grow to fill half a row; inline chips size to their text.
  tile?: boolean;
}

export function ChoiceChip({ label, sublabel, selected, onPress, tile = false }: ChoiceChipProps) {
  const { colors, radii, spacing } = useTheme();
  const { animatedStyle, onPressIn, onPressOut } = usePressScale(0.96);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={sublabel ? `${label}, ${sublabel}` : label}
      style={tile ? styles.tileCell : undefined}
    >
      <Animated.View
        style={[
          styles.base,
          {
            borderRadius: radii.sm,
            paddingHorizontal: spacing.md,
            paddingVertical: tile ? spacing.sm : 10,
            backgroundColor: selected ? colors.selectedSoft : colors.surface,
            borderColor: selected ? colors.selected : colors.border,
            borderWidth: selected ? 2 : 1.5,
          },
          animatedStyle,
        ]}
      >
        <AppText variant="label" style={selected ? { color: colors.selected } : undefined}>
          {label}
        </AppText>
        {sublabel ? (
          <AppText variant="caption" color="textMuted" numberOfLines={1}>
            {sublabel}
          </AppText>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: 48, justifyContent: 'center' },
  tileCell: { flexBasis: '47%', flexGrow: 1 },
});
