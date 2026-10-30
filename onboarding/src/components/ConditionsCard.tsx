import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import type { CommunityIconName } from '@/constants/icons';
import { hourLabel, skyOf } from '@/constants/weather';
import type { SeaConditionsState } from '@/hooks/useSeaConditions';
import { compassFrom, seaStateOf, type SeaState } from '@/services/seaConditions';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme, type Tone } from '@/theme';

import { AppText } from './AppText';
import { Button } from './Button';

const STATE_INFO: Record<SeaState, { label: string; advice: string; icon: CommunityIconName; tone: Tone }> = {
  calm: {
    label: 'Calm sea',
    advice: 'Good conditions for small boats. Still check PAGASA before a long trip.',
    icon: 'check-circle-outline',
    tone: 'mangrove',
  },
  slight: {
    label: 'Slight sea',
    advice: 'Fine for most bancas. Keep an eye on the wind.',
    icon: 'check-circle-outline',
    tone: 'mangrove',
  },
  moderate: {
    label: 'Moderate sea',
    advice: 'Small boats: take extra care and stay close to shore.',
    icon: 'alert-circle-outline',
    tone: 'sea',
  },
  rough: {
    label: 'Rough sea',
    advice: 'Small boats are advised not to go out.',
    icon: 'alert-octagon-outline',
    tone: 'coral',
  },
  veryRough: {
    label: 'Very rough sea',
    advice: 'Stay ashore. Small boats are advised not to go out.',
    icon: 'alert-octagon-outline',
    tone: 'coral',
  },
};

const timeOf = (ms: number) =>
  new Date(ms).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' });

interface ConditionsCardProps {
  townName: string;
  state: SeaConditionsState;
  refreshing: boolean;
  onRetry: () => void;
}

export function ConditionsCard({ townName, state, refreshing, onRetry }: ConditionsCardProps) {
  const { colors, spacing, radii, tones } = useTheme();
  const frame = [styles.card, { borderRadius: radii.lg, padding: spacing.md, gap: spacing.md, backgroundColor: colors.surface, borderColor: colors.border }];

  if (state.status === 'loading') return <ConditionsSkeleton style={frame} />;

  if (state.status === 'error') {
    return (
      <View style={frame}>
        <View style={[styles.row, { gap: spacing.sm }]}>
          <MaterialCommunityIcons name="wifi-off" size={24} color={colors.textMuted} />
          <AppText variant="bodyStrong" style={styles.flex}>
            Sea conditions are unavailable
          </AppText>
        </View>
        <AppText variant="caption" color="textMuted">
          We need signal once to load them for {townName}. After that, the last reading stays on your phone.
        </AppText>
        <Button label="Try again" variant="secondary" loading={refreshing} onPress={onRetry} />
      </View>
    );
  }

  const { data, stale } = state;
  const info = data.waveHeightM === null ? null : STATE_INFO[seaStateOf(data.waveHeightM)];
  const tone = info ? tones[info.tone] : null;

  return (
    <View style={frame}>
      <View style={[styles.row, { gap: spacing.sm }]}>
        {info && tone ? (
          <View style={[styles.pill, { backgroundColor: tone.bg, borderRadius: radii.pill, paddingHorizontal: spacing.sm, gap: 6 }]}>
            <MaterialCommunityIcons name={info.icon} size={18} color={tone.fg} />
            <AppText variant="label" style={{ color: tone.fg }}>
              {info.label}
            </AppText>
          </View>
        ) : (
          <AppText variant="label" color="textMuted">
            No wave reading here
          </AppText>
        )}
        <AppText variant="caption" color="textMuted" style={styles.flex} align="right">
          off {townName}
        </AppText>
      </View>

      {info ? <AppText variant="body">{info.advice}</AppText> : null}

      <SkyLine data={data} />

      <View style={[styles.stats, { gap: spacing.xs }]}>
        <Stat icon="waves" label="Waves" value={data.waveHeightM === null ? '–' : `${data.waveHeightM.toFixed(1)} m`} />
        <Stat
          icon="weather-windy"
          label="Wind"
          value={data.windKmh === null ? '–' : `${Math.round(data.windKmh)} km/h${data.windFromDeg === null ? '' : ` ${compassFrom(data.windFromDeg)}`}`}
          sub={data.gustKmh === null ? undefined : `gusts ${Math.round(data.gustKmh)}`}
        />
        <Stat
          icon="weather-rainy"
          label="Rain today"
          value={data.rainChanceToday === null ? '–' : `${Math.round(data.rainChanceToday)}%`}
          sub={data.rainTodayMm === null ? undefined : data.rainTodayMm < 0.1 ? 'none expected' : `about ${data.rainTodayMm.toFixed(1)} mm`}
        />
      </View>

      <View style={[styles.row, { gap: 6 }]}>
        <MaterialCommunityIcons name={stale ? 'wifi-off' : 'refresh'} size={16} color={colors.textMuted} />
        <AppText variant="caption" color="textMuted" style={styles.flex}>
          {stale ? `No signal · reading from ${timeOf(data.fetchedAt)}` : `Updated ${timeOf(data.fetchedAt)}`}
          {data.sunrise ? ` · Sunrise ${data.sunrise}, sunset ${data.sunset ?? '–'}` : ''} · Forecast: Open-Meteo
        </AppText>
      </View>
    </View>
  );
}

// "Light drizzle now · 30°C" and, when rain is likely, when it starts. Icon + words, never color alone.
function SkyLine({ data }: { data: Extract<SeaConditionsState, { status: 'ready' }>['data'] }) {
  const { colors, spacing, radii, tones } = useTheme();
  const { lang } = useLanguage();
  if (data.weatherCode === undefined) return null; // a reading saved before sky data existed
  const sky = skyOf(data.weatherCode, data.isDay);
  const raining = sky.rainy || (data.rainNowMm ?? 0) > 0;

  let outlook: string;
  if (raining) outlook = 'Bring rain gear and keep your catch and phone dry.';
  else if (data.rainStartsAt) outlook = `Rain likely from about ${hourLabel(data.rainStartsAt)}${data.rainChanceNext12h === null ? '' : ` (up to ${Math.round(data.rainChanceNext12h)}% chance)`}.`;
  else if ((data.rainChanceNext12h ?? 0) >= 20) outlook = `Small chance of rain in the next 12 hours (up to ${Math.round(data.rainChanceNext12h!)}%).`;
  else outlook = 'No rain expected in the next 12 hours.';

  const wet = raining || !!data.rainStartsAt;
  const tone = wet ? tones.sea : tones.mangrove;
  return (
    <View style={[styles.sky, { gap: spacing.sm, padding: spacing.sm, borderRadius: radii.sm, backgroundColor: tone.bg }]}>
      <MaterialCommunityIcons name={sky.icon} size={28} color={tone.fg} />
      <View style={styles.flex}>
        <AppText variant="label" style={{ color: colors.text }}>
          {lang === 'fil' ? (raining ? `${sky.tl} ngayon` : sky.tl) : raining ? `${sky.en} now` : sky.en}
          {data.tempC === null ? '' : ` · ${Math.round(data.tempC)}°C`}
        </AppText>
        <AppText variant="caption" color="textMuted">
          {outlook}
        </AppText>
      </View>
    </View>
  );
}

function Stat({ icon, label, value, sub }: { icon: CommunityIconName; label: string; value: string; sub?: string }) {
  const { colors, radii, spacing } = useTheme();
  return (
    <View
      style={[styles.stat, { borderRadius: radii.sm, padding: spacing.sm, backgroundColor: colors.surfaceMuted, gap: 2 }]}
      accessible
      accessibilityLabel={`${label}: ${value}${sub ? `, ${sub}` : ''}`}
    >
      <MaterialCommunityIcons name={icon} size={20} color={colors.textMuted} />
      <AppText variant="caption" color="textMuted">
        {label}
      </AppText>
      <AppText variant="label" style={styles.tabular}>
        {value}
      </AppText>
      {sub ? (
        <AppText variant="caption" color="textMuted" style={[styles.tabular, styles.small]}>
          {sub}
        </AppText>
      ) : null}
    </View>
  );
}

function ConditionsSkeleton({ style }: { style: object[] }) {
  const { colors, radii } = useTheme();
  const reduce = useReducedMotion();
  const pulse = useSharedValue(0.55);

  useEffect(() => {
    if (reduce) return;
    pulse.value = withRepeat(withTiming(1, { duration: 700 }), -1, true);
    return () => cancelAnimation(pulse);
  }, [pulse, reduce]);

  const anim = useAnimatedStyle(() => ({ opacity: pulse.value }));
  const block = (w: number | `${number}%`, h: number) => ({ width: w, height: h, borderRadius: radii.sm, backgroundColor: colors.surfaceMuted });

  return (
    <Animated.View style={[...style, anim]} accessible accessibilityLabel="Loading sea conditions" accessibilityRole="progressbar">
      <View style={block(130, 28)} />
      <View style={block('90%', 18)} />
      <View style={[styles.stats, { gap: 8 }]}>
        <View style={[styles.stat, block('30%', 84)]} />
        <View style={[styles.stat, block('30%', 84)]} />
        <View style={[styles.stat, block('30%', 84)]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1.5 },
  row: { flexDirection: 'row', alignItems: 'center' },
  pill: { flexDirection: 'row', alignItems: 'center', minHeight: 32 },
  flex: { flex: 1 },
  stats: { flexDirection: 'row' },
  sky: { flexDirection: 'row', alignItems: 'center' },
  stat: { flex: 1 },
  tabular: { fontVariant: ['tabular-nums'] },
  small: { fontSize: 13, lineHeight: 18 },
});
