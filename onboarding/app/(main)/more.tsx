import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Button, IconBadge, ScreenContainer } from '@/components';
import { APP_NAME } from '@/constants/app';
import type { CommunityIconName } from '@/constants/icons';
import { getMunicipality } from '@/constants/municipalities';
import { getRole } from '@/constants/roles';
import { useAuth } from '@/hooks/useAuth';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useSync } from '@/hooks/useSync';
import { useTheme } from '@/theme';

export default function MoreScreen() {
  const router = useRouter();
  const { colors, spacing, radii } = useTheme();
  const { state, reset } = useOnboarding();
  const [confirmReset, setConfirmReset] = useState(false);

  const role = state.role ? getRole(state.role) : undefined;
  const town = state.municipality ? getMunicipality(state.municipality) : undefined;
  const card = { borderRadius: radii.lg, borderColor: colors.border, backgroundColor: colors.surface };

  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      <AppText variant="title" accessibilityRole="header" style={{ marginTop: spacing.md, marginBottom: spacing.lg }}>
        More
      </AppText>

      <View style={[styles.card, card, styles.profile, { padding: spacing.md, gap: spacing.md }]}>
        <IconBadge icon={role?.icon ?? 'account-outline'} tone={role?.tone ?? 'sea'} size="md" />
        <View style={styles.flex}>
          <AppText variant="heading">{role?.title ?? 'No role chosen'}</AppText>
          <AppText variant="caption" color="textMuted">
            {town ? [state.barangay.trim(), town.name].filter(Boolean).join(', ') : 'No town chosen'}
          </AppText>
        </View>
      </View>

      <Account />

      <View style={[styles.card, card, { marginTop: spacing.md }]}>
        <Row icon="account-edit-outline" label="Change role or town" onPress={() => router.push('/role')} />
        <Row icon="restart" label="Start setup again" divider onPress={() => setConfirmReset(true)} />
      </View>

      {confirmReset ? (
        <View style={[styles.card, { borderRadius: radii.md, borderColor: colors.accent, backgroundColor: colors.accentSoft, padding: spacing.md, gap: spacing.sm, marginTop: spacing.sm }]}>
          <AppText variant="bodyStrong">Clear your answers and start over?</AppText>
          <AppText variant="caption" color="textMuted">
            Your role, town and barangay are removed from this phone.
          </AppText>
          <View style={[styles.rowBetween, { gap: spacing.sm }]}>
            <View style={styles.flex}>
              <Button label="Cancel" variant="secondary" onPress={() => setConfirmReset(false)} />
            </View>
            <View style={styles.flex}>
              <Button
                label="Start over"
                onPress={async () => {
                  await reset();
                  router.replace('/welcome');
                }}
              />
            </View>
          </View>
        </View>
      ) : null}

      <View style={{ marginTop: spacing.xl, gap: spacing.xs }}>
        <AppText variant="eyebrow" color="textMuted">
          About
        </AppText>
        <AppText variant="caption" color="textMuted">
          {APP_NAME} is part of Huli Ko, fisheries records and coastal care for Marinduque.
        </AppText>
        <AppText variant="caption" color="textMuted">
          Sea and weather data: Open-Meteo (CC BY 4.0). Always check PAGASA bulletins before a long trip.
        </AppText>
      </View>
    </ScreenContainer>
  );
}

function Account() {
  const router = useRouter();
  const { colors, spacing, radii } = useTheme();
  const { auth, signOut } = useAuth();
  const { waiting } = useSync();
  const [confirm, setConfirm] = useState(false);

  if (auth.status === 'unavailable' || auth.status === 'loading') return null;

  return (
    <View style={{ marginTop: spacing.lg, gap: spacing.xs }}>
      <AppText variant="eyebrow" color="textMuted" accessibilityRole="header">
        Account
      </AppText>
      <View style={[styles.card, { borderRadius: radii.lg, borderColor: colors.border, backgroundColor: colors.surface }]}>
        {auth.status === 'signedOut' ? (
          <Row icon="login" label="Sign in to send your records" onPress={() => router.push('/login')} />
        ) : (
          <>
            <View style={{ padding: spacing.md, gap: 2 }}>
              <AppText variant="label">{auth.profile?.fullName || 'Signed in'}</AppText>
              <AppText variant="caption" color="textMuted">
                {[auth.email, auth.profile?.role === 'pic' ? 'PIC' : null].filter(Boolean).join(' · ')}
              </AppText>
            </View>
            <Row icon="logout" label="Sign out" divider onPress={() => (waiting > 0 ? setConfirm(true) : signOut())} />
          </>
        )}
      </View>
      {confirm ? (
        <View style={[styles.card, { borderRadius: radii.md, borderColor: colors.accent, backgroundColor: colors.accentSoft, padding: spacing.md, gap: spacing.sm }]}>
          <AppText variant="bodyStrong">{waiting} not sent yet</AppText>
          <AppText variant="caption" color="textMuted">
            They stay on this phone and send after you sign in again. Nothing is deleted.
          </AppText>
          <View style={[styles.rowBetween, { gap: spacing.sm }]}>
            <View style={styles.flex}>
              <Button label="Stay signed in" variant="secondary" onPress={() => setConfirm(false)} />
            </View>
            <View style={styles.flex}>
              <Button
                label="Sign out"
                onPress={async () => {
                  setConfirm(false);
                  await signOut();
                }}
              />
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function Row({ icon, label, onPress, divider = false }: { icon: CommunityIconName; label: string; onPress: () => void; divider?: boolean }) {
  const { colors, spacing } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.rowBetween,
        {
          minHeight: 60,
          paddingHorizontal: spacing.md,
          gap: spacing.md,
          backgroundColor: pressed ? colors.surfaceMuted : 'transparent',
          borderTopWidth: divider ? StyleSheet.hairlineWidth : 0,
          borderTopColor: colors.borderStrong,
        },
      ]}
    >
      <MaterialCommunityIcons name={icon} size={24} color={colors.selected} />
      <AppText variant="label" style={styles.flex}>
        {label}
      </AppText>
      <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1.5, overflow: 'hidden' },
  profile: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
});
