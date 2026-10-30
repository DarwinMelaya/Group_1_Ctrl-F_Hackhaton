import { useCallback } from 'react';
import {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

// A small press-down for tappable surfaces. Skipped when the user has
// asked the system to reduce motion.
export function usePressScale(pressedScale = 0.97) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = useCallback(() => {
    if (reduceMotion) return;
    scale.value = withTiming(pressedScale, { duration: 90 });
  }, [reduceMotion, pressedScale, scale]);

  const onPressOut = useCallback(() => {
    scale.value = withTiming(1, { duration: 160 });
  }, [scale]);

  return { animatedStyle, onPressIn, onPressOut };
}
