import { useRouter } from 'expo-router';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import {
  AppText,
  Button,
  HeroIllustration,
  ScreenContainer,
  TextLink,
  WaveDivider,
} from '@/components';
import { APP_NAME, APP_TAGLINE } from '@/constants/app';
import { useTheme } from '@/theme';

export default function WelcomeScreen() {
  const router = useRouter();
  const { spacing, fonts } = useTheme();
  const { width, height } = useWindowDimensions();
  // Keep the hero from crowding out the text on short phones.
  const heroHeight = Math.min(width * 0.82, height * 0.4);

  return (
    <ScreenContainer
      padded={false}
      edges={['bottom', 'left', 'right']}
      footer={
        <>
          <Button
            label="Get started"
            trailingIcon="arrow-forward"
            onPress={() => router.push('/slides')}
          />
          <TextLink
            label="I already have an account"
            color="textMuted"
            accessibilityHint="Signing in is not available yet"
            onPress={() => {
              // Sign-in arrives with accounts; intentionally a no-op for now.
            }}
          />
        </>
      }
    >
      <HeroIllustration height={heroHeight} />

      <Animated.View
        entering={FadeInDown.duration(420).delay(120)}
        // Narrow right margin on purpose: the column leans left under the sun.
        style={[styles.copy, { paddingLeft: spacing.lg, paddingRight: spacing.xxl, gap: spacing.sm }]}
      >
        <AppText variant="eyebrow" color="accentText">
          Marinduque · Blue economy
        </AppText>
        <View>
          <AppText variant="hero" accessibilityRole="header">
            {APP_NAME}
          </AppText>
          <AppText variant="body" color="textMuted" style={{ fontFamily: fonts.serifItalic }}>
            for the seas of Marinduque
          </AppText>
        </View>
        <WaveDivider style={styles.wave} />
        <AppText variant="body">{APP_TAGLINE}</AppText>
      </Animated.View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  copy: { paddingTop: 16 },
  wave: { width: '46%', height: 18, marginVertical: 4 },
});
