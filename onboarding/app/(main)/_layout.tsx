import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router/js-tabs';
import type { ColorValue } from 'react-native';

import type { CommunityIconName } from '@/constants/icons';
import { TAB_LOOK, TAB_ROUTES, tabsFor } from '@/constants/roleNav';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useTheme } from '@/theme';

const icon =
  (name: CommunityIconName) =>
  ({ color, size }: { color: ColorValue; size: number }) => (
    // The tab bar only ever passes our string tints; numbers and null are part of the wider type.
    <MaterialCommunityIcons name={name} size={size} color={typeof color === 'number' ? undefined : (color ?? undefined)} />
  );

// Each role gets its own five tabs (see constants/roleNav.ts). Every screen stays a route, so Home
// shortcuts can still open one that is not on the bar.
export default function MainTabs() {
  const { colors, fonts } = useTheme();
  const { state } = useOnboarding();
  const visible = tabsFor(state.role);
  // Tab order comes from declaration order, so visible tabs go first, in the role's order.
  const ordered = [...visible, ...TAB_ROUTES.filter((r) => !visible.includes(r))];

  return (
    <Tabs
      // A new role means a new tab bar; remount so the order resets.
      key={state.role ?? 'none'}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontFamily: fonts.sansSemiBold, fontSize: 12 },
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, minHeight: 64 },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      {ordered.map((route) => (
        <Tabs.Screen
          key={route}
          name={route}
          options={{
            title: TAB_LOOK[route].title,
            tabBarIcon: icon(TAB_LOOK[route].icon),
            ...(visible.includes(route) ? null : { href: null }),
          }}
        />
      ))}
    </Tabs>
  );
}
