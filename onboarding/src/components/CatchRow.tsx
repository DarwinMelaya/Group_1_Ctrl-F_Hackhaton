import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import type { CommunityIconName } from '@/constants/icons';
import { getSpecies } from '@/constants/species';
import type { CatchRecord, CatchStatus, SyncInfo } from '@/storage/records';
import { useTheme, type Tone } from '@/theme';

import { AppText } from './AppText';

export const kg = (n: number) => `${Number.isInteger(n) ? n : n.toFixed(1)} kg`;

export const timeOfDay = (iso: string) => new Date(iso).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' });

type ChipLook = { icon: CommunityIconName; label: string; tone: Tone };

const SERVER_LOOK: Record<CatchStatus, ChipLook> = {
  verified: { icon: 'check-decagram-outline', label: 'Verified', tone: 'mangrove' },
  pending: { icon: 'clock-outline', label: 'Received', tone: 'reef' },
  flagged: { icon: 'alert-circle-outline', label: 'For review', tone: 'coral' },
  reviewed: { icon: 'check-all', label: 'Reviewed', tone: 'mangrove' },
};

// Where a record is in its trip to the MAO. Icon + word, never color alone.
// Catches carry a server status; reports only an id, so they show "Sent".
export function syncLook(sync: SyncInfo<object>): ChipLook {
  if (sync.state === 'failed') return { icon: 'close-circle-outline', label: 'Not accepted', tone: 'coral' };
  if (sync.state === 'waiting') return { icon: 'cellphone-check', label: 'On phone', tone: 'sea' };
  const status = sync.server && 'status' in sync.server ? (sync.server.status as CatchStatus) : undefined;
  return status ? SERVER_LOOK[status] : { icon: 'cloud-check-outline', label: 'Sent', tone: 'mangrove' };
}

export function SyncChip({ sync }: { sync: SyncInfo<object> }) {
  const { radii, tones } = useTheme();
  const look = syncLook(sync);
  const { fg, bg } = tones[look.tone];
  return (
    <View style={[styles.chip, { borderRadius: radii.pill, backgroundColor: bg }]}>
      <MaterialCommunityIcons name={look.icon} size={14} color={fg} />
      <AppText variant="caption" style={[styles.chipText, { color: fg }]}>
        {look.label}
      </AppText>
    </View>
  );
}

export function CatchRow({ record }: { record: CatchRecord }) {
  const { colors, spacing } = useTheme();
  const species = getSpecies(record.speciesLocalName);

  return (
    <View
      style={[styles.row, { gap: spacing.sm }]}
      accessible
      accessibilityLabel={`${record.speciesLocalName}, ${kg(record.weightKg)}, ${timeOfDay(record.caughtAt)}, ${syncLook(record.sync).label}`}
    >
      <View style={styles.text}>
        <AppText variant="heading" numberOfLines={1}>
          {record.speciesLocalName}
        </AppText>
        <View style={[styles.meta, { gap: 6 }]}>
          <AppText variant="caption" color="textMuted">
            {species?.englishName ?? 'Other fish'} · {timeOfDay(record.caughtAt)}
          </AppText>
          <MaterialCommunityIcons
            name={record.location ? 'map-marker-check-outline' : 'map-marker-off-outline'}
            size={15}
            color={colors.textMuted}
          />
        </View>
      </View>
      <View style={[styles.right, { gap: 4 }]}>
        <AppText variant="heading" style={styles.tabular}>
          {kg(record.weightKg)}
        </AppText>
        <SyncChip sync={record.sync} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 56 },
  text: { flex: 1, gap: 2 },
  meta: { flexDirection: 'row', alignItems: 'center' },
  right: { alignItems: 'flex-end' },
  tabular: { fontVariant: ['tabular-nums'] },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 2 },
  chipText: { fontSize: 13, lineHeight: 18 },
});
