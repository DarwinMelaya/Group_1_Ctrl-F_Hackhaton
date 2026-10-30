import { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './AppText';

interface TextFieldProps extends Omit<TextInputProps, 'style' | 'placeholderTextColor'> {
  label: string;
  helper?: string;
}

export function TextField({ label, helper, onFocus, onBlur, ...inputProps }: TextFieldProps) {
  const { colors, radii, spacing, typography } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={{ gap: spacing.xs }}>
      <AppText variant="label">{label}</AppText>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={helper}
        placeholderTextColor={colors.textMuted}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          typography.body,
          styles.input,
          {
            color: colors.text,
            backgroundColor: colors.surface,
            borderRadius: radii.md,
            borderColor: focused ? colors.selected : colors.borderStrong,
            borderWidth: focused ? 2 : 1.5,
            paddingHorizontal: spacing.md,
          },
        ]}
        {...inputProps}
      />
      {helper ? (
        <AppText variant="caption" color="textMuted">
          {helper}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: { minHeight: 56, paddingVertical: 12 },
});
