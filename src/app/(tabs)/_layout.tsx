import React, { useEffect, useMemo } from 'react';
import { Tabs, useRouter } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { BottomNavigation } from '../../components/BottomNavigation';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { tabTransition } from '../../navigation/tabTransition';
import { usePartnerNavigation, type PartnerTab } from '../../navigation/usePartnerNavigation';
import { usePartner } from '../../partner/PartnerProvider';
import { colors } from '../../theme/colors';

/** Mount the other tabs once Earnings has settled, so even the first switch is instant. */
const PRELOAD_DELAY_MS = 1200;

const TABS: readonly { key: PartnerTab; label: string; icon: string; title: string }[] = [
  { key: 'dashboard', label: 'Earnings', icon: 'payments', title: 'Earnings & Home' },
  { key: 'requests', label: 'Requests', icon: 'notifications-active', title: 'Live Requests' },
  { key: 'schedule', label: 'Schedule', icon: 'event', title: 'Schedule' },
  { key: 'profile', label: 'Profile', icon: 'account-circle', title: 'Profile & Bank' },
];

const isTab = (name: string | undefined): name is PartnerTab => TABS.some((tab) => tab.key === name);

/** The floating bar, drawn once for all four pages; Requests carries a dot while one is waiting. */
function PartnerTabBar({ state }: BottomTabBarProps) {
  const name = state.routes[state.index]?.name;
  const current: PartnerTab = isTab(name) ? name : 'dashboard';
  const { online, incoming } = usePartner();
  const { toTab } = usePartnerNavigation();
  const tabs = useMemo(
    () => TABS.map((tab) => (tab.key === 'requests' ? { ...tab, badge: online && incoming !== null } : tab)),
    [online, incoming]
  );

  return (
    <BottomNavigation
      tabs={tabs}
      current={current}
      onChange={(tab) => {
        if (tab !== current) toTab(tab);
      }}
    />
  );
}

/**
 * Earnings, Requests, Schedule and Profile & Bank are four tab routes that
 * stay mounted, so switching is a quick shift instead of a stack push.
 */
export default function TabsLayout() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const timer = setTimeout(() => {
      for (const tab of TABS) {
        if (tab.key !== 'dashboard') router.prefetch(`/${tab.key}`);
      }
    }, PRELOAD_DELAY_MS);
    return () => clearTimeout(timer);
  }, [router]);

  const screenOptions = useMemo(
    () => ({
      headerShown: false,
      sceneStyle: { backgroundColor: colors.canvas },
      ...tabTransition(reduceMotion),
    }),
    [reduceMotion]
  );

  return (
    <Tabs backBehavior="firstRoute" tabBar={(props) => <PartnerTabBar {...props} />} screenOptions={screenOptions}>
      {TABS.map((tab) => (
        <Tabs.Screen key={tab.key} name={tab.key} options={{ title: tab.title }} />
      ))}
    </Tabs>
  );
}
