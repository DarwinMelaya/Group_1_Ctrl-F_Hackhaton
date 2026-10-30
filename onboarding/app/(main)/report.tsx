import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, IconBadge, LocationRow, SavedPanel, ScreenContainer, SelectCard, SyncBanner, SyncChip, TextField, timeOfDay } from '@/components';
import { getReportType, REPORT_TYPES, type ReportTypeId } from '@/constants/reportTypes';
import { useLocationFix } from '@/hooks/useLocationFix';
import { useRecords } from '@/hooks/useRecords';
import { useTheme } from '@/theme';

const MIN_CHARS = 10;

export default function ReportScreen() {
  const router = useRouter();
  const { colors, spacing, radii } = useTheme();
  const { reports, addReport } = useRecords();
  const location = useLocationFix();

  const [type, setType] = useState<ReportTypeId | null>(null);
  const [description, setDescription] = useState('');
  const [tried, setTried] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [saved, setSaved] = useState(false);

  const text = description.trim();
  const errors = {
    type: type ? null : 'Choose what you saw.',
    description: text.length >= MIN_CHARS ? null : 'Add a few words: what, where, and when.',
  };

  const save = async () => {
    setTried(true);
    if (!type || errors.description) return;
    setSaving(true);
    setSaveFailed(false);
    try {
      await addReport({ type, description: text, location: location.fix });
      setSaved(true);
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
          title="Report saved"
          body="It goes to the MAO and Bantay Dagat as soon as you are signed in and have signal. If someone is in danger, call them now."
          art={<IconBadge icon="bullhorn-outline" tone="coral" size="lg" />}
        >
          <SyncBanner showAllSent />
          <Button
            label="Make another report"
            variant="secondary"
            onPress={() => {
              setType(null);
              setDescription('');
              setTried(false);
              setSaved(false);
            }}
          />
          <Button label="Back to home" variant="ghost" onPress={() => router.replace('/home')} />
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
              The phone could not save this report. Please try again.
            </AppText>
          ) : null}
          <Button label="Save report" trailingIcon="check" loading={saving} onPress={save} />
        </>
      }
    >
      <View style={{ gap: spacing.xs, marginTop: spacing.md, marginBottom: spacing.lg }}>
        <AppText variant="title" accessibilityRole="header">
          Report to Bantay Dagat
        </AppText>
        <AppText variant="body" color="textMuted">
          You do not need signal. Stay safe: report from a distance.
        </AppText>
      </View>

      <View style={{ gap: spacing.xs, marginBottom: spacing.lg }} accessibilityRole="radiogroup">
        {REPORT_TYPES.map((t) => (
          <SelectCard
            key={t.id}
            icon={t.icon}
            tone="sea"
            title={t.title}
            description={t.example}
            selected={type === t.id}
            onPress={() => setType(t.id)}
          />
        ))}
        {tried && errors.type ? (
          <AppText variant="caption" color="accentText">
            {errors.type}
          </AppText>
        ) : null}
      </View>

      <View style={{ gap: spacing.xs, marginBottom: spacing.lg }}>
        <TextField
          label="What did you see?"
          helper="Boat name or color, how many people, the direction they went."
          placeholder="e.g. Small boat with compressor near the Gaspar Island reef, around 6 am"
          value={description}
          onChangeText={setDescription}
          multiline
          maxLength={1000}
        />
        {tried && errors.description ? (
          <AppText variant="caption" color="accentText">
            {errors.description}
          </AppText>
        ) : null}
      </View>

      <LocationRow state={location.state} onLocate={location.locate} />

      {reports.length > 0 ? (
        <View style={{ marginTop: spacing.xl, gap: spacing.xs }}>
          <AppText variant="eyebrow" color="textMuted" accessibilityRole="header">
            Your reports
          </AppText>
          <View style={[styles.card, { borderRadius: radii.lg, borderColor: colors.border, backgroundColor: colors.surface }]}>
            {reports.slice(0, 5).map((r, i) => (
              <View
                key={r.clientUuid}
                style={[
                  styles.row,
                  {
                    gap: spacing.sm,
                    padding: spacing.md,
                    borderTopWidth: i === 0 ? 0 : StyleSheet.hairlineWidth,
                    borderTopColor: colors.borderStrong,
                  },
                ]}
              >
                <View style={styles.flex}>
                  <AppText variant="label">{getReportType(r.type).title}</AppText>
                  <AppText variant="caption" color="textMuted" numberOfLines={1}>
                    {new Date(r.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}, {timeOfDay(r.createdAt)} · {r.description}
                  </AppText>
                </View>
                <SyncChip sync={r.sync} />
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1.5, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
});
