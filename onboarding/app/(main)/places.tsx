import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';

import { AppText, ConditionsCard, IconBadge, ScreenContainer, SeaScene, TextLink } from '@/components';
import { getMunicipality } from '@/constants/municipalities';
import { PLACES, type Place } from '@/constants/places';
import { useSeaConditions } from '@/hooks/useSeaConditions';
import { useTheme } from '@/theme';

export default function PlacesScreen() {
  const router = useRouter();
  const { spacing } = useTheme();
  const [open, setOpen] = useState<string | null>(null);

  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      <View style={{ gap: spacing.xs, marginTop: spacing.md, marginBottom: spacing.lg }}>
        <AppText variant="title" accessibilityRole="header">
          Places to visit
        </AppText>
        <AppText variant="body" color="textMuted">
          Beaches, islands and reefs around Marinduque. Open one to see today's sea before you book a boat.
        </AppText>
      </View>

      <View style={{ gap: spacing.sm }}>
        {PLACES.map((p) => (
          <PlaceCard key={p.id} place={p} open={open === p.id} onToggle={() => setOpen(open === p.id ? null : p.id)} />
        ))}
      </View>

      <View style={{ marginTop: spacing.lg, alignItems: 'flex-start' }}>
        <TextLink label="How to visit responsibly" onPress={() => router.push('/guide')} />
      </View>
    </ScreenContainer>
  );
}

function PlaceCard({ place, open, onToggle }: { place: Place; open: boolean; onToggle: () => void }) {
  const { colors, spacing, radii } = useTheme();
  const town = getMunicipality(place.town);

  return (
    <Animated.View
      layout={LinearTransition.duration(180)}
      style={[styles.card, { borderRadius: radii.lg, borderColor: open ? colors.selected : colors.border, borderWidth: open ? 2 : 1.5, backgroundColor: colors.surface }]}
    >
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${place.name}, ${place.kind}, ${town?.name ?? ''}`}
        style={({ pressed }) => [styles.row, { gap: spacing.md, padding: spacing.md, backgroundColor: pressed ? colors.surfaceMuted : 'transparent' }]}
      >
        <IconBadge icon={place.icon} tone="reef" size="md" />
        <View style={styles.flex}>
          <AppText variant="heading">{place.name}</AppText>
          <AppText variant="caption" color="textMuted">
            {place.kind} · {town?.name}
          </AppText>
        </View>
        <MaterialCommunityIcons name={open ? 'chevron-up' : 'chevron-down'} size={24} color={colors.textMuted} />
      </Pressable>
      {open ? <PlaceDetail place={place} /> : null}
    </Animated.View>
  );
}

function PlaceDetail({ place }: { place: Place }) {
  const { spacing, radii, tones } = useTheme();
  const town = getMunicipality(place.town);
  const { state, refreshing, refresh } = useSeaConditions(town);
  const wave = state.status === 'ready' ? state.data.waveHeightM : null;

  return (
    <Animated.View entering={FadeIn.duration(180)} style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.md, gap: spacing.sm }}>
      <AppText variant="body">{place.about}</AppText>
      <View style={[styles.row, styles.top, { gap: spacing.sm, padding: spacing.sm, borderRadius: radii.sm, backgroundColor: tones.mangrove.bg }]}>
        <MaterialCommunityIcons name="leaf" size={20} color={tones.mangrove.fg} />
        <AppText variant="caption" style={styles.flex}>
          {place.tip}
        </AppText>
      </View>
      <SeaScene waveHeightM={wave} height={140} />
      <ConditionsCard townName={town?.name ?? 'the area'} state={state} refreshing={refreshing} onRetry={refresh} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center' },
  top: { alignItems: 'flex-start' },
  flex: { flex: 1 },
});
