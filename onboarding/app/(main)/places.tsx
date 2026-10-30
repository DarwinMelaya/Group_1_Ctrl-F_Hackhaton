import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { AppText, ScreenContainer, TextLink } from '@/components';
import { getMunicipality } from '@/constants/municipalities';
import { GALLERY, PLACES, type GalleryPhoto } from '@/constants/places';

import { colors, useTheme } from '@/theme';

const PHOTOS: GalleryPhoto[] = [
  ...GALLERY,
  ...PLACES.flatMap((p) => (p.photo && !GALLERY.some((g) => g.id === p.id || g.photo.source === p.photo?.source) ? [{ id: p.id, name: p.name, town: p.town, about: p.about, photo: p.photo }] : [])),
];

// A photo gallery of the coastal places. The map holds the list and directions; this is for looking.
// Photos with credit: freely licensed ones from Wikimedia Commons and ones supplied by the team.
export default function GalleryScreen() {
  const router = useRouter();
  const { spacing, radii } = useTheme();
  const [view, setView] = useState<GalleryPhoto | null>(null);

  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      <View style={{ gap: spacing.xs, marginTop: spacing.md, marginBottom: spacing.lg }}>
        <AppText variant="title" accessibilityRole="header">
          Gallery
        </AppText>
        <AppText variant="body" color="textMuted">
          The beaches and islands of Marinduque. Tap a photo to see it bigger.
        </AppText>
      </View>

      <View style={styles.grid}>
        {PHOTOS.map((p, i) => (
          <Pressable
            key={p.id}
            onPress={() => setView(p)}
            accessibilityRole="imagebutton"
            accessibilityLabel={`Photo of ${p.name}`}
            style={({ pressed }) => [i === 0 ? styles.wide : styles.half, { borderRadius: radii.lg, opacity: pressed ? 0.85 : 1 }]}
          >
            <Image source={p.photo.source} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityIgnoresInvertColors />
            <View style={styles.caption}>
              <AppText variant="label" style={{ color: colors.white }} numberOfLines={1}>
                {p.name}
              </AppText>
              <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.85)' }} numberOfLines={1}>
                {getMunicipality(p.town)?.name}
              </AppText>
            </View>
          </Pressable>
        ))}
      </View>

      <View style={{ marginTop: spacing.lg, gap: spacing.sm, alignItems: 'flex-start' }}>
        <TextLink label="Find them on the map" onPress={() => router.push('/map')} />
        <TextLink label="How to visit responsibly" onPress={() => router.push('/guide')} />
      </View>

      <Modal visible={!!view} transparent animationType="fade" onRequestClose={() => setView(null)} statusBarTranslucent>
        <Pressable style={styles.viewer} onPress={() => setView(null)} accessibilityRole="button" accessibilityLabel="Close photo">
          {view ? (
            <Animated.View entering={FadeIn.duration(200)} style={{ width: '100%', gap: spacing.sm }}>
              <Image source={view.photo.source} style={styles.full} resizeMode="contain" accessibilityIgnoresInvertColors />
              <View style={{ paddingHorizontal: spacing.lg, gap: 2 }}>
                <AppText variant="heading" style={{ color: colors.white }}>
                  {view.name}
                </AppText>
                <AppText variant="body" style={{ color: 'rgba(255,255,255,0.85)' }}>
                  {view.about}
                </AppText>
                <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.6)', marginTop: spacing.xs }}>
                  {view.photo.credit} · Tap anywhere to close
                </AppText>
              </View>
            </Animated.View>
          ) : null}
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  wide: { width: '100%', aspectRatio: 3 / 2, overflow: 'hidden', justifyContent: 'flex-end' },
  half: { width: '48.5%', aspectRatio: 1, overflow: 'hidden', justifyContent: 'flex-end' },
  caption: { padding: 10, backgroundColor: 'rgba(11,34,53,0.55)' },
  viewer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center' },
  full: { width: '100%', aspectRatio: 4 / 3 },
});
