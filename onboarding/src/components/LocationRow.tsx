import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import type { CommunityIconName } from '@/constants/icons';
import type { FixState } from '@/hooks/useLocationFix';
import { useTheme } from '@/theme';

import { AppText } from './AppText';
import { TextLink } from './TextLink';

interface LocationRowProps {
  state: FixState;
  onLocate: () => void;
}

// Where the record was made. Status is always icon + words; the exact point is never shown publicly.
export function LocationRow({ state, onLocate }: LocationRowProps) {
  const { colors, radii, spacing } = useTheme();

  let icon: CommunityIconName = 'map-marker-off-outline';
  let title = 'No location yet';
  let detail = 'Optional, but it helps the MAO see where fish are caught.';
  let action: string | null = 'Use my location';

  if (state.status === 'locating') {
    title = 'Finding your location…';
    detail = 'GPS works without mobile data. Out in the open is fastest.';
    action = null;
  } else if (state.status === 'ready') {
    icon = 'map-marker-check-outline';
    title = 'Location added';
    detail = state.fix.accuracyM === null ? 'Only the MAO sees the exact spot.' : `Within about ${state.fix.accuracyM} m. Only the MAO sees the exact spot.`;
    action = 'Update';
  } else if (state.status === 'denied') {
    title = 'Location is off';
    detail = "Allow it in your phone's settings, or save without it.";
    action = 'Ask again';
  } else if (state.status === 'failed') {
    title = 'Could not get a GPS fix';
    detail = 'Try again outside, or save without a location.';
    action = 'Try again';
  }

  return (
    <View style={[styles.row, { gap: spacing.sm, padding: spacing.sm, borderRadius: radii.md, backgroundColor: colors.surfaceMuted }]}>
      {state.status === 'locating' ? (
        <ActivityIndicator color={colors.selected} style={styles.icon} />
      ) : (
        <MaterialCommunityIcons name={icon} size={26} color={state.status === 'ready' ? colors.selected : colors.textMuted} style={styles.icon} />
      )}
      <View style={styles.text}>
        <AppText variant="label">{title}</AppText>
        <AppText variant="caption" color="textMuted">
          {detail}
        </AppText>
      </View>
      {action ? <TextLink label={action} onPress={onLocate} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  icon: { width: 28 },
  text: { flex: 1, gap: 2 },
});
