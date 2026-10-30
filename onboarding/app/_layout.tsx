import {
  Poppins_400Regular,
  Poppins_400Regular_Italic,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { OnboardingProvider, useOnboarding } from '@/hooks/useOnboarding';
import { AuthProvider } from '@/hooks/useAuth';
import { RecordsProvider } from '@/hooks/useRecords';
import { SyncProvider } from '@/hooks/useSync';
import { ThemeProvider, useTheme } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {
  // Already hidden (e.g. after a fast refresh); nothing to do.
});

export default function RootLayout() {
  // Fonts are bundled with the app, so this works offline on first launch.
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_400Regular_Italic,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <OnboardingProvider>
          <RecordsProvider>
            <AuthProvider>
              <SyncProvider>
                {/* On a font error we carry on with system fonts rather than block the app. */}
                <RootStack fontsReady={fontsLoaded || fontError !== null} />
              </SyncProvider>
            </AuthProvider>
          </RecordsProvider>
        </OnboardingProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function RootStack({ fontsReady }: { fontsReady: boolean }) {
  const { isLoaded } = useOnboarding();
  const { colors } = useTheme();
  const ready = fontsReady && isLoaded;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(main)" options={{ animation: 'fade' }} />
        <Stack.Screen name="login" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      </Stack>
    </>
  );
}
