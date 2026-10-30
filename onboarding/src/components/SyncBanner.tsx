import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import type { CommunityIconName } from '@/constants/icons';
import { useAuth } from '@/hooks/useAuth';
import { useSync } from '@/hooks/useSync';
import { useTheme, type Tone } from '@/theme';

import { AppText } from './AppText';
import { TextLink } from './TextLink';

const plural = (n: number) => `${n} ${n === 1 ? 'record' : 'records'}`;

// One line on where the phone's records are, with the one action that helps. Hidden when all is sent.
export function SyncBanner({ showAllSent = false }: { showAllSent?: boolean }) {
  const router = useRouter();
  const { colors, spacing, radii, tones } = useTheme();
  const { auth } = useAuth();
  const { syncing, waiting, failed, offline, syncNow } = useSync();

  let icon: CommunityIconName = 'cloud-check-outline';
  let tone: Tone = 'mangrove';
  let text: string;
  let action: { label: string; onPress: () => void } | null = null;

  if (auth.status === 'unavailable' || auth.status === 'loading') return null;
  if (auth.status === 'signedOut') {
    if (waiting === 0) return null;
    icon = 'cellphone-check';
    tone = 'sea';
    text = `${plural(waiting)} saved on this phone. Sign in to send them to the MAO.`;
    action = { label: 'Sign in', onPress: () => router.push('/login') };
  } else if (syncing) {
    tone = 'sea';
    text = waiting > 0 ? `Sending ${plural(waiting)}…` : 'Checking for updates…';
  } else if (failed > 0) {
    icon = 'close-circle-outline';
    tone = 'coral';
    text = `${plural(failed)} not accepted by the server. Open it to see why.`;
  } else if (waiting > 0) {
    icon = offline ? 'wifi-off' : 'cellphone-check';
    tone = 'sea';
    text = offline
      ? `${plural(waiting)} waiting for signal. They send on their own when you are back in range.`
      : `${plural(waiting)} waiting to send.`;
    action = { label: 'Send now', onPress: syncNow };
  } else if (showAllSent) {
    text = 'Everything is sent to the MAO.';
  } else {
    return null;
  }

  const { fg, bg } = tones[tone];
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      style={[styles.row, { gap: spacing.sm, padding: spacing.sm, paddingLeft: spacing.md, borderRadius: radii.md, backgroundColor: bg }]}
      accessibilityLiveRegion="polite"
    >
      {syncing ? <ActivityIndicator color={fg} /> : <MaterialCommunityIcons name={icon} size={22} color={fg} />}
      <AppText variant="caption" style={[styles.flex, { color: colors.text }]}>
        {text}
      </AppText>
      {action ? <TextLink label={action.label} onPress={action.onPress} /> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 52 },
  flex: { flex: 1 },
});
