import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Button, IconBadge, ScreenContainer } from '@/components';
import { APP_NAME } from '@/constants/app';
import type { CommunityIconName } from '@/constants/icons';
import { getMunicipality } from '@/constants/municipalities';
import { getRole } from '@/constants/roles';
import { LanguagePicker } from '@/components/LanguagePicker';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useSync } from '@/hooks/useSync';
import { useTheme } from '@/theme';

export default function MoreScreen() {
  const router = useRouter();
  const { colors, spacing, radii } = useTheme();
  const { state, reset } = useOnboarding();
  const [confirmReset, setConfirmReset] = useState(false);
  const { t } = useLanguage();

  const role = state.role ? getRole(state.role) : undefined;
  const town = state.municipality ? getMunicipality(state.municipality) : undefined;
  const card = { borderRadius: radii.lg, borderColor: colors.border, backgroundColor: colors.surface };

  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      <AppText variant="title" accessibilityRole="header" style={{ marginTop: spacing.md, marginBottom: spacing.lg }}>
        {t('More', 'Iba pa')}
      </AppText>

      <View style={[styles.card, card, styles.profile, { padding: spacing.md, gap: spacing.md }]}>
        <IconBadge icon={role?.icon ?? 'account-outline'} tone={role?.tone ?? 'sea'} size="md" />
        <View style={styles.flex}>
          <AppText variant="heading">{role ? t(role.title, role.titleFil) : t('No role chosen', 'Wala pang napiling papel')}</AppText>
          <AppText variant="caption" color="textMuted">
            {town ? [state.barangay.trim(), town.name].filter(Boolean).join(', ') : t('No town chosen', 'Wala pang napiling bayan')}
          </AppText>
        </View>
      </View>

      <View style={{ marginTop: spacing.lg, gap: spacing.xs }}>
        <AppText variant="eyebrow" color="textMuted" accessibilityRole="header">
          {t('Language', 'Wika')}
        </AppText>
        <LanguagePicker />
      </View>

      <Account />

      <View style={[styles.card, card, { marginTop: spacing.md }]}>
        <Row icon="account-edit-outline" label={t('Change role or town', 'Palitan ang papel o bayan')} onPress={() => router.push('/role')} />
        <Row icon="restart" label={t('Start setup again', 'Simulan muli ang setup')} divider onPress={() => setConfirmReset(true)} />
      </View>

      {confirmReset ? (
        <View style={[styles.card, { borderRadius: radii.md, borderColor: colors.accent, backgroundColor: colors.accentSoft, padding: spacing.md, gap: spacing.sm, marginTop: spacing.sm }]}>
          <AppText variant="bodyStrong">{t('Clear your answers and start over?', 'Burahin ang mga sagot at magsimula muli?')}</AppText>
          <AppText variant="caption" color="textMuted">
            {t('Your role, town and barangay are removed from this phone.', 'Mabubura sa phone ang papel, bayan at barangay mo.')}
          </AppText>
          <View style={[styles.rowBetween, { gap: spacing.sm }]}>
            <View style={styles.flex}>
              <Button label={t('Cancel', 'Huwag na')} variant="secondary" onPress={() => setConfirmReset(false)} />
            </View>
            <View style={styles.flex}>
              <Button
                label={t('Start over', 'Magsimula muli')}
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
          {t('About', 'Tungkol')}
        </AppText>
        <AppText variant="caption" color="textMuted">
          {t(`${APP_NAME} keeps fisheries records and cares for the coast of Marinduque.`, `Ang ${APP_NAME} ay para sa talaan ng pangisdaan at pangangalaga ng baybayin ng Marinduque.`)}
        </AppText>
        <AppText variant="caption" color="textMuted">
          {t('Sea and weather data: Open-Meteo (CC BY 4.0). Always check PAGASA bulletins before a long trip.', 'Datos ng dagat at panahon: Open-Meteo (CC BY 4.0). Laging tingnan ang abiso ng PAGASA bago bumiyahe nang malayo.')}
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
  const { t } = useLanguage();

  if (auth.status === 'unavailable' || auth.status === 'loading') return null;

  return (
    <View style={{ marginTop: spacing.lg, gap: spacing.xs }}>
      <AppText variant="eyebrow" color="textMuted" accessibilityRole="header">
        {t('Account', 'Account')}
      </AppText>
      <View style={[styles.card, { borderRadius: radii.lg, borderColor: colors.border, backgroundColor: colors.surface }]}>
        {auth.status === 'signedOut' ? (
          <Row icon="login" label={t('Sign in or create an account', 'Mag-sign in o gumawa ng account')} onPress={() => router.push('/login')} />
        ) : (
          <>
            <View style={{ padding: spacing.md, gap: 2 }}>
              <AppText variant="label">{auth.profile?.fullName || t('Signed in', 'Naka-sign in')}</AppText>
              <AppText variant="caption" color="textMuted">
                {[auth.email, auth.profile?.role === 'pic' ? 'PIC' : null].filter(Boolean).join(' · ')}
              </AppText>
            </View>
            <Row icon="logout" label={t('Sign out', 'Mag-sign out')} divider onPress={() => (waiting > 0 ? setConfirm(true) : signOut())} />
          </>
        )}
      </View>
      {confirm ? (
        <View style={[styles.card, { borderRadius: radii.md, borderColor: colors.accent, backgroundColor: colors.accentSoft, padding: spacing.md, gap: spacing.sm }]}>
          <AppText variant="bodyStrong">{waiting} {t('not sent yet', 'hindi pa naipapadala')}</AppText>
          <AppText variant="caption" color="textMuted">
            {t('They stay on this phone and send after you sign in again. Nothing is deleted.', 'Nasa phone pa rin sila at maipapadala kapag nag-sign in ka ulit. Walang mabubura.')}
          </AppText>
          <View style={[styles.rowBetween, { gap: spacing.sm }]}>
            <View style={styles.flex}>
              <Button label={t('Stay signed in', 'Manatiling naka-sign in')} variant="secondary" onPress={() => setConfirm(false)} />
            </View>
            <View style={styles.flex}>
              <Button
                label={t('Sign out', 'Mag-sign out')}
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
