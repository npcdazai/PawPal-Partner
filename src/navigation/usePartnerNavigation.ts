import { useMemo } from 'react';
import { router } from 'expo-router';
import { useMascotActions } from '../mascot/MascotProvider';

/** The four bottom-nav pages; each is its own route in `src/app/(tabs)`. */
export type PartnerTab = 'dashboard' | 'requests' | 'schedule' | 'profile';

/** Clears the registration stack so Back can't return to it. */
const resetTo = (path: '/' | '/dashboard') => {
  if (router.canDismiss()) router.dismissAll();
  router.replace(path);
};

/**
 * Every move between screens goes through Barnaby: forward CTAs play his
 * 380ms exit before the next screen mounts, back moves and tab switches go
 * at once (on a tab switch he is simply already standing in the next slot).
 */
export function usePartnerNavigation() {
  const { navigate } = useMascotActions();

  return useMemo(
    () => ({
      toKyc: () => navigate(() => router.push('/register-kyc')),
      toCareProfile: () => navigate(() => router.push('/register-profile')),
      toDashboard: () => navigate(() => resetTo('/dashboard')),
      /** `then` runs as the splash replaces this screen (e.g. clearing the session). */
      toSplash: (then?: () => void) =>
        navigate(() => {
          then?.();
          resetTo('/');
        }),
      back: () => navigate(() => router.back(), 'back'),
      toTab: (tab: PartnerTab) => navigate(() => router.navigate(`/${tab}`), 'forward', { inPlace: true }),
    }),
    [navigate]
  );
}
