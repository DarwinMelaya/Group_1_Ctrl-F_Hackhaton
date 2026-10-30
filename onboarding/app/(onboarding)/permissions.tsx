import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';

import { AppText, Button, IconBadge, ScreenContainer, StepHeader } from '@/components';
import type { CommunityIconName } from '@/constants/icons';
import {
  requestLocationPermission,
  requestNotificationPermission,
  type PermissionResult,
} from '@/services/permissions';
import { useTheme, type Tone } from '@/theme';

type PermissionKind = 'location' | 'notifications';

interface PermissionStep {
  kind: PermissionKind;
  icon: CommunityIconName;
  tone: Tone;
  title: string;
  body: string;
  points: string[];
  request: () => Promise<PermissionResult>;
}

const STEPS: readonly PermissionStep[] = [
  {
    kind: 'location',
    icon: 'map-marker-radius',
    tone: 'reef',
    title: 'Show conditions where you are?',
    body: 'Used to show sea conditions and nearby reports. Never shared without your consent.',
    points: [
      'GPS works even when you have no mobile data.',
      'Only used while the app is open.',
      "You can switch it off anytime in your phone's settings.",
    ],
    request: requestLocationPermission,
  },
  {
    kind: 'notifications',
    icon: 'bell-ring-outline',
    tone: 'coral',
    title: 'Get weather and sea alerts?',
    body: 'We will tell you when strong winds or rough seas are expected around Marinduque, so you can decide before heading out.',
    points: [
      'Only alerts that matter for your area.',
      'No ads and no promotions, ever.',
    ],
    request: requestNotificationPermission,
  },
];

type Results = Record<PermissionKind, PermissionResult>;

export default function PermissionsScreen() {
  const router = useRouter();
  const { colors, spacing, radii } = useTheme();
  const [stepIndex, setStepIndex] = useState(0);
  const [requesting, setRequesting] = useState(false);
  const [results, setResults] = useState<Results>({ location: 'denied', notifications: 'denied' });

  const step = STEPS[stepIndex] ?? STEPS[0]!;

  const goBack = useCallback(() => {
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
    else if (router.canGoBack()) router.back();
  }, [stepIndex, router]);

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        if (stepIndex === 0) return false;
        setStepIndex(stepIndex - 1);
        return true;
      });
      return () => sub.remove();
    }, [stepIndex]),
  );

  const advance = (result: PermissionResult) => {
    const next = { ...results, [step.kind]: result };
    setResults(next);
    if (stepIndex < STEPS.length - 1) {
      setStepIndex(stepIndex + 1);
      return;
    }
    router.push({
      pathname: '/ready',
      params: { location: next.location, notifications: next.notifications },
    });
  };

  const handleAllow = async () => {
    setRequesting(true);
    const result = await step.request();
    setRequesting(false);
    advance(result);
  };

  return (
    <ScreenContainer
      header={<StepHeader step={3} total={3} onBack={goBack} />}
      footer={
        <>
          <Button label="Allow" loading={requesting} onPress={handleAllow} />
          <Button
            label="Not now"
            variant="ghost"
            disabled={requesting}
            accessibilityHint="You can turn this on later in settings"
            onPress={() => advance('denied')}
          />
        </>
      }
    >
      <Animated.View
        key={step.kind}
        entering={FadeInRight.duration(280)}
        style={[styles.content, { gap: spacing.md, paddingTop: spacing.xl }]}
      >
        <IconBadge icon={step.icon} tone={step.tone} size="lg" style={{ marginBottom: spacing.xs }} />
        <AppText variant="eyebrow" color="textMuted">
          {stepIndex + 1} of {STEPS.length} · Optional
        </AppText>
        <AppText variant="title" accessibilityRole="header">
          {step.title}
        </AppText>
        <AppText variant="body">{step.body}</AppText>

        <View
          style={{
            gap: spacing.sm,
            padding: spacing.md,
            marginTop: spacing.xs,
            borderRadius: radii.md,
            backgroundColor: colors.surfaceMuted,
          }}
        >
          {step.points.map((point) => (
            <View key={point} style={[styles.point, { gap: spacing.sm }]}>
              <MaterialIcons name="check" size={20} color={colors.success} style={styles.pointIcon} />
              <AppText variant="caption" style={styles.pointText}>
                {point}
              </AppText>
            </View>
          ))}
        </View>
      </Animated.View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1 },
  point: { flexDirection: 'row', alignItems: 'flex-start' },
  pointIcon: { marginTop: 1 },
  pointText: { flex: 1 },
});
