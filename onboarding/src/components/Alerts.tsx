import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getMunicipality } from '@/constants/municipalities';
import { useLanguage } from '@/hooks/useLanguage';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useZones } from '@/hooks/useZones';
import { checkWeather, checkZones, dismissBanner, markAllSeen, useAlerts, type Alert, type AlertLevel } from '@/services/alerts';
import { zonesAt } from '@/services/zones';
import { fonts, useTheme } from '@/theme';

import { AppText } from './AppText';

const LOOK: Record<AlertLevel, { icon: keyof typeof MaterialCommunityIcons.glyphMap; color: string }> = {
  danger: { icon: 'alert-octagon-outline', color: '#C2412D' },
  warn: { icon: 'alert-outline', color: '#B7791F' },
  good: { icon: 'check-circle-outline', color: '#2E7D4F' },
  info: { icon: 'information-outline', color: '#1F6FB2' },
};

const WEATHER_EVERY = 3 * 60 * 60_000;

// Runs in the background of the main tabs: watches the person's position against the zones, and
// checks the 24-hour sea outlook for their town. Shows the newest alert as a banner at the top.
export function AlertsWatcher() {
  const { lang } = useLanguage();
  const { state } = useOnboarding();
  const zones = useZones();
  const zoneList = zones.state.status === 'ready' ? zones.state.data.zones : [];
  const zonesRef = useRef(zoneList);
  const langRef = useRef(lang);
  useEffect(() => {
    zonesRef.current = zoneList;
    langRef.current = lang;
  });

  // Position against the zones. Only while location is already allowed; never asks by itself.
  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    let stopped = false;
    (async () => {
      try {
        const perm = await Location.getForegroundPermissionsAsync();
        if (perm.status !== 'granted' || stopped) return;
        sub = await Location.watchPositionAsync({ accuracy: Location.Accuracy.Balanced, distanceInterval: 50, timeInterval: 60_000 }, (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords;
          const list = zonesRef.current;
          if (list.length) checkZones(list, zonesAt(list, lat, lng), lat, lng, langRef.current);
        });
      } catch {
        // No location: zone reminders stay off.
      }
    })();
    return () => {
      stopped = true;
      sub?.remove();
    };
  }, []);

  // Weather for the chosen town, now and every 3 hours.
  const town = state.municipality ? getMunicipality(state.municipality) : undefined;
  useEffect(() => {
    if (!town) return;
    const run = () => checkWeather(town, langRef.current).catch(() => {});
    run();
    const id = setInterval(run, WEATHER_EVERY);
    return () => clearInterval(id);
  }, [town]);

  return <AlertBanner />;
}

function AlertBanner() {
  const { latest } = useAlerts();
  const { lang, t } = useLanguage();
  const { radii } = useTheme();
  const insets = useSafeAreaInsets();
  const shown = useRef<string | null>(null);

  // Hide on its own after 8 seconds.
  useEffect(() => {
    if (!latest) return;
    shown.current = latest.id;
    const id = setTimeout(() => {
      if (shown.current === latest.id) dismissBanner();
    }, 8000);
    return () => clearTimeout(id);
  }, [latest]);

  if (!latest) return null;
  const look = LOOK[latest.level];
  return (
    <Animated.View entering={FadeInUp.duration(250)} exiting={FadeOutUp.duration(200)} pointerEvents="box-none" style={[styles.bannerWrap, { top: insets.top + 8 }]}>
      <Pressable onPress={dismissBanner} accessibilityRole="alert" accessibilityHint={t('Tap to close', 'Pindutin para isara')} style={[styles.banner, { borderRadius: radii.lg, borderLeftColor: look.color }]}>
        <MaterialCommunityIcons name={look.icon} size={24} color={look.color} />
        <View style={{ flex: 1 }}>
          <AppText variant="label" style={{ fontFamily: fonts.sansBold }}>
            {latest.title[lang]}
          </AppText>
          <AppText variant="caption" color="textMuted" numberOfLines={3}>
            {latest.body[lang]}
          </AppText>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const ago = (at: number, t: (en: string, fil: string) => string) => {
  const m = Math.round((Date.now() - at) / 60_000);
  if (m < 1) return t('Just now', 'Ngayon lang');
  if (m < 60) return t(`${m} min ago`, `${m} minuto na`);
  const h = Math.round(m / 60);
  return h < 24 ? t(`${h} h ago`, `${h} oras na`) : t(`${Math.round(h / 24)} d ago`, `${Math.round(h / 24)} araw na`);
};

// The bell on Home: unread count, and the list of recent reminders.
export function AlertsBell() {
  const { colors: c, radii, spacing } = useTheme();
  const { lang, t } = useLanguage();
  const { list, unread } = useAlerts();
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();

  return (
    <>
      <Pressable
        onPress={() => {
          setOpen(true);
          markAllSeen();
        }}
        accessibilityRole="button"
        accessibilityLabel={unread ? t(`Reminders, ${unread} new`, `Mga abiso, ${unread} bago`) : t('Reminders', 'Mga abiso')}
        hitSlop={8}
        style={[styles.bell, { backgroundColor: 'rgba(255,255,255,0.18)' }]}
      >
        <MaterialCommunityIcons name={unread ? 'bell-ring-outline' : 'bell-outline'} size={22} color="#fff" />
        {unread ? (
          <View style={[styles.badge, { backgroundColor: c.accent }]}>
            <AppText variant="caption" style={{ color: '#fff', fontSize: 10, lineHeight: 13, fontFamily: fonts.sansBold }}>
              {unread > 9 ? '9+' : unread}
            </AppText>
          </View>
        ) : null}
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.scrim} onPress={() => setOpen(false)} accessibilityLabel={t('Close', 'Isara')} />
        <View style={[styles.sheet, { backgroundColor: c.background, borderTopLeftRadius: radii.lg + 8, borderTopRightRadius: radii.lg + 8, paddingBottom: insets.bottom + spacing.md }]}>
          <View style={[styles.row, { padding: spacing.lg, paddingBottom: spacing.sm }]}>
            <AppText variant="heading" accessibilityRole="header" style={{ flex: 1 }}>
              {t('Reminders', 'Mga abiso')}
            </AppText>
            <Pressable onPress={() => setOpen(false)} accessibilityRole="button" accessibilityLabel={t('Close', 'Isara')} hitSlop={8}>
              <MaterialCommunityIcons name="close" size={24} color={c.text} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.sm, paddingBottom: spacing.md }}>
            {list.length === 0 ? (
              <AppText variant="body" color="textMuted">
                {t('No reminders yet. You will see weather alerts for your town here, and a reminder when you are near a restricted area, a sanctuary or a safe fishing zone (with location on).', 'Wala pang abiso. Makikita rito ang abiso sa panahon sa bayan mo, at paalala kapag malapit ka sa bawal na lugar, santuwaryo o ligtas na pangisdaan (kapag naka-on ang lokasyon).')}
              </AppText>
            ) : (
              list.map((a: Alert) => (
                <View key={a.id} style={[styles.item, { borderRadius: radii.md, backgroundColor: c.surface, borderColor: c.border, borderLeftColor: LOOK[a.level].color }]}>
                  <MaterialCommunityIcons name={LOOK[a.level].icon} size={22} color={LOOK[a.level].color} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <AppText variant="label">{a.title[lang]}</AppText>
                    <AppText variant="caption" color="textMuted">
                      {a.body[lang]}
                    </AppText>
                    <AppText variant="caption" color="textMuted" style={{ fontSize: 11 }}>
                      {a.kind === 'zone' ? t('Zone', 'Zone') : t('Weather', 'Panahon')} · {ago(a.at, t)}
                    </AppText>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bannerWrap: { position: 'absolute', left: 12, right: 12, zIndex: 50 },
  banner: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderLeftWidth: 5,
    shadowColor: '#0E2A3B',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  bell: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: -2, right: -2, minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center' },
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { maxHeight: '75%' },
  row: { flexDirection: 'row', alignItems: 'center' },
  item: { flexDirection: 'row', gap: 10, padding: 12, borderWidth: 1, borderLeftWidth: 5 },
});
