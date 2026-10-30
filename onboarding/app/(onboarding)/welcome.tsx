import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeInUp, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { AppText } from '@/components';
import { AppLogo } from '@/components/AppLogo';
import { INTRO_MS, IntroSplash } from '@/components/IntroSplash';
import { Boat, WaveBand } from '@/components/SeaScene';
import { APP_NAME } from '@/constants/app';
import { colors, useTheme } from '@/theme';

// First screen: a calm 2D ocean with an island on top that slowly fades into black below. A square
// card with the logo and the name sits where the sea darkens; a blue Get started button sits at the
// bottom. The opening (IntroSplash) plays once per app launch.

let introPlayed = false;

const INK = '#05090C'; // near-black for the lower half
const BLUE = '#1677E8';
const BLUE_PRESSED = '#0F5FBF';

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { radii, spacing } = useTheme();
  const reduce = useReducedMotion();
  const [intro, setIntro] = useState(() => !introPlayed && !reduce);

  const oceanH = Math.round(height * 0.62);
  const seaTop = oceanH * 0.46;

  // When the opening plays, the screen builds up as it lifts: card, then button.
  const start = intro ? INTRO_MS - 250 : 0;
  const ease = Easing.out(Easing.cubic);

  return (
    <View style={[styles.flex, { backgroundColor: INK }]}>
      <StatusBar style="dark" />

      {/* Ocean: sky, sun, a clear 2D island and a calm sea that fades into the black below. */}
      <View style={[styles.ocean, { height: oceanH }]} pointerEvents="none">
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#BFE3F2' }]} />
        <View style={[styles.abs, { left: 0, right: 0, top: seaTop - oceanH * 0.14, height: oceanH * 0.14, backgroundColor: '#DCEFF6' }]} />
        <Svg style={[styles.abs, { right: 28, top: insets.top + 30 }]} width={86} height={86} viewBox="0 0 86 86">
          <Circle cx={43} cy={43} r={41} fill={colors.coral100} />
          <Circle cx={43} cy={43} r={26} fill="#F6C453" />
        </Svg>
        <Island width={width} seaTop={seaTop} height={oceanH * 0.3} />
        <View style={[styles.abs, { left: 0, right: 0, top: seaTop, bottom: 0, backgroundColor: colors.reef300 }]} />
        {width > 0 ? (
          <>
            {/* Calm water: small, slow swells and a boat that barely rocks. */}
            <WaveBand width={width} bottom={oceanH - seaTop - 46} amp={2} duration={18000} color={colors.reef300} reduce={reduce} />
            <Boat sceneWidth={width} bottom={oceanH * 0.3} waveHeightM={0.05} reduce={reduce} />
            <WaveBand width={width} bottom={oceanH * 0.2} amp={3} duration={15000} color={colors.reef500} reduce={reduce} reverse />
            <WaveBand width={width} bottom={oceanH * 0.04} amp={3} duration={13000} color={colors.sea700} reduce={reduce} />
          </>
        ) : null}
        {/* The sea darkens little by little into the black lower half. */}
        <Svg style={[styles.abs, { left: 0, right: 0, bottom: 0 }]} width={width} height={oceanH * 0.55}>
          <Defs>
            <LinearGradient id="toBlack" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={INK} stopOpacity={0} />
              <Stop offset="0.55" stopColor={INK} stopOpacity={0.65} />
              <Stop offset="1" stopColor={INK} stopOpacity={1} />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={width} height={oceanH * 0.55} fill="url(#toBlack)" />
        </Svg>
      </View>

      <View style={[styles.flex, { paddingTop: oceanH - 170, paddingBottom: insets.bottom + spacing.lg, paddingHorizontal: spacing.lg }]}>
        <Animated.View entering={reduce ? undefined : ZoomIn.duration(520).delay(start).easing(ease)} style={styles.cardWrap}>
          {/* The icon is the card: the mark with the name inside it, nothing else. */}
          <View style={styles.card} accessible accessibilityRole="header" accessibilityLabel={APP_NAME}>
            <AppLogo size={200} withName />
          </View>
        </Animated.View>

        <Animated.View entering={reduce ? undefined : FadeIn.duration(500).delay(start + 220)} style={styles.tagline}>
          <AppText variant="body" align="center" style={{ color: colors.sea300 }}>
            Sea and weather, catch logs, reports and places, made for Marinduque.
          </AppText>
        </Animated.View>

        <View style={styles.flex} />

        <Animated.View entering={reduce ? undefined : FadeInUp.duration(520).delay(start + 360).easing(ease)} style={{ gap: spacing.xs }}>
          <BlueButton label="Get started" onPress={() => router.push('/language')} radius={radii.md} />
          <Pressable
            onPress={() => router.push({ pathname: '/login', params: { from: 'welcome' } })}
            accessibilityRole="link"
            accessibilityHint="Opens sign in"
            hitSlop={8}
            style={({ pressed }) => [styles.link, { opacity: pressed ? 0.6 : 1 }]}
          >
            <AppText variant="label" align="center" style={{ color: colors.sea100, textDecorationLine: 'underline' }}>
              I already have an account
            </AppText>
          </Pressable>
        </Animated.View>
      </View>

      {intro ? (
        <IntroSplash
          onDone={() => {
            introPlayed = true;
            setIntro(false);
          }}
        />
      ) : null}
    </View>
  );
}

// A flat 2D island on the horizon: sand, a green hill, two leaning palms and a small hut. Decorative.
function Island({ width, seaTop, height }: { width: number; seaTop: number; height: number }) {
  return (
    <Svg style={[styles.abs, { left: 0, top: seaTop - height + 6 }]} width={width} height={height} viewBox="0 0 360 120" preserveAspectRatio="xMidYMax meet">
      {/* Far islet */}
      <Path d="M250 118 C 266 98, 292 96, 310 118 Z" fill={colors.sea300} />
      {/* Sand and hill */}
      <Path d="M60 118 C 80 108, 200 106, 236 118 Z" fill="#EBD9B4" />
      <Path d="M78 114 C 96 70, 150 58, 196 82 C 210 90, 220 104, 226 114 Z" fill={colors.mangrove600} />
      <Path d="M118 92 C 136 76, 162 74, 180 86" stroke={colors.mangrove700} strokeWidth={3} strokeLinecap="round" fill="none" />
      {/* Hut */}
      <Path d="M186 112 L186 98 L204 98 L204 112 Z" fill="#B98A5A" />
      <Path d="M182 99 L195 88 L208 99 Z" fill="#8C5E36" />
      {/* Palms */}
      <Path d="M96 112 C 98 90, 104 72, 114 58" stroke={colors.sea900} strokeWidth={4} strokeLinecap="round" fill="none" />
      <Path d="M114 58 C 102 50, 90 52, 82 60 M114 58 C 124 48, 138 48, 146 56 M114 58 C 112 46, 118 38, 126 36 M114 58 C 104 60, 96 68, 94 76" stroke={colors.mangrove700} strokeWidth={6} strokeLinecap="round" fill="none" />
      <Path d="M220 114 C 222 98, 228 86, 236 78" stroke={colors.sea900} strokeWidth={3.5} strokeLinecap="round" fill="none" />
      <Path d="M236 78 C 226 70, 216 72, 210 78 M236 78 C 244 70, 256 70, 262 76 M236 78 C 234 86, 228 92, 226 96" stroke={colors.mangrove700} strokeWidth={5} strokeLinecap="round" fill="none" />
    </Svg>
  );
}

// The main action: a full-width blue button that dips a little when pressed.
function BlueButton({ label, onPress, radius }: { label: string; onPress: () => void; radius: number }) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => (scale.value = withTiming(0.97, { duration: 90 }))}
      onPressOut={() => (scale.value = withTiming(1, { duration: 140 }))}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {({ pressed }) => (
        <Animated.View style={[styles.blue, { borderRadius: radius, backgroundColor: pressed ? BLUE_PRESSED : BLUE }, style]}>
          <AppText variant="label" style={styles.blueText}>
            {label}
          </AppText>
          <MaterialIcons name="arrow-forward" size={22} color={colors.white} />
        </Animated.View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  abs: { position: 'absolute' },
  ocean: { position: 'absolute', left: 0, right: 0, top: 0, overflow: 'hidden' },
  cardWrap: { alignItems: 'center' },
  card: {
    borderRadius: 44,
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 14,
  },
  tagline: { marginTop: 20, paddingHorizontal: 12 },
  link: { minHeight: 48, justifyContent: 'center' },
  blue: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  blueText: { color: colors.white, fontSize: 17 },
});
