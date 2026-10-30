import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { AppText, Button, ScreenContainer, SelectCard, StepHeader, TextField } from '@/components';
import { MUNICIPALITIES } from '@/constants/municipalities';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useTheme } from '@/theme';

export default function LocationScreen() {
  const router = useRouter();
  const { spacing } = useTheme();
  const { state, setMunicipality, setBarangay } = useOnboarding();
  const visitor = state.role === 'tourist';

  return (
    <ScreenContainer
      header={<StepHeader step={2} total={3} />}
      footer={
        <Button
          label="Continue"
          trailingIcon="arrow-forward"
          disabled={!state.municipality}
          accessibilityHint={state.municipality ? undefined : 'Choose your town first'}
          onPress={() => router.push('/permissions')}
        />
      }
    >
      <View style={{ gap: spacing.xs, marginTop: spacing.md, marginBottom: spacing.lg }}>
        <AppText variant="title" accessibilityRole="header">
          {visitor ? 'Where are you staying?' : 'Which town do you call home?'}
        </AppText>
        <AppText variant="body" color="textMuted">
          {visitor
            ? 'So the sea conditions you see are for the coast near you. You can change it as you move around.'
            : 'So the sea conditions and reports you see are the ones near you.'}
        </AppText>
      </View>

      <View style={{ gap: spacing.xs }} accessibilityRole="radiogroup">
        {MUNICIPALITIES.map((m) => (
          <SelectCard
            key={m.id}
            compact
            title={m.name}
            description={m.note}
            selected={state.municipality === m.id}
            onPress={() => setMunicipality(m.id)}
          />
        ))}
      </View>

      <View style={{ marginTop: spacing.xl }}>
        <TextField
          label="Barangay (optional)"
          helper="Helps Bantay Dagat send your reports to the right people."
          placeholder="Type your barangay"
          value={state.barangay}
          onChangeText={setBarangay}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="done"
          maxLength={60}
        />
      </View>
    </ScreenContainer>
  );
}
