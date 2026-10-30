import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './AppText';

interface WeightStepperProps {
  // Kept as text so a half-typed "2." is not lost.
  value: string;
  onChange: (text: string) => void;
  step?: number;
  error?: string;
}

const MAX_KG = 5000; // catches.weight_kg check constraint

const format = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

// Big +/- buttons for wet or gloved hands; the number can also be typed.
export function WeightStepper({ value, onChange, step = 0.5, error }: WeightStepperProps) {
  const { colors, radii, spacing, typography, touchTarget } = useTheme();
  const n = Number.parseFloat(value.replace(',', '.'));
  const current = Number.isFinite(n) ? n : 0;

  const bump = (delta: number) => onChange(format(Math.min(MAX_KG, Math.max(0, Math.round((current + delta) * 10) / 10))));

  const sideButton = (icon: 'remove' | 'add', delta: number, label: string) => (
    <Pressable
      onPress={() => bump(delta)}
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={delta < 0 && current <= 0}
      style={({ pressed }) => [
        styles.side,
        {
          width: touchTarget + 8,
          height: touchTarget + 8,
          borderRadius: radii.md,
          backgroundColor: pressed ? colors.surfaceMuted : colors.surface,
          borderColor: colors.borderStrong,
          opacity: delta < 0 && current <= 0 ? 0.4 : 1,
        },
      ]}
    >
      <MaterialIcons name={icon} size={28} color={colors.text} />
    </Pressable>
  );

  return (
    <View style={{ gap: spacing.xs }}>
      <View style={[styles.row, { gap: spacing.sm }]}>
        {sideButton('remove', -step, `Less, minus ${step} kilo`)}
        <View
          style={[
            styles.field,
            { borderRadius: radii.md, borderColor: error ? colors.accent : colors.borderStrong, backgroundColor: colors.surface },
          ]}
        >
          <TextInput
            value={value}
            onChangeText={(t) => onChange(t.replace(/[^0-9.,]/g, ''))}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={colors.textMuted}
            accessibilityLabel="Weight in kilos"
            maxLength={7}
            style={[typography.title, styles.input, { color: colors.text }]}
          />
          <AppText variant="bodyStrong" color="textMuted">
            kg
          </AppText>
        </View>
        {sideButton('add', step, `More, plus ${step} kilo`)}
      </View>
      {error ? (
        <AppText variant="caption" color="accentText" accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  side: { alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  field: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, minHeight: 64, paddingHorizontal: 12, gap: 6 },
  input: { minWidth: 60, textAlign: 'right', fontVariant: ['tabular-nums'], paddingVertical: 4 },
});
