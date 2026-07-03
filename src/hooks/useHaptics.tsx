import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { Platform } from 'react-native';

import { lazyRequire } from '../utils/lazy-require';

/**
 * Lazily loads `expo-haptics`, returning `null` when it is not installed. The
 * dependency is an optional peer, so calls degrade to a no-op when absent.
 */
const getHapticsModule = lazyRequire<typeof import('expo-haptics')>('expo-haptics');

/** Impact strength requested by a caller. */
export type HapticStrength = 'light' | 'medium' | 'heavy';

interface BloomHapticsContextValue {
  enabled: boolean;
}

const BloomHapticsContext = createContext<BloomHapticsContextValue>({ enabled: true });

export interface BloomHapticsProviderProps {
  /** Globally enable or disable haptics for the subtree. Defaults to `true`. */
  enabled?: boolean;
  children?: React.ReactNode;
}

/**
 * Optional provider that toggles haptic feedback for its subtree — e.g. to honour
 * a user "reduce haptics" preference. `useHaptics` defaults to enabled when no
 * provider is present.
 */
export function BloomHapticsProvider({ enabled = true, children }: BloomHapticsProviderProps) {
  const value = useMemo(() => ({ enabled }), [enabled]);
  return <BloomHapticsContext.Provider value={value}>{children}</BloomHapticsContext.Provider>;
}

BloomHapticsProvider.displayName = 'BloomHapticsProvider';

/**
 * Returns a function that fires a haptic impact. The returned callback no-ops on
 * web, when haptics are disabled via {@link BloomHapticsProvider}, or when the
 * optional `expo-haptics` peer is not installed.
 *
 * `strength` defaults to `'light'`. Android is clamped to the light impact style
 * regardless of `strength` — its medium/heavy motors read as too strong for UI
 * feedback (tuned to match iOS perceived intensity).
 */
export function useHaptics(): (strength?: HapticStrength) => void {
  const { enabled } = useContext(BloomHapticsContext);

  return useCallback(
    (strength: HapticStrength = 'light') => {
      if (!enabled || Platform.OS === 'web') return;

      const haptics = getHapticsModule();
      if (!haptics) return;

      const { ImpactFeedbackStyle } = haptics;
      let style = ImpactFeedbackStyle.Light;
      if (Platform.OS !== 'android') {
        if (strength === 'medium') style = ImpactFeedbackStyle.Medium;
        else if (strength === 'heavy') style = ImpactFeedbackStyle.Heavy;
      }

      void haptics.impactAsync(style);
    },
    [enabled],
  );
}
