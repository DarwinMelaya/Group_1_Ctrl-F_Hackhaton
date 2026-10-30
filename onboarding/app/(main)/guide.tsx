import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming, cancelAnimation } from 'react-native-reanimated';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

import { AppText, ScreenContainer } from '@/components';
import { GUIDE_SECTIONS } from '@/constants/guide';
import { colors as palette, useTheme } from '@/theme';

export default function GuideScreen() {
  const { colors, spacing, radii, tones } = useTheme();
  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      <View style={{ gap: spacing.xs, marginTop: spacing.md, marginBottom: spacing.md }}>
        <AppText variant="title" accessibilityRole="header">
          Visit responsibly
        </AppText>
        <AppText variant="body" color="textMuted">
          {"A few habits that keep Marinduque's reefs, turtles and beaches alive for the next visitor."}
        </AppText>
      </View>

      <TurtleScene />

      <View style={{ gap: spacing.md, marginTop: spacing.md }}>
        {GUIDE_SECTIONS.map((s) => (
          <View key={s.title} style={[styles.card, { borderRadius: radii.lg, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.md, gap: spacing.sm }]}>
            <View style={[styles.row, { gap: spacing.sm }]}>
              <View style={[styles.badge, { backgroundColor: tones[s.tone].bg, borderRadius: radii.sm }]}>
                <MaterialCommunityIcons name={s.icon} size={22} color={tones[s.tone].fg} />
              </View>
              <AppText variant="heading" accessibilityRole="header">
                {s.title}
              </AppText>
            </View>
            {s.do.map((t) => (
              <Line key={t} kind="do" text={t} />
            ))}
            {s.dont.map((t) => (
              <Line key={t} kind="dont" text={t} />
            ))}
          </View>
        ))}
      </View>

      <View style={[styles.row, styles.top, { gap: spacing.sm, padding: spacing.md, borderRadius: radii.md, backgroundColor: tones.coral.bg, marginTop: spacing.lg }]}>
        <MaterialCommunityIcons name="bullhorn-outline" size={22} color={tones.coral.fg} />
        <View style={styles.flex}>
          <AppText variant="label">See something wrong?</AppText>
          <AppText variant="caption">
            Dynamite fishing, someone taking turtles, or a boat dumping trash: tell the nearest barangay hall, Bantay Dagat, or the municipal
            tourism office. Note the place and time, and keep a safe distance.
          </AppText>
        </View>
      </View>
    </ScreenContainer>
  );
}

// Do = check, Don't = cross: icon + word, never color alone.
function Line({ kind, text }: { kind: 'do' | 'dont'; text: string }) {
  const { spacing, tones } = useTheme();
  const tone = kind === 'do' ? tones.mangrove : tones.coral;
  return (
    <View style={[styles.row, styles.top, { gap: spacing.sm }]}>
      <MaterialCommunityIcons name={kind === 'do' ? 'check-circle-outline' : 'close-circle-outline'} size={20} color={tone.fg} style={styles.icon} />
      <AppText variant="body" style={styles.flex}>
        <AppText variant="bodyStrong" style={{ color: tone.fg }}>
          {kind === 'do' ? 'Do: ' : "Don't: "}
        </AppText>
        {text}
      </AppText>
    </View>
  );
}

// A pawikan gliding over a small reef. The turtle drifts; it holds still under reduced motion.
function TurtleScene() {
  const reduce = useReducedMotion();
  const t = useSharedValue(0);
  const { radii } = useTheme();

  useEffect(() => {
    if (reduce) return;
    t.value = withRepeat(withTiming(1, { duration: 4200, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => cancelAnimation(t);
  }, [t, reduce]);

  const swim = useAnimatedStyle(() => ({ transform: [{ translateX: -14 + t.value * 28 }, { translateY: -t.value * 5 }, { rotate: `${-4 + t.value * 6}deg` }] }));

  return (
    <View style={[styles.scene, { borderRadius: radii.lg, backgroundColor: palette.reef100 }]} accessible accessibilityRole="image" accessibilityLabel="Drawing of a sea turtle swimming over a coral reef">
      <Svg style={StyleSheet.absoluteFill} viewBox="0 0 360 150" preserveAspectRatio="xMidYMax slice">
        <Path d="M0 30 C 60 22, 120 38, 180 30 S 300 22, 360 30" stroke={palette.reef300} strokeWidth={2} fill="none" />
        <Path d="M0 150 L0 128 C 40 118, 80 132, 120 124 S 220 116, 260 126 S 330 120, 360 126 L360 150 Z" fill={palette.sand200} />
        {/* Coral: a fan, a branching piece and a brain coral, uneven on purpose. */}
        <Path d="M40 128 C 30 100, 40 90, 52 96 C 56 84, 74 88, 70 104 C 82 104, 80 120, 66 128 Z" fill={palette.coral300} />
        <Path d="M282 128 L282 100 M282 112 L270 96 M282 108 L296 92 M296 92 L300 84 M270 96 L264 88" stroke={palette.coral500} strokeWidth={5} strokeLinecap="round" />
        <Ellipse cx={200} cy={126} rx={22} ry={12} fill={palette.mangrove600} />
        <Path d="M184 124 C 192 118, 208 118, 216 124" stroke={palette.mangrove100} strokeWidth={1.5} fill="none" />
        <Circle cx={110} cy={60} r={2} fill={palette.white} />
        <Circle cx={116} cy={50} r={1.5} fill={palette.white} />
      </Svg>
      <Animated.View style={[styles.turtle, swim]}>
        <Svg width={110} height={70} viewBox="0 0 110 70">
          <Path d="M30 22 C 18 8, 8 10, 6 18 C 14 20, 22 24, 30 30 Z" fill={palette.mangrove600} />
          <Path d="M30 48 C 18 62, 8 60, 6 52 C 14 50, 22 46, 30 40 Z" fill={palette.mangrove600} />
          <Path d="M70 24 C 78 16, 86 16, 88 22 C 82 24, 76 26, 72 30 Z M70 46 C 78 54, 86 54, 88 48 C 82 46, 76 44, 72 40 Z" fill={palette.mangrove600} />
          <Ellipse cx={52} cy={35} rx={26} ry={18} fill={palette.mangrove700} />
          <Path d="M36 35 L68 35 M44 22 L44 48 M60 22 L60 48" stroke={palette.mangrove600} strokeWidth={2} />
          <Ellipse cx={86} cy={35} rx={11} ry={8} fill={palette.mangrove600} />
          <Circle cx={90} cy={32} r={1.6} fill={palette.sea900} />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1.5 },
  row: { flexDirection: 'row', alignItems: 'center' },
  top: { alignItems: 'flex-start' },
  flex: { flex: 1 },
  icon: { marginTop: 3 },
  badge: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  scene: { height: 150, overflow: 'hidden' },
  turtle: { position: 'absolute', left: '30%', top: 34 },
});
