import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, IconBadge, ScreenContainer, StepHeader, TextField } from '@/components';
import { useAuth } from '@/hooks/useAuth';
import { useSync } from '@/hooks/useSync';
import { useTheme } from '@/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { colors, spacing, radii } = useTheme();
  const { signIn } = useAuth();
  const { waiting } = useSync();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/home'));

  const submit = async () => {
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setBusy(true);
    setError(null);
    const result = await signIn(email, password);
    setBusy(false);
    if (result.ok) close();
    else setError(result.message);
  };

  return (
    <ScreenContainer
      header={<StepHeader onBack={close} />}
      footer={<Button label="Sign in" trailingIcon="arrow-forward" loading={busy} onPress={submit} />}
    >
      <View style={{ gap: spacing.sm, marginBottom: spacing.lg }}>
        <IconBadge icon="account-key-outline" tone="sea" size="md" />
        <AppText variant="title" accessibilityRole="header">
          Sign in
        </AppText>
        <AppText variant="body" color="textMuted">
          {waiting > 0
            ? `Use your Huli Ko account to send the ${waiting} ${waiting === 1 ? 'record' : 'records'} on this phone to the MAO.`
            : 'Use the Huli Ko account the MAO set up for you.'}
        </AppText>
      </View>

      <View style={{ gap: spacing.md }}>
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          keyboardType="email-address"
          textContentType="username"
          returnKeyType="next"
        />
        <TextField
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={submit}
        />
      </View>

      {error ? (
        <View
          style={[styles.alert, { marginTop: spacing.md, gap: spacing.sm, padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.accentSoft }]}
          accessibilityLiveRegion="assertive"
          accessibilityRole="alert"
        >
          <MaterialCommunityIcons name="alert-circle-outline" size={22} color={colors.accentText} />
          <AppText variant="caption" color="accentText" style={styles.flex}>
            {error}
          </AppText>
        </View>
      ) : null}

      <AppText variant="caption" color="textMuted" style={{ marginTop: spacing.lg }}>
        No account yet? The MAO registers fishers. Everything you log stays on this phone until you sign in.
      </AppText>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  alert: { flexDirection: 'row', alignItems: 'flex-start' },
  flex: { flex: 1 },
});
