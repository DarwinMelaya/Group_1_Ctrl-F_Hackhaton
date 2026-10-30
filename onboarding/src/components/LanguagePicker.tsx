import { Pressable, StyleSheet, View } from 'react-native';

import { useLanguage, type Lang } from '@/hooks/useLanguage';
import { fonts, useTheme } from '@/theme';

import { AppText } from './AppText';

const OPTIONS: { id: Lang; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'fil', label: 'Tagalog' },
];

// Two big buttons for the app language. Each label is in its own language so anyone can find theirs.
export function LanguagePicker() {
  const { colors, radii, spacing } = useTheme();
  const { lang, setLanguage } = useLanguage();
  return (
    <View accessibilityRole="radiogroup" style={[styles.row, { gap: spacing.sm }]}>
      {OPTIONS.map((o) => {
        const on = lang === o.id;
        return (
          <Pressable
            key={o.id}
            onPress={() => setLanguage(o.id)}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            style={({ pressed }) => [
              styles.option,
              { borderRadius: radii.md, borderColor: on ? colors.primary : colors.border, backgroundColor: on ? colors.surfaceMuted : colors.surface, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <AppText variant="bodyStrong" style={{ color: on ? colors.primary : colors.text, fontFamily: fonts.sansBold }}>
              {o.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  option: { flex: 1, minHeight: 64, borderWidth: 2, paddingHorizontal: 14, paddingVertical: 10, justifyContent: 'center', alignItems: 'center' },
});
