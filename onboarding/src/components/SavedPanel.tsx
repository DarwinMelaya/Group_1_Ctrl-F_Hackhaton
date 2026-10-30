import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { colors, useTheme } from '@/theme';

import { AppText } from './AppText';
import { Banyera } from './EmptyState';

interface SavedPanelProps {
  title: string;
  body: string;
  art?: ReactNode;
  children?: ReactNode;
}

// The confirmation after a save: one small moment, then the next actions.
export function SavedPanel({ title, body, art = <CatchLanded />, children }: SavedPanelProps) {
  const { spacing } = useTheme();
  return (
    <Animated.View entering={FadeIn.duration(240)} style={[styles.panel, { gap: spacing.sm, paddingTop: spacing.xl }]}>
      {art}
      <AppText variant="title" align="center" accessibilityRole="header" accessibilityLiveRegion="polite">
        {title}
      </AppText>
      <AppText variant="body" color="textMuted" align="center">
        {body}
      </AppText>
      <View style={{ alignSelf: 'stretch', gap: spacing.xs, marginTop: spacing.md }}>{children}</View>
    </Animated.View>
  );
}

// A fish drops into the banyera with a small splash-bounce.
export function CatchLanded() {
  const reduce = useReducedMotion();
  const drop = useSharedValue(reduce ? 1 : 0);

  useEffect(() => {
    if (reduce) return;
    drop.value = withSequence(
      withTiming(1, { duration: 520, easing: Easing.in(Easing.quad) }),
      withTiming(0.9, { duration: 120 }),
      withTiming(1, { duration: 160, easing: Easing.out(Easing.quad) }),
    );
  }, [drop, reduce]);

  const fish = useAnimatedStyle(() => ({
    opacity: drop.value < 0.05 ? 0 : 1,
    transform: [{ translateY: -90 + drop.value * 90 }, { rotate: `${50 - drop.value * 62}deg` }],
  }));

  return (
    <View style={styles.art} accessible={false}>
      <Animated.View style={[styles.fish, fish]}>
        <Svg width={54} height={26} viewBox="104 10 50 22">
          <Path d="M118 22 C 128 12, 146 12, 152 20 C 146 28, 128 30, 118 22 Z" fill={colors.reef500} />
          <Path d="M118 22 L108 14 L110 22 L106 30 Z" fill={colors.reef500} />
        </Svg>
      </Animated.View>
      <Animated.View entering={reduce ? undefined : FadeIn.delay(520).duration(200)} style={[styles.drops]}>
        <Svg width={90} height={20} viewBox="0 0 90 20">
          <Path d="M14 16 L8 6 M30 12 L28 2 M60 12 L62 2 M76 16 L82 6" stroke={colors.reef300} strokeWidth={3} strokeLinecap="round" />
        </Svg>
      </Animated.View>
      <Banyera size={150} />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { alignItems: 'center' },
  art: { alignItems: 'center', justifyContent: 'flex-end', height: 150 },
  fish: { position: 'absolute', top: 40, zIndex: 2 },
  drops: { position: 'absolute', top: 44 },
});
