import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { CommunityIconName } from '@/constants/icons';
import { TAB_LOOK, type TabRoute } from '@/constants/roleNav';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/theme';

import { AppText } from './AppText';

const glyphs = MaterialCommunityIcons.glyphMap as Record<string, number>;
// The active tab shows the filled version of its icon when there is one ("map-outline" -> "map").
const filled = (name: CommunityIconName): CommunityIconName => {
  const base = name.replace(/-outline$/, '');
  return (base !== name && base in glyphs ? base : name) as CommunityIconName;
};

interface Props {
  state: { index: number; routes: { key: string; name: string }[] };
  navigateToTab: (routeKey: string) => void;
  visible: readonly TabRoute[];
}

// A floating bar: rounded, raised off the edge, with a soft pill behind the current tab. Labels always
// show and every tab is a full-height target, so it stays easy to use with one thumb or in the sun.
export function TabBar({ state, navigateToTab, visible }: Props) {
  const { colors, radii } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const routes = state.routes.filter((r) => visible.includes(r.name as TabRoute));
  const current = state.routes[state.index]?.name;
  const active = Math.max(0, routes.findIndex((r) => r.name === current));

  const width = useSharedValue(0);
  const pos = useSharedValue(active);
  const reduce = useReducedMotion();
  useEffect(() => {
    pos.value = reduce ? withTiming(active, { duration: 0 }) : withSpring(active, { damping: 20, stiffness: 220, mass: 0.6 });
  }, [active, pos, reduce]);

  const pill = useAnimatedStyle(() => {
    const slot = width.value / Math.max(routes.length, 1);
    return { width: slot - 12, transform: [{ translateX: pos.value * slot + 6 }] };
  });

  return (
    <View style={{ backgroundColor: colors.background, paddingHorizontal: 12, paddingTop: 6, paddingBottom: Math.max(insets.bottom, 10) }}>
      <View
        accessibilityRole="tablist"
        onLayout={(e) => (width.value = e.nativeEvent.layout.width)}
        style={[styles.bar, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.lg + 6 }]}
      >
        <Animated.View pointerEvents="none" style={[styles.pill, { backgroundColor: colors.surfaceMuted, borderRadius: radii.lg }, pill]} />
        {routes.map((route, i) => {
          const on = i === active;
          const look = TAB_LOOK[route.name as TabRoute];
          return (
            <TabItem
              key={route.key}
              on={on}
              label={t(look.title, look.titleFil)}
              icon={on ? filled(look.icon) : look.icon}
              onPress={() => {
                if (!on) navigateToTab(route.key);
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

// One tab. The icon lifts a little while the pointer is over it (web, desktop) or a finger is on it.
function TabItem({ on, label, icon, onPress }: { on: boolean; label: string; icon: CommunityIconName; onPress: () => void }) {
  const { colors } = useTheme();
  const reduce = useReducedMotion();
  const lift = useSharedValue(0);
  const up = (v: number) => {
    lift.value = reduce ? v : withTiming(v, { duration: 160 });
  };
  const iconStyle = useAnimatedStyle(() => ({ transform: [{ translateY: lift.value * -5 }, { scale: 1 + lift.value * 0.08 }] }));
  const tint = on ? colors.primary : colors.textMuted;
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => up(1)}
      onHoverOut={() => up(0)}
      onPressIn={() => up(1)}
      onPressOut={() => up(0)}
      accessibilityRole="tab"
      accessibilityState={{ selected: on }}
      accessibilityLabel={label}
      style={styles.item}
    >
      <Animated.View style={iconStyle}>
        <MaterialCommunityIcons name={icon} size={24} color={tint} />
      </Animated.View>
      <AppText variant="caption" numberOfLines={1} style={{ fontSize: 11.5, lineHeight: 15, color: tint }}>
        {label}
      </AppText>
      <View style={[styles.dot, on && { backgroundColor: colors.primary }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    height: 66,
    borderWidth: 1,
    alignItems: 'stretch',
    shadowColor: '#0E2A3B',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  pill: { position: 'absolute', left: 0, top: 6, bottom: 6 },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 1 },
  dot: { width: 4, height: 4, borderRadius: 2, marginTop: 2 },
});
