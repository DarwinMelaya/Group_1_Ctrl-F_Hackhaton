import { Tabs } from 'expo-router/js-tabs';
import { View } from 'react-native';

import { FloatingAsk } from '@/components/FloatingAsk';
import { TabBar } from '@/components/TabBar';
import { TAB_LOOK, TAB_ROUTES, tabsFor } from '@/constants/roleNav';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useTheme } from '@/theme';

// Each role gets its own five tabs (see constants/roleNav.ts). Every screen stays a route, so Home
// shortcuts can still open one that is not on the bar.
export default function MainTabs() {
  const { colors } = useTheme();
  const { state } = useOnboarding();
  const visible = tabsFor(state.role);
  // Tab order comes from declaration order, so visible tabs go first, in the role's order.
  const ordered = [...visible, ...TAB_ROUTES.filter((r) => !visible.includes(r))];

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        // A new role means a new tab bar; remount so the order resets.
        key={state.role ?? 'none'}
        tabBar={(props) => <TabBar state={props.state} navigateToTab={props.navigateToTab} visible={visible} />}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: colors.background },
        }}
      >
        {ordered.map((route) => (
          <Tabs.Screen
            key={route}
            name={route}
            options={{
              title: TAB_LOOK[route].title,
              // Not on this role's bar, but still reachable from Home. `href: null` would redirect to Home in SDK 58.
            ...(visible.includes(route) ? null : { tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }),
            }}
          />
        ))}
      </Tabs>
      <FloatingAsk />
    </View>
  );
}
