import { Stack } from 'expo-router';

import { useTheme } from '@/theme';

export default function OnboardingLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
      <Stack.Screen name="language" />
      <Stack.Screen name="slides" />
      <Stack.Screen name="nickname" />
      <Stack.Screen name="role" />
      <Stack.Screen name="location" />
      <Stack.Screen name="permissions" />
      <Stack.Screen name="ready" />
    </Stack>
  );
}
