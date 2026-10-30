import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import { AppText, Button, ChoiceChip, EmptyState, IconBadge, ScreenContainer, TextField, timeOfDay } from '@/components';
import type { CommunityIconName } from '@/constants/icons';
import { getMunicipality } from '@/constants/municipalities';
import { useOnboarding } from '@/hooks/useOnboarding';
import { newUuid } from '@/storage/records';
import { useLocalList } from '@/storage/localList';
import { colors as palette, fonts, type Tone, useTheme } from '@/theme';

const OUTCOMES = ['clear', 'checked', 'suspicious'] as const;
type Outcome = (typeof OUTCOMES)[number];

const OUTCOME_LOOK: Record<Outcome, { label: string; icon: CommunityIconName; tone: Tone }> = {
  clear: { label: 'All clear', icon: 'check-circle-outline', tone: 'mangrove' },
  checked: { label: 'Boats checked', icon: 'clipboard-check-outline', tone: 'sea' },
  suspicious: { label: 'Something suspicious', icon: 'alert-circle-outline', tone: 'coral' },
};

interface Patrol {
  id: string;
  area: string;
  startedAt: string;
  endedAt: string | null;
  outcome: Outcome | null;
  notes: string;
}

function parsePatrol(v: unknown): Patrol | null {
  if (typeof v !== 'object' || v === null) return null;
  const p = v as Record<string, unknown>;
  if (typeof p.id !== 'string' || typeof p.area !== 'string' || typeof p.startedAt !== 'string') return null;
  return {
    id: p.id,
    area: p.area,
    startedAt: p.startedAt,
    endedAt: typeof p.endedAt === 'string' ? p.endedAt : null,
    outcome: OUTCOMES.includes(p.outcome as Outcome) ? (p.outcome as Outcome) : null,
    notes: typeof p.notes === 'string' ? p.notes : '',
  };
}

const duration = (from: string, to: string | null) => {
  const mins = Math.max(0, Math.round(((to ? new Date(to) : new Date()).getTime() - new Date(from).getTime()) / 60_000));
  return mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)} h ${mins % 60} min`;
};

export default function PatrolsScreen() {
  const router = useRouter();
  const { colors, spacing, radii } = useTheme();
  const { state } = useOnboarding();
  const { items: patrols, isLoaded, update } = useLocalList('patrols/v1', parsePatrol);
  const town = state.municipality ? getMunicipality(state.municipality)?.name : undefined;
  const [area, setArea] = useState('');
  const [outcome, setOutcome] = useState<Outcome>('clear');
  const [notes, setNotes] = useState('');
  const [, tick] = useState(0);

  const active = patrols.find((p) => !p.endedAt);
  const past = patrols.filter((p) => p.endedAt);

  // Keep the running time fresh while a patrol is on.
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => tick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, [active]);

  const start = () =>
    update((list) => [
      { id: newUuid(), area: area.trim() || (town ? `${town} municipal waters` : 'Municipal waters'), startedAt: new Date().toISOString(), endedAt: null, outcome: null, notes: '' },
      ...list,
    ]).then(() => setArea(''));

  const end = async () => {
    if (!active) return;
    await update((list) => list.map((p) => (p.id === active.id ? { ...p, endedAt: new Date().toISOString(), outcome, notes: notes.trim() } : p)));
    setNotes('');
    if (outcome === 'suspicious') router.push('/report');
    setOutcome('clear');
  };

  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      <View style={{ gap: spacing.xs, marginTop: spacing.md, marginBottom: spacing.lg }}>
        <AppText variant="title" accessibilityRole="header">
          Patrols
        </AppText>
        <AppText variant="body" color="textMuted">
          Keep a simple log of each patrol: where, how long, and what you found.
        </AppText>
      </View>

      {!isLoaded ? null : active ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          style={[styles.card, { borderRadius: radii.lg, borderColor: colors.selected, borderWidth: 2, backgroundColor: colors.surface, padding: spacing.md, gap: spacing.md }]}
        >
          <PatrolRoute />
          <View>
            <AppText variant="caption" style={{ color: colors.selected, fontFamily: fonts.sansBold }}>
              ON PATROL · since {timeOfDay(active.startedAt)}
            </AppText>
            <AppText variant="title" style={styles.tabular}>
              {duration(active.startedAt, null)}
            </AppText>
            <AppText variant="caption" color="textMuted">
              {active.area}
            </AppText>
          </View>
          <View style={{ gap: spacing.xs }}>
            <AppText variant="label">How did it go?</AppText>
            <View style={[styles.wrap, { gap: spacing.xs }]} accessibilityRole="radiogroup">
              {OUTCOMES.map((o) => (
                <ChoiceChip key={o} label={OUTCOME_LOOK[o].label} selected={outcome === o} onPress={() => setOutcome(o)} />
              ))}
            </View>
          </View>
          <TextField label="Notes (optional)" placeholder="Boats seen, places checked" value={notes} onChangeText={setNotes} multiline maxLength={500} />
          <Button label={outcome === 'suspicious' ? 'End patrol and file a report' : 'End patrol'} trailingIcon="flag" onPress={end} />
        </Animated.View>
      ) : (
        <View style={[styles.card, { borderRadius: radii.lg, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.md, gap: spacing.md }]}>
          <TextField label="Area" placeholder={town ? `${town} municipal waters` : 'e.g. Gaspar Island reef'} value={area} onChangeText={setArea} maxLength={60} />
          <Button label="Start patrol" trailingIcon="play-arrow" onPress={start} />
        </View>
      )}

      <View style={{ marginTop: spacing.xl, gap: spacing.xs }}>
        <AppText variant="eyebrow" color="textMuted" accessibilityRole="header">
          Past patrols
        </AppText>
        {past.length === 0 ? (
          <EmptyState art={<IconBadge icon="shield-search" tone="sea" size="lg" />} title="No patrols logged yet" body="Finished patrols show here, newest first." />
        ) : (
          <View style={[styles.card, { borderRadius: radii.lg, borderColor: colors.border, backgroundColor: colors.surface }]}>
            {past.slice(0, 20).map((p, i) => {
              const look = p.outcome ? OUTCOME_LOOK[p.outcome] : OUTCOME_LOOK.clear;
              return (
                <View
                  key={p.id}
                  style={[styles.row, { gap: spacing.sm, padding: spacing.md, borderTopWidth: i === 0 ? 0 : StyleSheet.hairlineWidth, borderTopColor: colors.borderStrong }]}
                >
                  <MaterialCommunityIcons name={look.icon} size={22} color={colors.textMuted} />
                  <View style={styles.flex}>
                    <AppText variant="label">{p.area}</AppText>
                    <AppText variant="caption" color="textMuted">
                      {new Date(p.startedAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}, {timeOfDay(p.startedAt)} · {duration(p.startedAt, p.endedAt)} ·{' '}
                      {look.label}
                    </AppText>
                    {p.notes ? (
                      <AppText variant="caption" numberOfLines={2}>
                        {p.notes}
                      </AppText>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      <AppText variant="caption" color="textMuted" style={{ marginTop: spacing.md }}>
        Saved on this phone only. Patrol logs are not sent to the MAO yet; use Report for anything they should act on.
      </AppText>
    </ScreenContainer>
  );
}

// A dotted patrol loop around a small island, with the banca partway along. Decorative.
function PatrolRoute() {
  return (
    <Svg width="100%" height={70} viewBox="0 0 320 70" preserveAspectRatio="xMidYMid meet">
      <Path d="M0 60 L320 60" stroke={palette.reef300} strokeWidth={2} />
      <Path d="M130 52 C 140 30, 175 26, 190 52 Z" fill={palette.mangrove600} />
      <Path d="M150 34 l 2 -10 m 4 12 l 3 -9" stroke={palette.mangrove700} strokeWidth={2} strokeLinecap="round" />
      <Path d="M60 50 C 80 10, 240 6, 262 46 C 250 64, 80 66, 60 50 Z" fill="none" stroke={palette.sea500} strokeWidth={2} strokeDasharray="5 6" />
      <Circle cx={60} cy={50} r={4} fill={palette.sea700} />
      <Path d="M238 30 l0 -14 M240 17 l0 12 l9 -1 Z" stroke={palette.sea900} strokeWidth={2} fill={palette.coral500} />
      <Path d="M226 31 C 234 36, 248 36, 256 30 C 252 36, 244 38, 240 38 C 234 38, 228 36, 226 31 Z" fill={palette.sea900} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1.5, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  flex: { flex: 1 },
  tabular: { fontVariant: ['tabular-nums'] },
});
