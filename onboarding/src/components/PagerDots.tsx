import { StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

import { useTheme } from '@/theme';

interface PagerDotsProps {
  count: number;
  activeIndex: number;
  // Fractional page position, e.g. 1.5 while halfway between slides 2 and 3.
  progress: SharedValue<number>;
}

export function PagerDots({ count, activeIndex, progress }: PagerDotsProps) {
  return (
    <View
      style={styles.row}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Slide ${activeIndex + 1} of ${count}`}
    >
      {Array.from({ length: count }, (_, i) => (
        <Dot key={i} index={i} progress={progress} />
      ))}
    </View>
  );
}

function Dot({ index, progress }: { index: number; progress: SharedValue<number> }) {
  const { colors } = useTheme();
  const inactive = colors.borderStrong;
  const active = colors.primary;

  const style = useAnimatedStyle(() => {
    const distance = Math.abs(progress.value - index);
    return {
      width: interpolate(distance, [0, 1], [28, 8], Extrapolation.CLAMP),
      backgroundColor: interpolateColor(Math.min(distance, 1), [0, 1], [active, inactive]),
    };
  });

  return <Animated.View style={[styles.dot, style]} />;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { height: 8, borderRadius: 4 },
});
