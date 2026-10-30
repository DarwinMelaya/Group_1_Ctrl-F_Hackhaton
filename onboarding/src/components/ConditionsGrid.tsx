import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, ClipPath, Defs, Path, Polyline, Rect } from 'react-native-svg';

import type { CommunityIconName } from '@/constants/icons';
import { hourLabel } from '@/constants/weather';
import { compassFrom, seaStateOf, type SeaConditions, type SeaState } from '@/services/seaConditions';
import { colors as palette, useTheme, type Tone } from '@/theme';

import { AppText } from './AppText';

// "Today's conditions" under the Home scene: a swipeable row of readings and the sea tile. Every number
// comes from the live forecast; each reading has a small drawing that moves with its value.

const SEA: Record<SeaState, { label: string; advice: string; icon: CommunityIconName; tone: Tone }> = {
  calm: { label: 'Calm sea', advice: "It's a good day for small boats.", icon: 'check-circle-outline', tone: 'mangrove' },
  slight: { label: 'Small waves', advice: 'Fine for most bancas. Watch the wind.', icon: 'check-circle-outline', tone: 'mangrove' },
  moderate: { label: 'A bit rough', advice: 'Small boats: be careful and stay near shore.', icon: 'alert-circle-outline', tone: 'sea' },
  rough: { label: 'Rough sea', advice: 'Small boats should not go out.', icon: 'alert-octagon-outline', tone: 'coral' },
  veryRough: { label: 'Very rough sea', advice: 'Stay on shore. Small boats should not go out.', icon: 'alert-octagon-outline', tone: 'coral' },
};

// One line under "Today's conditions", in plain words.
export function conditionsSummary(d: SeaConditions): string {
  const sea = d.waveHeightM === null ? null : SEA[seaStateOf(d.waveHeightM)].label;
  const rain =
    (d.rainNowMm ?? 0) > 0
      ? 'Rain is falling now.'
      : d.rainStartsAt
        ? `Rain likely from about ${hourLabel(d.rainStartsAt)}.`
        : 'No rain expected in the next 12 hours.';
  const wind = (d.gustKmh ?? 0) >= 40 ? ' Strong gusts.' : '';
  return `${sea ? `${sea}. ` : ''}${rain}${wind}`;
}

interface Item {
  key: string;
  label: string;
  value: string;
  sub?: string;
  icon: CommunityIconName;
  tone: Tone;
  art: ReactNode;
}

function itemsOf(data: SeaConditions): Item[] {
  const items: Item[] = [
    {
      key: 'temp',
      label: 'Temperature',
      value: data.tempC === null ? '–' : `${Math.round(data.tempC)}°`,
      sub: data.feelsLikeC === null ? undefined : `Feels like ${Math.round(data.feelsLikeC)}°`,
      icon: 'white-balance-sunny',
      tone: 'coral',
      art: <TempLine temps={data.tempNext12h} />,
    },
    {
      key: 'humidity',
      label: 'Humidity',
      value: data.humidity === null ? '–' : `${Math.round(data.humidity)}%`,
      sub: data.dewPointC === null ? undefined : `Dew point ${Math.round(data.dewPointC)}°`,
      icon: 'water-outline',
      tone: 'sea',
      art: <Meter value={(data.humidity ?? 0) / 100} />,
    },
    {
      key: 'wind',
      label: 'Wind',
      value: data.windKmh === null ? '–' : `${Math.round(data.windKmh)} km/h`,
      sub: [data.windFromDeg === null ? null : `From ${compassFrom(data.windFromDeg)}`, data.gustKmh === null ? null : `gusts ${Math.round(data.gustKmh)}`].filter(Boolean).join(', ') || undefined,
      icon: 'weather-windy',
      tone: 'reef',
      art: <Turbine kmh={data.windKmh ?? 0} />,
    },
    {
      key: 'rain',
      label: 'Rain chance',
      value: data.rainChanceToday === null ? '–' : `${Math.round(data.rainChanceToday)}%`,
      sub: (data.rainNowMm ?? 0) > 0 ? 'Raining now' : data.rainStartsAt ? `From about ${hourLabel(data.rainStartsAt)}` : 'Not in the next 12 h',
      icon: 'weather-rainy',
      tone: 'sea',
      art: <Drop fill={(data.rainChanceToday ?? 0) / 100} />,
    },
  ];
  if (data.waveHeightM !== null) {
    const sea = SEA[seaStateOf(data.waveHeightM)];
    items.push({
      key: 'waves',
      label: 'Waves',
      value: `${data.waveHeightM.toFixed(1)} m`,
      sub: sea.label,
      icon: 'waves',
      tone: sea.tone,
      art: <MaterialCommunityIcons name={sea.icon} size={30} color={palette.sea700} />,
    });
  }
  return items;
}

const SLOT = 92; // width of one icon slot in the row
const ROW_H = 244;

// Today's conditions as a swipeable row of small icons. The one in the middle grows and shows its
// reading; the others shrink and fade. Scale and opacity follow the finger on the UI thread.
export const ConditionsGrid = memo(function ConditionsGrid({ data }: { data: SeaConditions }) {
  const { spacing } = useTheme();
  const items = useMemo(() => itemsOf(data), [data]);
  const [width, setWidth] = useState(0);
  const [focus, setFocus] = useState(0);
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const x = useSharedValue(0);
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const side = Math.max(0, (width - SLOT) / 2);

  const goTo = (i: number, animated = true) => {
    const clamped = Math.max(0, Math.min(items.length - 1, i));
    scrollRef.current?.scrollTo({ x: clamped * SLOT, animated });
    setFocus(clamped);
  };

  // Native snaps with snapToInterval; this also settles on the nearest item where it does not (web).
  const onSettle = (offset: number) => {
    if (settle.current) clearTimeout(settle.current);
    settle.current = setTimeout(() => goTo(Math.round(offset / SLOT)), 120);
  };
  const onScroll = useAnimatedScrollHandler((e) => {
    x.value = e.contentOffset.x;
    runOnJS(onSettle)(e.contentOffset.x);
  });
  useEffect(() => () => {
    if (settle.current) clearTimeout(settle.current);
  }, []);

  return (
    <View style={{ gap: spacing.xs }} onLayout={(e) => setWidth(Math.round(e.nativeEvent.layout.width))}>
      {width > 0 ? (
        <Animated.ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={SLOT}
          decelerationRate="fast"
          onScroll={onScroll}
          scrollEventThrottle={16}
          onScrollEndDrag={(e) => onSettle(e.nativeEvent.contentOffset.x)}
          onMomentumScrollEnd={(e) => {
            if (settle.current) clearTimeout(settle.current);
            setFocus(Math.round(e.nativeEvent.contentOffset.x / SLOT));
          }}
          contentContainerStyle={{ paddingHorizontal: side, height: ROW_H }}
          accessibilityRole="adjustable"
          accessibilityLabel={`${items[focus]?.label}: ${items[focus]?.value}${items[focus]?.sub ? `, ${items[focus]?.sub}` : ''}`}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(e) => goTo(focus + (e.nativeEvent.actionName === 'increment' ? 1 : -1))}
        >
          {items.map((item, i) => (
            <Slot key={item.key} item={item} index={i} x={x} onPress={() => goTo(i)} />
          ))}
        </Animated.ScrollView>
      ) : (
        <View style={{ height: ROW_H }} />
      )}
      <Dots count={items.length} x={x} />
      {data.waveHeightM !== null ? <SeaTile data={data} /> : null}
    </View>
  );
});

function Slot({ item, index, x, onPress }: { item: Item; index: number; x: SharedValue<number>; onPress: () => void }) {
  const { colors, tones, radii } = useTheme();
  const t = tones[item.tone];

  // 0 when this slot is in the middle, 1 or more as it moves away.
  const icon = useAnimatedStyle(() => {
    const d = Math.abs(x.value / SLOT - index);
    return {
      opacity: interpolate(d, [0, 1, 2], [1, 0.55, 0.35], Extrapolation.CLAMP),
      transform: [{ scale: interpolate(d, [0, 1], [1.5, 0.9], Extrapolation.CLAMP) }, { translateY: interpolate(d, [0, 1], [-8, 0], Extrapolation.CLAMP) }],
    };
  });
  const details = useAnimatedStyle(() => {
    const d = Math.abs(x.value / SLOT - index);
    return {
      opacity: interpolate(d, [0, 0.5], [1, 0], Extrapolation.CLAMP),
      transform: [{ translateY: interpolate(d, [0, 0.5], [0, -10], Extrapolation.CLAMP) }, { scale: interpolate(d, [0, 0.5], [1, 0.9], Extrapolation.CLAMP) }],
    };
  });

  return (
    <View style={[styles.slot, { width: SLOT }]}>
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={item.label} hitSlop={6}>
        <Animated.View style={[styles.iconBubble, { backgroundColor: t.bg, borderColor: colors.surface, borderRadius: 22 }, icon]}>
          <MaterialCommunityIcons name={item.icon} size={24} color={t.fg} />
        </Animated.View>
      </Pressable>
      {/* Above the icon row: wider than the slot, centered on it, so the reading has room. Hidden unless in the middle. */}
      <Animated.View pointerEvents="none" style={[styles.details, { borderRadius: radii.lg }, details]}>
        <AppText variant="caption" color="textMuted" align="center">
          {item.label}
        </AppText>
        <AppText variant="title" align="center" style={styles.tabular}>
          {item.value}
        </AppText>
        {item.sub ? (
          <AppText variant="caption" color="textMuted" align="center" numberOfLines={1}>
            {item.sub}
          </AppText>
        ) : null}
        <View style={styles.artBox}>{item.art}</View>
      </Animated.View>
    </View>
  );
}

// Position dots: the active one stretches as you swipe.
function Dots({ count, x }: { count: number; x: SharedValue<number> }) {
  return (
    <View style={styles.dots} accessible={false}>
      {Array.from({ length: count }, (_, i) => (
        <Dot key={i} index={i} x={x} />
      ))}
    </View>
  );
}

function Dot({ index, x }: { index: number; x: SharedValue<number> }) {
  const { colors } = useTheme();
  const style = useAnimatedStyle(() => {
    const d = Math.min(1, Math.abs(x.value / SLOT - index));
    return { width: interpolate(d, [0, 1], [20, 7]), opacity: interpolate(d, [0, 1], [1, 0.4]) };
  });
  return <Animated.View style={[styles.dot, { backgroundColor: colors.selected }, style]} />;
}

function SeaTile({ data }: { data: SeaConditions }) {
  const { colors, radii, spacing, tones } = useTheme();
  const s = SEA[seaStateOf(data.waveHeightM!)];
  const t = tones[s.tone];
  return (
    <View style={[styles.sea, { borderRadius: radii.lg, padding: spacing.md, gap: spacing.md, backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.seaBadge, { backgroundColor: t.bg, borderRadius: 14 }]}>
        <MaterialCommunityIcons name="waves" size={26} color={t.fg} />
      </View>
      <View style={styles.flex}>
        <View style={[styles.row, { gap: 6 }]}>
          <MaterialCommunityIcons name={s.icon} size={16} color={t.fg} />
          <AppText variant="label" style={{ color: t.fg }}>
            {s.label} · {data.waveHeightM!.toFixed(1)} m waves
          </AppText>
        </View>
        <AppText variant="caption">{s.advice}</AppText>
      </View>
    </View>
  );
}

// Temperature for the next 12 hours as a small line, like the sun's path.
function TempLine({ temps }: { temps: number[] }) {
  if (temps.length < 2) return null;
  const lo = Math.min(...temps);
  const hi = Math.max(...temps);
  const pts = temps.map((v, i) => `${(i / (temps.length - 1)) * 70 + 2},${30 - ((v - lo) / Math.max(1, hi - lo)) * 24}`).join(' ');
  return (
    <Svg width={74} height={34} viewBox="0 0 74 34">
      <Polyline points={pts} fill="none" stroke={palette.coral500} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={2} cy={Number(pts.split(' ')[0]!.split(',')[1])} r={3.5} fill={palette.coral500} />
    </Svg>
  );
}

// A thermometer-like bar that fills with humidity.
function Meter({ value }: { value: number }) {
  const v = Math.max(0, Math.min(1, value));
  return (
    <Svg width={16} height={40} viewBox="0 0 16 40">
      <Rect x={3} y={2} width={10} height={36} rx={5} fill={palette.sea100} />
      <Rect x={3} y={2 + 36 * (1 - v)} width={10} height={36 * v} rx={5} fill={palette.sea500} />
    </Svg>
  );
}

// A small wind turbine; the blades turn faster as the wind picks up. Still under reduced motion.
function Turbine({ kmh }: { kmh: number }) {
  const reduce = useReducedMotion();
  const spin = useSharedValue(0);
  const duration = Math.max(500, 6000 - kmh * 180);
  useEffect(() => {
    if (reduce || kmh < 1) return;
    spin.value = 0;
    spin.value = withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(spin);
  }, [spin, duration, reduce, kmh]);
  const blades = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value * 360}deg` }] }));
  return (
    <View style={styles.turbine}>
      <Svg width={40} height={44} viewBox="0 0 40 44" style={StyleSheet.absoluteFill}>
        <Path d="M19 20 L18 43 L22 43 L21 20 Z" fill={palette.sea700} />
      </Svg>
      <Animated.View style={[styles.blades, blades]}>
        <Svg width={40} height={40} viewBox="0 0 40 40">
          {[0, 120, 240].map((a) => (
            <Path key={a} d="M20 20 C 18 12, 19 4, 20 2 C 21 4, 22 12, 20 20 Z" fill={palette.sea900} transform={`rotate(${a} 20 20)`} />
          ))}
          <Circle cx={20} cy={20} r={2.5} fill={palette.sea900} />
        </Svg>
      </Animated.View>
    </View>
  );
}

// A raindrop that fills to the chance of rain.
function Drop({ fill }: { fill: number }) {
  const f = Math.max(0, Math.min(1, fill));
  const d = 'M16 2 C 16 2, 4 16, 4 25 A 12 12 0 0 0 28 25 C 28 16, 16 2, 16 2 Z';
  return (
    <Svg width={32} height={40} viewBox="0 0 32 40">
      <Defs>
        <ClipPath id="drop">
          <Path d={d} />
        </ClipPath>
      </Defs>
      <Path d={d} fill={palette.sea100} />
      <Rect x={0} y={2 + 36 * (1 - f)} width={32} height={40} fill={palette.reef500} clipPath="url(#drop)" />
      <Path d={d} fill="none" stroke={palette.sea500} strokeWidth={1.5} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  slot: { alignItems: 'center', justifyContent: 'flex-end', height: ROW_H, paddingBottom: 20 },
  iconBubble: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  details: { position: 'absolute', top: 4, width: 200, left: (SLOT - 200) / 2, alignItems: 'center', gap: 2 },
  artBox: { marginTop: 6, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  dots: { flexDirection: 'row', alignSelf: 'center', alignItems: 'center', gap: 6, marginBottom: 6 },
  dot: { height: 7, borderRadius: 4 },
  tabular: { fontVariant: ['tabular-nums'] },
  sea: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5 },
  seaBadge: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1, gap: 2 },
  turbine: { width: 40, height: 44 },
  blades: { position: 'absolute', left: 0, top: 0, width: 40, height: 40 },
});
