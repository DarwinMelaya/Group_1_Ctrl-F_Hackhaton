import { useEffect } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import { APP_NAME } from '@/constants/app';
import { colors, useTheme } from '@/theme';

import { AppText } from './AppText';

// The opening moment: night-blue sea, a sun coming up, the name, then the whole thing lifts away like a
// curtain to show the welcome screen. About 1.5 s; a tap skips it. Transform and opacity only.

export const INTRO_MS = 1500;
const LIFT_MS = 550;

const WAVE = (top: number, amp: number) =>
  `M0 ${top} C 30 ${top - amp}, 60 ${top - amp}, 90 ${top} S 150 ${top + amp}, 180 ${top} S 240 ${top - amp}, 270 ${top} S 330 ${top + amp}, 360 ${top} L360 60 L0 60 Z`;

export function IntroSplash({ onDone }: { onDone: () => void }) {
  const { height, width } = useWindowDimensions();
  const { fonts } = useTheme();
  const sun = useSharedValue(0);
  const title = useSharedValue(0);
  const sub = useSharedValue(0);
  const drift = useSharedValue(0);
  const lift = useSharedValue(0);

  const finish = () => {
    lift.value = withTiming(1, { duration: LIFT_MS, easing: Easing.inOut(Easing.cubic) }, (ok) => {
      if (ok) runOnJS(onDone)();
    });
  };

  useEffect(() => {
    const out = Easing.out(Easing.cubic);
    sun.value = withTiming(1, { duration: 700, easing: out });
    title.value = withDelay(250, withTiming(1, { duration: 550, easing: out }));
    sub.value = withDelay(550, withTiming(1, { duration: 450, easing: out }));
    drift.value = withRepeat(withTiming(1, { duration: 3000, easing: Easing.linear }), -1, false);
    const id = setTimeout(finish, INTRO_MS - LIFT_MS);
    return () => {
      clearTimeout(id);
      [sun, title, sub, drift, lift].forEach(cancelAnimation);
    };
    // Runs once on mount.
  }, []);

  const curtain = useAnimatedStyle(() => ({ transform: [{ translateY: -lift.value * height }] }));
  const sunStyle = useAnimatedStyle(() => ({ opacity: sun.value, transform: [{ translateY: (1 - sun.value) * 70 }, { scale: 0.85 + sun.value * 0.15 }] }));
  const titleStyle = useAnimatedStyle(() => ({ opacity: title.value, transform: [{ translateY: (1 - title.value) * 14 }, { scale: 0.94 + title.value * 0.06 }] }));
  const subStyle = useAnimatedStyle(() => ({ opacity: sub.value, transform: [{ translateY: (1 - sub.value) * 8 }] }));
  const back = useAnimatedStyle(() => ({ transform: [{ translateX: -drift.value * width }] }));
  const front = useAnimatedStyle(() => ({ transform: [{ translateX: -width + drift.value * width }] }));

  const waveRow = (fill: string, top: number, amp: number) => (
    <>
      {[0, 1].map((i) => (
        <Svg key={i} width={width} height={60} viewBox="0 0 360 60" preserveAspectRatio="none">
          <Path d={WAVE(top, amp)} fill={fill} />
        </Svg>
      ))}
    </>
  );

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.curtain, curtain]} accessibilityLabel={`${APP_NAME}, opening`}>
      <Pressable style={StyleSheet.absoluteFill} onPress={finish} accessibilityRole="button" accessibilityHint="Skips the opening">
        <View style={styles.center}>
          <Animated.View style={sunStyle}>
            <Svg width={120} height={120} viewBox="0 0 120 120">
              <Circle cx={60} cy={60} r={52} fill={colors.coral500} fillOpacity={0.18} />
              <Circle cx={60} cy={60} r={34} fill={colors.coral300} />
            </Svg>
          </Animated.View>
          <Animated.View style={titleStyle}>
            <AppText variant="hero" style={{ color: colors.sand50, fontFamily: fonts.display }} align="center">
              {APP_NAME}
            </AppText>
          </Animated.View>
          <Animated.View style={subStyle}>
            <AppText variant="body" style={{ color: colors.sea300, fontFamily: fonts.italic }} align="center">
              for the seas of Marinduque
            </AppText>
          </Animated.View>
        </View>

        <View style={styles.sea} pointerEvents="none">
          <Animated.View style={[styles.row, { width: width * 2, bottom: 40 }, back]}>{waveRow(colors.sea800, 26, 8)}</Animated.View>
          <Animated.View style={[styles.row, { width: width * 2, bottom: 0 }, front]}>{waveRow(colors.sea700, 30, 10)}</Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  curtain: { backgroundColor: colors.sea950, zIndex: 100, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, overflow: 'hidden' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, paddingBottom: 80 },
  sea: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 120 },
  row: { position: 'absolute', left: 0, flexDirection: 'row' },
});
