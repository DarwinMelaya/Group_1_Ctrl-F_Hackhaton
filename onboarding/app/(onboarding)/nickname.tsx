import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AppText, Button, ScreenContainer, StepHeader, TextField } from '@/components';
import { useLanguage } from '@/hooks/useLanguage';
import { saveUsername, useUsername } from '@/hooks/useUsername';
import { useTheme } from '@/theme';

// Asked before the role: a nickname so the app can greet the person ("Hello, Juan!").
export default function NicknameScreen() {
  const router = useRouter();
  const { spacing } = useTheme();
  const { t } = useLanguage();
  const saved = useUsername();
  const [name, setName] = useState(saved ?? '');
  const ok = name.trim().length >= 2;

  const next = async () => {
    if (!ok) return;
    await saveUsername(name);
    router.push('/role');
  };

  return (
    <ScreenContainer
      header={<StepHeader step={1} total={4} />}
      footer={
        <Button
          label={t('Continue', 'Tuloy')}
          trailingIcon="arrow-forward"
          disabled={!ok}
          accessibilityHint={ok ? undefined : t('Type a nickname first', 'Maglagay muna ng palayaw')}
          onPress={next}
        />
      }
    >
      <View style={{ gap: spacing.xs, marginTop: spacing.md, marginBottom: spacing.lg }}>
        <AppText variant="title" accessibilityRole="header">
          {t('What should we call you?', 'Ano ang itatawag namin sa iyo?')}
        </AppText>
        <AppText variant="body" color="textMuted">
          {t('Your nickname, so MarAIne can greet you. It stays on this phone.', 'Ang palayaw mo, para mabati ka ng MarAIne. Sa phone mo lang ito naka-save.')}
        </AppText>
      </View>
      <TextField
        label={t('Nickname', 'Palayaw')}
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        autoComplete="nickname"
        maxLength={24}
        placeholder={t('e.g. Juan', 'hal. Juan')}
        returnKeyType="next"
        onSubmitEditing={next}
      />
    </ScreenContainer>
  );
}
