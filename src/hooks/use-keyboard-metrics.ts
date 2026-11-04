import { useEffect, useState } from 'react';
import { Keyboard, Platform, type KeyboardEvent } from 'react-native';

/** Where the native software keyboard is. */
export type KeyboardMetrics = {
  /** Whether the keyboard is up. */
  visible: boolean;
  /** Its height, px; 0 while hidden. */
  height: number;
  /** Its top edge in screen coordinates, px; `null` while hidden. */
  top: number | null;
};

export type KeyboardMetricsOptions = {
  /** Subscribe at all; `false` reports a hidden keyboard. Defaults to `true`. */
  enabled?: boolean;
  /**
   * `'will'` follows iOS's `keyboardWillShow` / `keyboardWillHide`, announced
   * before the keyboard moves, for a page that must move with it. Android only
   * reports once the keyboard is up, so it always follows the `did` events.
   * Defaults to `'did'`.
   */
  timing?: 'did' | 'will';
};

const HIDDEN: KeyboardMetrics = { visible: false, height: 0, top: null };

const subscribable = () => Platform.OS !== 'web' && typeof Keyboard?.addListener === 'function';

function current(): KeyboardMetrics {
  if (!subscribable() || !(Keyboard.isVisible?.() ?? false)) return HIDDEN;
  const metrics = Keyboard.metrics?.();
  return { visible: true, height: metrics?.height ?? 0, top: metrics?.screenY ?? null };
}

/**
 * Where the native software keyboard is: whether it is up, its height and its
 * top edge. Always hidden on the web, where the browser resizes the visual
 * viewport instead of covering the page.
 */
export function useKeyboardMetrics({
  enabled = true,
  timing = 'did',
}: KeyboardMetricsOptions = {}): KeyboardMetrics {
  const [metrics, setMetrics] = useState(() => (enabled ? current() : HIDDEN));
  const will = timing === 'will' && Platform.OS === 'ios';

  useEffect(() => {
    if (!enabled || !subscribable()) return;
    setMetrics(current());
    const show = Keyboard.addListener(
      will ? 'keyboardWillShow' : 'keyboardDidShow',
      (event: KeyboardEvent) =>
        setMetrics({
          visible: true,
          height: event.endCoordinates.height,
          top: event.endCoordinates.screenY,
        }),
    );
    const hide = Keyboard.addListener(will ? 'keyboardWillHide' : 'keyboardDidHide', () =>
      setMetrics(HIDDEN),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, [enabled, will]);

  return enabled ? metrics : HIDDEN;
}
