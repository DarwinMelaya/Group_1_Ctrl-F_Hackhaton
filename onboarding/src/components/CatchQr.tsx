import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { flagLabel } from '@/constants/flags';
import { SITE_URL, traceUrl } from '@/services/supabase';
import type { CatchRecord } from '@/storage/records';
import { colors as palette, useTheme } from '@/theme';

import { AppText } from './AppText';

// What the server said about a catch: the buyer QR once it is in, the review reasons, or why it was refused.
export function CatchServerInfo({ record }: { record: CatchRecord }) {
  const { colors, spacing, radii, tones } = useTheme();
  const { sync } = record;

  if (sync.state === 'failed') {
    return (
      <View style={[styles.note, { gap: spacing.sm, padding: spacing.sm, borderRadius: radii.sm, backgroundColor: tones.coral.bg }]}>
        <MaterialCommunityIcons name="close-circle-outline" size={20} color={tones.coral.fg} />
        <AppText variant="caption" style={[styles.flex, { color: colors.text }]}>
          The server did not accept this catch: {sync.lastError ?? 'unknown reason'}. Please show it to the MAO.
        </AppText>
      </View>
    );
  }
  if (sync.state !== 'sent' || !sync.server) return null;

  const { server } = sync;
  return (
    <View style={{ gap: spacing.sm }}>
      {server.flagReasons.length > 0 ? (
        <View style={[styles.note, { gap: spacing.sm, padding: spacing.sm, borderRadius: radii.sm, backgroundColor: tones.coral.bg }]}>
          <MaterialCommunityIcons name="alert-circle-outline" size={20} color={tones.coral.fg} />
          <View style={styles.flex}>
            <AppText variant="label">{server.status === 'reviewed' ? 'Reviewed by the MAO' : 'Flagged for review'}</AppText>
            {server.flagReasons.map((code) => (
              <AppText key={code} variant="caption" color="textMuted">
                {flagLabel(code)}
              </AppText>
            ))}
          </View>
        </View>
      ) : null}

      {SITE_URL ? (
        <View style={[styles.qrRow, { gap: spacing.md, padding: spacing.sm, borderRadius: radii.sm, backgroundColor: colors.surfaceMuted }]}>
          {/* White quiet zone so any phone camera can read it. */}
          <View style={[styles.qrBox, { borderRadius: radii.sm }]} accessible accessibilityLabel="QR code for buyers">
            <QRCode value={traceUrl(server.qrToken)} size={104} color={palette.sea900} backgroundColor={palette.white} ecl="M" />
          </View>
          <View style={styles.flex}>
            <AppText variant="label">QR for buyers</AppText>
            <AppText variant="caption" color="textMuted">
              Shows the species, weight, date and town. Never your exact fishing spot.
            </AppText>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  note: { flexDirection: 'row', alignItems: 'flex-start' },
  qrRow: { flexDirection: 'row', alignItems: 'center' },
  qrBox: { padding: 8, backgroundColor: palette.white },
  flex: { flex: 1, gap: 2 },
});
