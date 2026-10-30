import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './AppText';

interface StepHeaderProps {
  step?: number;
  total?: number;
  // Lets a screen handle back itself, e.g. to step back within the screen.
  onBack?: () => void;
}

export function StepHeader({ step, total, onBack }: StepHeaderProps) {
  const router = useRouter();
  const { colors, spacing, touchTarget } = useTheme();
  const showProgress = step !== undefined && total !== undefined;

  const handleBack = () => {
    if (onBack) onBack();
    else if (router.canGoBack()) router.back();
  };

  return (
    <View style={[styles.row, { paddingVertical: spacing.xs }]}>
      <Pressable
        onPress={handleBack}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        style={({ pressed }) => [
          styles.back,
          {
            width: touchTarget,
            height: touchTarget,
            borderRadius: touchTarget / 2,
            backgroundColor: pressed ? colors.surfaceMuted : 'transparent',
          },
        ]}
      >
        <MaterialIcons name="arrow-back" size={26} color={colors.text} />
      </Pressable>

      {showProgress ? (
        <View
          style={[styles.progress, { gap: spacing.sm, paddingRight: spacing.xs }]}
          accessible
          accessibilityLabel={`Step ${step} of ${total}`}
        >
          <AppText variant="caption" color="textMuted">
            Step {step} of {total}
          </AppText>
          <View style={styles.segments}>
            {Array.from({ length: total }, (_, i) => (
              <View
                key={i}
                style={[
                  styles.segment,
                  { backgroundColor: i < step ? colors.selected : colors.border },
                ]}
              />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { alignItems: 'center', justifyContent: 'center' },
  progress: { flexDirection: 'row', alignItems: 'center' },
  segments: { flexDirection: 'row', gap: 4 },
  segment: { width: 18, height: 6, borderRadius: 3 },
});
