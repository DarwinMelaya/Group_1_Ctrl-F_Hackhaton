import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, ChoiceChip, kg, LocationRow, SavedPanel, ScreenContainer, SyncBanner, TextField, WeightStepper } from '@/components';
import { SPECIES } from '@/constants/species';
import { useLocationFix } from '@/hooks/useLocationFix';
import { useRecords } from '@/hooks/useRecords';
import type { CatchRecord } from '@/storage/records';
import { useTheme } from '@/theme';

// How long ago it was caught. Kept to a few taps; the database allows caught_at up to now.
const WHEN = [
  { label: 'Just now', hours: 0 },
  { label: '1 hr ago', hours: 1 },
  { label: '2 hrs ago', hours: 2 },
  { label: '4 hrs ago', hours: 4 },
] as const;

const parseNum = (s: string) => {
  const n = Number.parseFloat(s.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

export default function LogScreen() {
  const router = useRouter();
  const { spacing } = useTheme();
  const { addCatch } = useRecords();
  const location = useLocationFix();

  const [species, setSpecies] = useState<string | null>(null);
  const [weight, setWeight] = useState('');
  const [size, setSize] = useState('');
  const [hoursAgo, setHoursAgo] = useState<number>(0);
  const [tried, setTried] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [saved, setSaved] = useState<CatchRecord | null>(null);

  const weightKg = parseNum(weight);
  const sizeCm = size.trim() ? parseNum(size) : null;
  const errors = {
    species: species ? null : 'Choose what you caught.',
    weight: weightKg !== null && weightKg > 0 && weightKg <= 5000 ? null : 'Enter the weight, more than 0 kg.',
    size: !size.trim() || (sizeCm !== null && sizeCm > 0 && sizeCm <= 500) ? null : 'Size should be in centimeters, like 25.',
  };
  const valid = !errors.species && !errors.weight && !errors.size;

  const reset = () => {
    setSpecies(null);
    setWeight('');
    setSize('');
    setHoursAgo(0);
    setTried(false);
    setSaved(null);
  };

  const save = async () => {
    setTried(true);
    if (!valid || !species || weightKg === null) return;
    setSaving(true);
    setSaveFailed(false);
    try {
      const record = await addCatch({
        speciesLocalName: species,
        weightKg: Math.round(weightKg * 100) / 100,
        sizeCm: sizeCm === null ? null : Math.round(sizeCm * 10) / 10,
        caughtAt: new Date(Date.now() - hoursAgo * 3600_000).toISOString(),
        location: location.fix,
      });
      setSaved(record);
    } catch {
      setSaveFailed(true);
    } finally {
      setSaving(false);
    }
  };

  if (saved) {
    return (
      <ScreenContainer edges={['top', 'left', 'right']}>
        <SavedPanel
          title="Saved on your phone"
          body={`${saved.speciesLocalName} · ${kg(saved.weightKg)}. It stays here without signal and goes to the MAO once you are signed in.`}
        >
          <SyncBanner showAllSent />
          <Button label="Log another catch" onPress={reset} />
          <Button
            label="See my catches"
            variant="ghost"
            onPress={() => {
              reset();
              router.push('/catches');
            }}
          />
        </SavedPanel>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      edges={['top', 'left', 'right']}
      footer={
        <>
          {saveFailed ? (
            <AppText variant="caption" color="accentText" accessibilityLiveRegion="polite">
              The phone could not save this. Check that it has free space, then try again.
            </AppText>
          ) : null}
          <Button label="Save catch" trailingIcon="check" loading={saving} onPress={save} />
        </>
      }
    >
      <View style={{ gap: spacing.xs, marginTop: spacing.md, marginBottom: spacing.lg }}>
        <AppText variant="title" accessibilityRole="header">
          Log a catch
        </AppText>
        <AppText variant="body" color="textMuted">
          Works without signal. Takes about ten seconds.
        </AppText>
      </View>

      <Field label="What did you catch?" error={tried ? errors.species : null}>
        <View style={[styles.grid, { gap: spacing.xs }]} accessibilityRole="radiogroup">
          {SPECIES.map((s) => (
            <ChoiceChip
              key={s.localName}
              tile
              label={s.localName}
              sublabel={s.englishName}
              selected={species === s.localName}
              onPress={() => setSpecies(s.localName)}
            />
          ))}
        </View>
      </Field>

      <Field label="How heavy?">
        <WeightStepper value={weight} onChange={setWeight} error={tried && errors.weight ? errors.weight : undefined} />
      </Field>

      <Field label="When?">
        <View style={[styles.wrap, { gap: spacing.xs }]} accessibilityRole="radiogroup">
          {WHEN.map((w) => (
            <ChoiceChip key={w.hours} label={w.label} selected={hoursAgo === w.hours} onPress={() => setHoursAgo(w.hours)} />
          ))}
        </View>
      </Field>

      <Field label="Where?">
        <LocationRow state={location.state} onLocate={location.locate} />
      </Field>

      <Field label="Length (optional)" error={tried ? errors.size : null}>
        <TextField
          label="Length of the biggest one, in cm"
          placeholder="e.g. 25"
          keyboardType="decimal-pad"
          value={size}
          onChangeText={(t) => setSize(t.replace(/[^0-9.,]/g, ''))}
          maxLength={5}
        />
      </Field>
    </ScreenContainer>
  );
}

function Field({ label, error, children }: { label: string; error?: string | null; children: React.ReactNode }) {
  const { spacing } = useTheme();
  return (
    <View style={{ gap: spacing.sm, marginBottom: spacing.lg }}>
      <AppText variant="eyebrow" color="textMuted" accessibilityRole="header">
        {label}
      </AppText>
      {children}
      {error ? (
        <AppText variant="caption" color="accentText" accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
});
