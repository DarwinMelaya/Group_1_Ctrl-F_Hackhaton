import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, kg, TextLink } from '@/components';
import { LeafletMap } from '@/components/map/LeafletMap';
import type { LeafletMapHandle, MapData } from '@/components/map/types';
import type { CommunityIconName } from '@/constants/icons';
import { SAMPLE_DATA, ZONE_LOOK, ZONE_TYPES } from '@/constants/zones';
import { useLocationFix } from '@/hooks/useLocationFix';
import { useRecords } from '@/hooks/useRecords';
import { useZones } from '@/hooks/useZones';
import { zonesAt, type Zone } from '@/services/zones';
import { useTheme } from '@/theme';

export default function MapScreen() {
  const router = useRouter();
  const { colors, spacing, radii } = useTheme();
  const mapRef = useRef<LeafletMapHandle>(null);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const { state: zonesState, refresh } = useZones();
  const location = useLocationFix();
  const { catches } = useRecords();
  const [selected, setSelected] = useState<string | null>(null);
  const [mapFailed, setMapFailed] = useState(false);
  const [wantFocusMe, setWantFocusMe] = useState(false);

  const zones = useMemo(() => (zonesState.status === 'ready' ? zonesState.data.zones : []), [zonesState]);

  const data = useMemo<MapData>(
    () => ({
      zones: zones.map((z) => ({ id: z.id, name: z.name, type: z.type, color: ZONE_LOOK[z.type].color, geometry: z.geometry })),
      me: location.fix,
      catches: catches
        .filter((c) => c.location)
        .slice(0, 100)
        .map((c) => ({
          lat: c.location!.lat,
          lng: c.location!.lng,
          title: c.speciesLocalName,
          subtitle: `${kg(c.weightKg)} · ${new Date(c.caughtAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}`,
        })),
    }),
    [zones, location.fix, catches],
  );

  // Fly to the user once a fix arrives after tapping "my location".
  useEffect(() => {
    if (wantFocusMe && location.fix) {
      mapRef.current?.command({ type: 'focusMe' });
      setWantFocusMe(false);
    }
  }, [wantFocusMe, location.fix]);

  const focusZone = (id: string) => {
    setSelected(id);
    mapRef.current?.command({ type: 'focusZone', id });
  };

  const here = location.fix ? zonesAt(zones, location.fix.lat, location.fix.lng) : null;
  const selectedZone = zones.find((z) => z.id === selected);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.flex, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: spacing.sm }]}>
        <AppText variant="title" accessibilityRole="header" style={styles.flex}>
          Map
        </AppText>
        {SAMPLE_DATA ? (
          <View style={[styles.sample, { borderRadius: radii.pill, borderColor: colors.borderStrong }]}>
            <AppText variant="caption" color="textMuted" style={styles.small}>
              SAMPLE DATA
            </AppText>
          </View>
        ) : null}
      </View>

      <View style={[styles.mapBox, { marginHorizontal: spacing.md, borderRadius: radii.lg, borderColor: colors.border }]}>
        <LeafletMap ref={mapRef} data={data} onZonePress={focusZone} onError={() => setMapFailed(true)} style={StyleSheet.absoluteFill} />
        {mapFailed ? (
          <View style={[StyleSheet.absoluteFill, styles.center, { backgroundColor: colors.surfaceMuted, padding: spacing.lg, gap: spacing.xs }]}>
            <MaterialCommunityIcons name="wifi-off" size={28} color={colors.textMuted} />
            <AppText variant="label" align="center">
              The map needs signal to load
            </AppText>
            <AppText variant="caption" color="textMuted" align="center">
              The zone check below still works from the copy on your phone.
            </AppText>
          </View>
        ) : null}
        <View style={[styles.fabs, { gap: spacing.xs, right: spacing.sm, bottom: spacing.lg }]}>
          <Fab
            icon="crosshairs-gps"
            label="Show my location"
            busy={location.state.status === 'locating'}
            onPress={() => {
              if (location.fix) mapRef.current?.command({ type: 'focusMe' });
              else setWantFocusMe(true);
              location.locate();
            }}
          />
          <Fab icon="island" label="Show all of Marinduque" onPress={() => mapRef.current?.command({ type: 'home' })} />
        </View>
      </View>

      <ScrollView ref={scrollRef} style={styles.flex} contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.md }}>
        <HereCard here={here} locating={location.state.status === 'locating'} denied={location.state.status === 'denied'} onLocate={location.locate} />

        {zonesState.status === 'needsSignIn' ? (
          <Notice icon="account-key-outline" text="Sign in once to load the zones. After that they stay on your phone, even without signal." action={{ label: 'Sign in', onPress: () => router.push('/login') }} />
        ) : zonesState.status === 'error' ? (
          <Notice icon="wifi-off" text="Could not load the zones. Check your signal." action={{ label: 'Try again', onPress: refresh }} />
        ) : zonesState.status === 'ready' && zonesState.stale ? (
          <Notice
            icon="cellphone-check"
            text={`Zones saved on your phone ${new Date(zonesState.data.fetchedAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}.`}
            action={{ label: 'Update', onPress: refresh }}
          />
        ) : null}

        {selectedZone ? <ZoneDetail zone={selectedZone} onClose={() => setSelected(null)} /> : null}

        <View style={{ gap: spacing.xs }}>
          <AppText variant="eyebrow" color="textMuted" accessibilityRole="header">
            What the colors mean
          </AppText>
          <View style={[styles.legend, { gap: spacing.xs }]}>
            {ZONE_TYPES.map((t) => (
              <View key={t} style={[styles.legendItem, { gap: 6, padding: spacing.xs, borderRadius: radii.sm, backgroundColor: colors.surface }]}>
                <View style={[styles.swatch, { backgroundColor: ZONE_LOOK[t].color }]} />
                <MaterialCommunityIcons name={ZONE_LOOK[t].icon} size={16} color={ZONE_LOOK[t].color} />
                <AppText variant="caption">{ZONE_LOOK[t].label}</AppText>
              </View>
            ))}
          </View>
        </View>

        {zones.length > 0 ? (
          <View style={{ gap: spacing.xs }}>
            <AppText variant="eyebrow" color="textMuted" accessibilityRole="header">
              Zones ({zones.length})
            </AppText>
            <View style={[styles.card, { borderRadius: radii.lg, borderColor: colors.border, backgroundColor: colors.surface }]}>
              {zones.map((z, i) => (
                <Pressable
                  key={z.id}
                  onPress={() => {
                    focusZone(z.id);
                    scrollRef.current?.scrollTo({ y: 0, animated: true });
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`${z.name}, ${ZONE_LOOK[z.type].label}. Show on map`}
                  style={({ pressed }) => [
                    styles.zoneRow,
                    {
                      gap: spacing.sm,
                      padding: spacing.md,
                      borderTopWidth: i === 0 ? 0 : StyleSheet.hairlineWidth,
                      borderTopColor: colors.borderStrong,
                      backgroundColor: pressed || selected === z.id ? colors.surfaceMuted : 'transparent',
                    },
                  ]}
                >
                  <View style={[styles.bar, { backgroundColor: ZONE_LOOK[z.type].color }]} />
                  <View style={styles.flex}>
                    <AppText variant="label">{z.name}</AppText>
                    <AppText variant="caption" color="textMuted">
                      {ZONE_LOOK[z.type].label}
                      {z.areaHa ? ` · ${Math.round(z.areaHa).toLocaleString('en-PH')} ha` : ''}
                    </AppText>
                  </View>
                  <MaterialCommunityIcons name="crosshairs" size={20} color={colors.textMuted} />
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        <AppText variant="caption" color="textMuted">
          Map data © OpenStreetMap contributors.{SAMPLE_DATA ? ' Zone outlines are sample data, not official ordinances.' : ''} When in doubt, ask
          the MAO or Bantay Dagat.
        </AppText>
      </ScrollView>
    </SafeAreaView>
  );
}

// "Can I fish here?" from the phone's GPS and the zones saved on the phone. Works offline.
function HereCard({ here, locating, denied, onLocate }: { here: Zone[] | null; locating: boolean; denied: boolean; onLocate: () => void }) {
  const { colors, spacing, radii } = useTheme();
  const box = [styles.card, styles.hereRow, { gap: spacing.md, padding: spacing.md, borderRadius: radii.lg, borderColor: colors.border, backgroundColor: colors.surface }];

  if (!here) {
    return (
      <View style={box}>
        <MaterialCommunityIcons name="map-marker-question-outline" size={30} color={colors.textMuted} />
        <View style={styles.flex}>
          <AppText variant="heading">Where am I?</AppText>
          <AppText variant="caption" color="textMuted">
            {locating ? 'Finding your location…' : denied ? "Location is off. Allow it in your phone's settings." : 'Check if you are inside a sanctuary or restricted area.'}
          </AppText>
        </View>
        {locating ? null : <TextLink label="Check" onPress={onLocate} />}
      </View>
    );
  }

  // The strictest zone wins: sanctuary, then restricted, pollution, safe.
  const order = ['sanctuary', 'restricted', 'pollution', 'safe'] as const;
  const top = [...here].sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type))[0];

  if (!top) {
    return (
      <Animated.View entering={FadeIn.duration(200)} style={box}>
        <MaterialCommunityIcons name="map-marker-check-outline" size={30} color={colors.selected} />
        <View style={styles.flex}>
          <AppText variant="heading">Not inside a marked zone</AppText>
          <AppText variant="caption" color="textMuted">
            Usual fishing rules apply. Zones near you are on the map.
          </AppText>
        </View>
      </Animated.View>
    );
  }

  const look = ZONE_LOOK[top.type];
  return (
    <Animated.View entering={FadeIn.duration(200)} style={[...box, { borderColor: look.color, borderWidth: 2 }]} accessibilityLiveRegion="polite">
      <MaterialCommunityIcons name={look.icon} size={30} color={look.color} />
      <View style={styles.flex}>
        <AppText variant="caption" style={{ color: look.color, fontWeight: '700' }}>
          You are inside · {look.label}
        </AppText>
        <AppText variant="heading">{top.name}</AppText>
        <AppText variant="caption" color="textMuted">
          {look.guidance}
        </AppText>
      </View>
    </Animated.View>
  );
}

function ZoneDetail({ zone, onClose }: { zone: Zone; onClose: () => void }) {
  const { colors, spacing, radii } = useTheme();
  const look = ZONE_LOOK[zone.type];
  return (
    <Animated.View
      entering={FadeIn.duration(180)}
      style={[styles.card, { gap: spacing.xs, padding: spacing.md, borderRadius: radii.lg, borderColor: look.color, borderWidth: 2, backgroundColor: colors.surface }]}
    >
      <View style={[styles.hereRow, { gap: spacing.xs }]}>
        <MaterialCommunityIcons name={look.icon} size={20} color={look.color} />
        <AppText variant="caption" style={[styles.flex, { color: look.color, fontWeight: '700' }]}>
          {look.label}
        </AppText>
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" hitSlop={12}>
          <MaterialCommunityIcons name="close" size={22} color={colors.textMuted} />
        </Pressable>
      </View>
      <AppText variant="heading">{zone.name}</AppText>
      <AppText variant="body">{look.guidance}</AppText>
      {zone.reason ? (
        <AppText variant="caption" color="textMuted">
          Why: {zone.reason}
        </AppText>
      ) : null}
    </Animated.View>
  );
}

function Notice({ icon, text, action }: { icon: CommunityIconName; text: string; action: { label: string; onPress: () => void } }) {
  const { colors, spacing, radii } = useTheme();
  return (
    <View style={[styles.hereRow, { gap: spacing.sm, padding: spacing.sm, paddingLeft: spacing.md, borderRadius: radii.md, backgroundColor: colors.surfaceMuted }]}>
      <MaterialCommunityIcons name={icon} size={22} color={colors.textMuted} />
      <AppText variant="caption" style={styles.flex}>
        {text}
      </AppText>
      <TextLink label={action.label} onPress={action.onPress} />
    </View>
  );
}

function Fab({ icon, label, onPress, busy = false }: { icon: CommunityIconName; label: string; onPress: () => void; busy?: boolean }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.fab, { backgroundColor: pressed ? colors.surfaceMuted : colors.surface, borderColor: colors.border }]}
    >
      <MaterialCommunityIcons name={busy ? 'dots-horizontal' : icon} size={24} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center' },
  sample: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2 },
  small: { fontSize: 12, lineHeight: 16, letterSpacing: 0.8 },
  mapBox: { height: '46%', minHeight: 260, overflow: 'hidden', borderWidth: 1.5 },
  center: { alignItems: 'center', justifyContent: 'center' },
  fabs: { position: 'absolute' },
  fab: { width: 48, height: 48, borderRadius: 24, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  card: { borderWidth: 1.5, overflow: 'hidden' },
  hereRow: { flexDirection: 'row', alignItems: 'center' },
  legend: { flexDirection: 'row', flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  swatch: { width: 12, height: 12, borderRadius: 3 },
  zoneRow: { flexDirection: 'row', alignItems: 'center' },
  bar: { width: 4, alignSelf: 'stretch', borderRadius: 2 },
});
