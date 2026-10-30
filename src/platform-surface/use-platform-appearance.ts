import { useCallback, useRef, useSyncExternalStore } from 'react';

import { usePlatformAppearance } from './context';
import type { PlatformAppearanceState } from './types';

function unsubscribed() {}

/**
 * What the platform's appearance is now, or `null` when the adapter reports no
 * `appearance` capability. Re-renders when it changes. `BloomThemeProvider`
 * reads it once for the whole application: the accent becomes the palette's
 * preset and reduce transparency `useReducedTransparency()`, so a component
 * reads those, not this.
 */
export function usePlatformAppearanceState(): PlatformAppearanceState | null {
  const platform = usePlatformAppearance();
  // `useSyncExternalStore` compares snapshots by identity, so an adapter that
  // builds a fresh object on every `getState()` must not read as a change.
  const last = useRef<PlatformAppearanceState | null>(null);
  const subscribe = useCallback(
    (listener: () => void) => (platform ? platform.subscribe(listener) : unsubscribed),
    [platform],
  );
  const getSnapshot = useCallback((): PlatformAppearanceState | null => {
    if (!platform) return null;
    const next = platform.getState();
    const accent = typeof next.accent === 'string' ? next.accent : null;
    const reduceTransparency = next.reduceTransparency === true;
    const previous = last.current;
    if (
      previous &&
      previous.accent === accent &&
      previous.reduceTransparency === reduceTransparency
    )
      return previous;
    last.current = { accent, reduceTransparency };
    return last.current;
  }, [platform]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
