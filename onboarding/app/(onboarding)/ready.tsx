import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AppText, Button, IconBadge, ScreenContainer, StepHeader, WaveDivider } from '@/components';
import type { CommunityIconName } from '@/constants/icons';
import { getMunicipality } from '@/constants/municipalities';
import { getRole } from '@/constants/roles';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useTheme } from '@/theme';

interface SummaryRow {
  icon: CommunityIconName;
  label: string;
  value: string;
}

export default function ReadyScreen() {
  const router = useRouter();
  const { colors, spacing, radii } = useTheme();
  const { state, complete } = useOnboarding();
  const { location = 'denied', notifications = 'denied' } = useLocalSearchParams<{
    location?: string;
    notifications?: string;
  }>();
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  const role = state.role ? getRole(state.role) : undefined;
  const town = state.municipality ? getMunicipality(state.municipality) : undefined;
  const barangay = state.barangay.trim();

  const place = town ? (barangay ? `Barangay ${barangay}, ${town.name}` : town.name) : null;
  const summary =
    role && place ? `You're set up as ${role.summaryLabel} in ${place}.` : "You're set up and ready to go.";

  const rows: SummaryRow[] = [
    ...(role ? [{ icon: role.icon, label: 'Role', value: role.title }] : []),
    ...(town ? [{ icon: 'map-marker-outline' as const, label: 'Town', value: town.name }] : []),
    ...(barangay ? [{ icon: 'home-city-outline' as const, label: 'Barangay', value: barangay }] : []),
    {
      icon: 'crosshairs-gps',
      label: 'Location',
      value: location === 'granted' ? 'On' : 'Off for now',
    },
    {
      icon: 'bell-ring-outline',
      label: 'Sea alerts',
      value: notifications === 'granted' ? 'On' : 'Off for now',
    },
  ];

  const handleStart = async () => {
    setSaving(true);
    setSaveFailed(false);
    try {
      await complete();
      router.replace('/home');
    } catch {
      setSaving(false);
      setSaveFailed(true);
    }
  };

  return (
    <ScreenContainer
      header={<StepHeader />}
      footer={
        <>
          {saveFailed ? (
            <AppText variant="caption" color="accentText" accessibilityLiveRegion="polite">
              We couldn't save your answers. Please try again.
            </AppText>
          ) : null}
          <Button label="Start exploring" trailingIcon="arrow-forward" loading={saving} onPress={handleStart} />
        </>
      }
    >
      <Animated.View entering={FadeInDown.duration(400)} style={{ gap: spacing.md, paddingTop: spacing.lg }}>
        <IconBadge icon="check-circle-outline" tone="mangrove" size="lg" />
        <AppText variant="display" accessibilityRole="header">
          Salamat. You're all set.
        </AppText>
        <AppText variant="body">{summary}</AppText>
        <WaveDivider color={colors.success} style={styles.wave} />
      </Animated.View>

      <Animated.View
        entering={FadeInDown.duration(400).delay(120)}
        style={[
          styles.card,
          {
            marginTop: spacing.lg,
            borderRadius: radii.lg,
            backgroundColor: colors.surface,
            borderColor: colors.border,
            paddingHorizontal: spacing.md,
          },
        ]}
      >
        {rows.map((row, i) => (
          <View
            key={row.label}
            accessible
            accessibilityLabel={`${row.label}: ${row.value}`}
            style={[
              styles.row,
              {
                gap: spacing.sm,
                paddingVertical: spacing.sm,
                borderTopWidth: i === 0 ? 0 : StyleSheet.hairlineWidth,
                borderTopColor: colors.borderStrong,
              },
            ]}
          >
            <MaterialCommunityIcons name={row.icon} size={22} color={colors.textMuted} />
            <AppText variant="caption" color="textMuted" style={styles.rowLabel}>
              {row.label}
            </AppText>
            <AppText variant="label" style={styles.rowValue}>
              {row.value}
            </AppText>
          </View>
        ))}
      </Animated.View>

      <AppText variant="caption" color="textMuted" style={{ marginTop: spacing.md }}>
        Your answers are saved on this phone. You can change them anytime in Settings.
      </AppText>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  wave: { width: '38%', height: 16 },
  card: { borderWidth: 1.5 },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 48 },
  rowLabel: { width: 92 },
  rowValue: { flex: 1, textAlign: 'right' },
});
