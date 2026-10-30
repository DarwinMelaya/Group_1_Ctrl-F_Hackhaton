import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { AppText, Button, ScreenContainer, StepHeader } from '@/components';
import { LanguagePicker } from '@/components/LanguagePicker';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/theme';

// The first question after Welcome, so every screen after it is in the person's language.
// The heading is in both languages because nothing is chosen yet.
export default function LanguageScreen() {
  const router = useRouter();
  const { spacing } = useTheme();
  const { t, setLanguage, lang } = useLanguage();

  return (
    <ScreenContainer
      header={<StepHeader />}
      footer={
        <Button
          label={t('Continue', 'Tuloy')}
          trailingIcon="arrow-forward"
          onPress={async () => {
            await setLanguage(lang);
            router.push('/slides');
          }}
        />
      }
    >
      <View style={{ gap: spacing.xs, marginTop: spacing.md, marginBottom: spacing.lg }}>
        <AppText variant="title" accessibilityRole="header">
          Choose your language
        </AppText>
        <AppText variant="heading" color="textMuted">
          Piliin ang iyong wika
        </AppText>
      </View>
      <LanguagePicker />
      <AppText variant="caption" color="textMuted" style={{ marginTop: spacing.md }}>
        {t('You can change this later in More.', 'Puwede mo itong palitan mamaya sa Iba pa.')}
      </AppText>
    </ScreenContainer>
  );
}
