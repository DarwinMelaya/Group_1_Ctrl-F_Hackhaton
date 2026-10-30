import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { AppText, Button, ScreenContainer, SelectCard, StepHeader } from '@/components';
import { ROLES } from '@/constants/roles';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useTheme } from '@/theme';

export default function RoleScreen() {
  const router = useRouter();
  const { spacing } = useTheme();
  const { state, setRole } = useOnboarding();

  return (
    <ScreenContainer
      header={<StepHeader step={1} total={3} />}
      footer={
        <Button
          label="Continue"
          trailingIcon="arrow-forward"
          disabled={!state.role}
          accessibilityHint={state.role ? undefined : 'Choose a role first'}
          onPress={() => router.push('/location')}
        />
      }
    >
      <View style={{ gap: spacing.xs, marginTop: spacing.md, marginBottom: spacing.lg }}>
        <AppText variant="title" accessibilityRole="header">
          What do you do by the sea?
        </AppText>
        <AppText variant="body" color="textMuted">
          We will put the tools you need up front. You can change this later.
        </AppText>
      </View>

      <View style={{ gap: spacing.sm }} accessibilityRole="radiogroup">
        {ROLES.map((role) => (
          <SelectCard
            key={role.id}
            title={role.title}
            description={role.description}
            icon={role.icon}
            tone={role.tone}
            selected={state.role === role.id}
            onPress={() => setRole(role.id)}
          />
        ))}
      </View>
    </ScreenContainer>
  );
}
