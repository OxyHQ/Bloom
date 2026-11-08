import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { Platform } from 'react-native';

import { loadHaptics, warnHapticsUnavailable } from './haptics-module';

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

      const haptics = loadHaptics();
      if (!haptics) {
        warnHapticsUnavailable();
        return;
      }

      const { ImpactFeedbackStyle } = haptics;
      let style = ImpactFeedbackStyle.Light;
      if (Platform.OS !== 'android') {
        if (strength === 'medium') style = ImpactFeedbackStyle.Medium;
        else if (strength === 'heavy') style = ImpactFeedbackStyle.Heavy;
      }

      void haptics.impactAsync(style).catch(() => {});
    },
    [enabled],
  );
}

/** Feedback described by the user action rather than motor strength. */
export interface HapticFeedback {
  tap(): void;
  confirm(): void;
  selection(): void;
  toggle(on: boolean): void;
  success(): void;
  error(): void;
}

/**
 * Semantic haptics honoring the same provider and optional-peer behavior as
 * `useHaptics`. Selection and notifications fall back to a light impact when
 * the installed peer does not expose those methods.
 */
export function useHapticFeedback(): HapticFeedback {
  const { enabled } = useContext(BloomHapticsContext);
  const impact = useHaptics();

  return useMemo(() => {
    function play(kind: 'selection' | 'success' | 'error') {
      if (!enabled || Platform.OS === 'web') return;
      const haptics = loadHaptics();
      if (!haptics) {
        warnHapticsUnavailable();
        return;
      }
      const result =
        kind === 'selection'
          ? haptics.selectionAsync?.()
          : haptics.NotificationFeedbackType && haptics.notificationAsync
            ? haptics.notificationAsync(
                kind === 'success'
                  ? haptics.NotificationFeedbackType.Success
                  : haptics.NotificationFeedbackType.Error,
              )
            : undefined;
      if (result) void result.catch(() => {});
      else impact('light');
    }

    return {
      tap: () => impact('light'),
      confirm: () => impact('medium'),
      selection: () => play('selection'),
      toggle: (_on: boolean) => play('selection'),
      success: () => play('success'),
      error: () => play('error'),
    };
  }, [enabled, impact]);
}
