import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { BackHandler, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

import { AppText, Button, IconBadge, PagerDots, ScreenContainer, TextLink } from '@/components';
import { APP_NAME } from '@/constants/app';
import { ONBOARDING_SLIDES, type OnboardingSlide } from '@/constants/onboardingSlides';
import { useTheme } from '@/theme';

const LAST = ONBOARDING_SLIDES.length - 1;

export default function SlidesScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { spacing, fonts } = useTheme();
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollX = useSharedValue(0);
  const [index, setIndex] = useState(0);

  const progress = useDerivedValue(() => (width > 0 ? scrollX.value / width : 0));
  const onScroll = useAnimatedScrollHandler((event) => {
    scrollX.value = event.contentOffset.x;
  });

  const goTo = useCallback(
    (target: number) => {
      scrollRef.current?.scrollTo({ x: target * width, animated: true });
      setIndex(target);
    },
    [scrollRef, width],
  );

  const goToRole = () => router.push('/role');
  const handleNext = () => (index >= LAST ? goToRole() : goTo(index + 1));

  // Hardware back steps through slides before leaving the screen.
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        if (index === 0) return false;
        goTo(index - 1);
        return true;
      });
      return () => sub.remove();
    }, [index, goTo]),
  );

  return (
    <ScreenContainer
      scroll={false}
      padded={false}
      header={
        <View style={[styles.topBar, { paddingLeft: spacing.xs }]}>
          <AppText variant="heading" style={{ fontFamily: fonts.serif }}>
            {APP_NAME}
          </AppText>
          <TextLink label="Skip" color="textMuted" accessibilityHint="Skips the introduction" onPress={goToRole} />
        </View>
      }
      footer={
        <View style={[styles.footerRow, { gap: spacing.md }]}>
          <PagerDots count={ONBOARDING_SLIDES.length} activeIndex={index} progress={progress} />
          <Button
            label={index >= LAST ? 'Continue' : 'Next'}
            trailingIcon="arrow-forward"
            fullWidth={false}
            onPress={handleNext}
            style={styles.nextButton}
          />
        </View>
      }
    >
      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
      >
        {ONBOARDING_SLIDES.map((slide, i) => (
          <Slide key={slide.key} slide={slide} index={i} width={width} progress={progress} />
        ))}
      </Animated.ScrollView>
    </ScreenContainer>
  );
}

interface SlideProps {
  slide: OnboardingSlide;
  index: number;
  width: number;
  progress: SharedValue<number>;
}

function Slide({ slide, index, width, progress }: SlideProps) {
  const { spacing, tones } = useTheme();
  const tone = tones[slide.tone];

  // Content fades and drifts slightly slower than the page for a soft parallax.
  const animatedStyle = useAnimatedStyle(() => {
    const offset = progress.value - index;
    return {
      opacity: interpolate(Math.abs(offset), [0, 0.75], [1, 0], Extrapolation.CLAMP),
      transform: [{ translateX: interpolate(offset, [-1, 0, 1], [-48, 0, 48], Extrapolation.CLAMP) }],
    };
  });

  return (
    <ScrollView
      style={{ width }}
      contentContainerStyle={[styles.slide, { padding: spacing.lg, paddingTop: spacing.xl }]}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={[{ gap: spacing.md }, animatedStyle]}>
        <View style={[styles.badges, { marginBottom: spacing.md }]}>
          <IconBadge icon={slide.icon} tone={slide.tone} size="xl" />
          <IconBadge icon={slide.secondaryIcon} tone={slide.tone} size="md" solid style={styles.secondaryBadge} />
        </View>
        <AppText variant="eyebrow" style={{ color: tone.fg }}>
          {slide.eyebrow}
        </AppText>
        <AppText variant="display" accessibilityRole="header">
          {slide.title}
        </AppText>
        <AppText variant="body" color="textMuted">
          {slide.body}
        </AppText>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nextButton: { flexShrink: 1 },
  slide: { flexGrow: 1, justifyContent: 'center' },
  badges: { alignSelf: 'flex-start' },
  // Overlaps the bottom-right corner so the pair doesn't read as a template.
  secondaryBadge: { position: 'absolute', right: -18, bottom: -14, transform: [{ rotate: '-6deg' }] },
});
