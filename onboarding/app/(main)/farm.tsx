import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';

import { AppText, Button, ChoiceChip, EmptyState, kg, ScreenContainer, TextField, TextLink } from '@/components';
import { SeaweedGrowth } from '@/components/SeaweedGrowth';
import { CROPS, cycleStage, daysSince, getCrop, parsePlot, type CropId, type FarmPlot } from '@/constants/aquaculture';
import { newUuid } from '@/storage/records';
import { useLocalList } from '@/storage/localList';
import { useTheme } from '@/theme';

const PLANTED = [
  { label: 'Today', days: 0 },
  { label: '1 week ago', days: 7 },
  { label: '2 weeks ago', days: 14 },
  { label: '1 month ago', days: 30 },
  { label: '45 days ago', days: 45 },
] as const;

const num = (s: string) => {
  const n = Number.parseFloat(s.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

export default function FarmScreen() {
  const { spacing } = useTheme();
  const { items: plots, isLoaded, update } = useLocalList('farm/v1', parsePlot);
  const [adding, setAdding] = useState(false);

  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      <View style={{ gap: spacing.xs, marginTop: spacing.md, marginBottom: spacing.lg }}>
        <AppText variant="title" accessibilityRole="header">
          My farm
        </AppText>
        <AppText variant="body" color="textMuted">
          Your seaweed lines and cages, how long since planting, and what you harvested.
        </AppText>
      </View>

      {!isLoaded ? null : plots.length === 0 && !adding ? (
        <EmptyState
          art={<SeaweedGrowth progress={0.6} width={150} />}
          title="No lines or cages yet"
          body="Add your first one. It takes a few seconds and works without signal."
          action={<Button label="Add a line or cage" trailingIcon="add" onPress={() => setAdding(true)} />}
        />
      ) : (
        <View style={{ gap: spacing.md }}>
          {plots.map((p) => (
            <PlotCard
              key={p.id}
              plot={p}
              onHarvest={(wetKg, replant) =>
                update((list) =>
                  list.map((x) =>
                    x.id === p.id
                      ? {
                          ...x,
                          harvests: [{ at: new Date().toISOString(), wetKg }, ...x.harvests],
                          plantedAt: replant ? new Date().toISOString() : x.plantedAt,
                        }
                      : x,
                  ),
                )
              }
              onRemove={() => update((list) => list.filter((x) => x.id !== p.id))}
            />
          ))}
          {adding ? (
            <AddPlot
              onCancel={() => setAdding(false)}
              onAdd={async (plot) => {
                await update((list) => [plot, ...list]);
                setAdding(false);
              }}
            />
          ) : (
            <Button label="Add a line or cage" variant="secondary" trailingIcon="add" onPress={() => setAdding(true)} />
          )}
        </View>
      )}

      <IceIceTip />

      <AppText variant="caption" color="textMuted" style={{ marginTop: spacing.md }}>
        Saved on this phone only. Farm records are not sent to the MAO yet.
      </AppText>
    </ScreenContainer>
  );
}

function PlotCard({ plot, onHarvest, onRemove }: { plot: FarmPlot; onHarvest: (wetKg: number, replant: boolean) => Promise<void>; onRemove: () => void }) {
  const { colors, spacing, radii, tones } = useTheme();
  const crop = getCrop(plot.crop);
  const stage = cycleStage(plot);
  const [mode, setMode] = useState<'view' | 'harvest' | 'remove'>('view');
  const [wet, setWet] = useState('');
  const [error, setError] = useState<string | null>(null);
  const total = plot.harvests.reduce((s, h) => s + h.wetKg, 0);

  const save = async (replant: boolean) => {
    const w = num(wet);
    if (w === null || w <= 0) {
      setError('Enter the wet weight in kilos.');
      return;
    }
    await onHarvest(Math.round(w * 10) / 10, replant);
    setWet('');
    setError(null);
    setMode('view');
  };

  return (
    <Animated.View
      layout={LinearTransition.duration(180)}
      style={[styles.card, { borderRadius: radii.lg, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.md, gap: spacing.sm }]}
    >
      <View style={[styles.row, { gap: spacing.md }]}>
        <View style={styles.flex}>
          <AppText variant="heading">{plot.name}</AppText>
          <AppText variant="caption" color="textMuted">
            {crop.name} · {plot.units} {crop.unit}
          </AppText>
          <AppText variant="title" style={[styles.tabular, { marginTop: spacing.xs }]}>
            Day {daysSince(plot.plantedAt)}
          </AppText>
          <AppText variant="caption" color="textMuted">
            since planting
          </AppText>
        </View>
        {crop.cycleDays ? <SeaweedGrowth progress={stage?.progress ?? 0} /> : <MaterialCommunityIcons name={crop.icon} size={44} color={colors.selected} />}
      </View>

      {stage ? (
        <View style={[styles.row, styles.pill, { gap: 6, borderRadius: radii.sm, backgroundColor: tones[stage.tone].bg, padding: spacing.xs }]}>
          <MaterialCommunityIcons name={stage.icon} size={18} color={tones[stage.tone].fg} />
          <AppText variant="caption" style={{ color: tones[stage.tone].fg, flex: 1 }}>
            {stage.label}
          </AppText>
        </View>
      ) : null}

      {plot.harvests.length > 0 ? (
        <AppText variant="caption" color="textMuted">
          {plot.harvests.length} {plot.harvests.length === 1 ? 'harvest' : 'harvests'}, {kg(total)} wet in all · last{' '}
          {new Date(plot.harvests[0]!.at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}, {kg(plot.harvests[0]!.wetKg)}
        </AppText>
      ) : null}

      {mode === 'harvest' ? (
        <Animated.View entering={FadeIn.duration(160)} style={{ gap: spacing.sm }}>
          <TextField label="Wet weight harvested (kg)" keyboardType="decimal-pad" value={wet} onChangeText={(t) => setWet(t.replace(/[^0-9.,]/g, ''))} maxLength={7} />
          {error ? (
            <AppText variant="caption" color="accentText">
              {error}
            </AppText>
          ) : null}
          <Button label="Save and replant" onPress={() => save(true)} />
          <Button label="Save, not replanting yet" variant="secondary" onPress={() => save(false)} />
          <TextLink label="Cancel" onPress={() => setMode('view')} />
        </Animated.View>
      ) : mode === 'remove' ? (
        <Animated.View entering={FadeIn.duration(160)} style={{ gap: spacing.sm }}>
          <AppText variant="bodyStrong">Remove {plot.name} and its harvest records?</AppText>
          <View style={[styles.row, { gap: spacing.sm }]}>
            <View style={styles.flex}>
              <Button label="Keep" variant="secondary" onPress={() => setMode('view')} />
            </View>
            <View style={styles.flex}>
              <Button label="Remove" onPress={onRemove} />
            </View>
          </View>
        </Animated.View>
      ) : (
        <View style={[styles.row, { gap: spacing.sm }]}>
          <View style={styles.flex}>
            <Button label="Record harvest" variant="secondary" trailingIcon="check" onPress={() => setMode('harvest')} />
          </View>
          <TextLink label="Remove" color="textMuted" onPress={() => setMode('remove')} />
        </View>
      )}
    </Animated.View>
  );
}

function AddPlot({ onAdd, onCancel }: { onAdd: (p: FarmPlot) => Promise<void>; onCancel: () => void }) {
  const { colors, spacing, radii } = useTheme();
  const [name, setName] = useState('');
  const [crop, setCrop] = useState<CropId>('cottonii');
  const [units, setUnits] = useState('');
  const [plantedDays, setPlantedDays] = useState<number>(0);
  const [tried, setTried] = useState(false);

  const n = num(units);
  const valid = name.trim().length > 0 && n !== null && n > 0;

  const add = () => {
    setTried(true);
    if (!valid) return;
    onAdd({
      id: newUuid(),
      name: name.trim(),
      crop,
      units: Math.round(n!),
      plantedAt: new Date(Date.now() - plantedDays * 86_400_000).toISOString(),
      harvests: [],
    });
  };

  return (
    <Animated.View
      entering={FadeIn.duration(180)}
      style={[styles.card, { borderRadius: radii.lg, borderColor: colors.selected, borderWidth: 2, backgroundColor: colors.surface, padding: spacing.md, gap: spacing.md }]}
    >
      <AppText variant="heading">New line or cage</AppText>
      <TextField label="Name" placeholder="e.g. Lines near Maniwaya" value={name} onChangeText={setName} maxLength={40} />
      <View style={{ gap: spacing.xs }}>
        <AppText variant="label">What is it?</AppText>
        <View style={[styles.wrap, { gap: spacing.xs }]} accessibilityRole="radiogroup">
          {CROPS.map((c) => (
            <ChoiceChip key={c.id} label={c.name} selected={crop === c.id} onPress={() => setCrop(c.id)} />
          ))}
        </View>
      </View>
      <TextField label={`How many ${getCrop(crop).unit}?`} keyboardType="number-pad" value={units} onChangeText={(t) => setUnits(t.replace(/[^0-9]/g, ''))} maxLength={4} />
      <View style={{ gap: spacing.xs }}>
        <AppText variant="label">Planted</AppText>
        <View style={[styles.wrap, { gap: spacing.xs }]} accessibilityRole="radiogroup">
          {PLANTED.map((p) => (
            <ChoiceChip key={p.days} label={p.label} selected={plantedDays === p.days} onPress={() => setPlantedDays(p.days)} />
          ))}
        </View>
      </View>
      {tried && !valid ? (
        <AppText variant="caption" color="accentText">
          Add a name and how many {getCrop(crop).unit}.
        </AppText>
      ) : null}
      <Button label="Add" trailingIcon="check" onPress={add} />
      <TextLink label="Cancel" onPress={onCancel} />
    </Animated.View>
  );
}

// Practical, widely given advice; no numbers that would need a source.
function IceIceTip() {
  const { spacing, radii, tones } = useTheme();
  return (
    <View style={[styles.row, styles.top, { gap: spacing.sm, padding: spacing.md, borderRadius: radii.md, backgroundColor: tones.mangrove.bg, marginTop: spacing.lg }]}>
      <MaterialCommunityIcons name="lightbulb-on-outline" size={22} color={tones.mangrove.fg} />
      <View style={styles.flex}>
        <AppText variant="label" style={{ color: tones.mangrove.fg }}>
          After heavy rain, check for ice-ice
        </AppText>
        <AppText variant="caption">
          Branches turning white and soft often follow sudden changes in the water. Remove the affected parts early so it does not spread along
          the line.
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1.5, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center' },
  top: { alignItems: 'flex-start' },
  pill: { alignSelf: 'stretch' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  flex: { flex: 1 },
  tabular: { fontVariant: ['tabular-nums'] },
});
