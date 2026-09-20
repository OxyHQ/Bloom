import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

const COARSE_POINTER = '(pointer: coarse)';

/** `undefined` wherever there is no `matchMedia` — SSR, a test renderer, an old browser. */
function coarsePointerQuery(): MediaQueryList | undefined {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
  try {
    return window.matchMedia(COARSE_POINTER);
  } catch {
    return undefined;
  }
}

/**
 * Whether a drag is the right affordance for THIS pointer.
 *
 * Native is always yes. Web is yes only where the pointer is COARSE: a web
 * build runs on a phone as readily as on a desktop, and the answer is a
 * property of the input device, not of the platform the bundle was built for.
 * A mouse gets the hover affordance its family draws instead — a drag is
 * undiscoverable with a pointer, and a `pointerdown`-driven pan fights text
 * selection.
 *
 * It is a HOOK rather than a constant because the answer changes without a
 * reload: a tablet with a keyboard folio attached and detached is the same
 * document, and a desktop window dragged to a touchscreen is too.
 */
export function useSwipeAvailable(): boolean {
  const [coarse, setCoarse] = useState<boolean>(() => coarsePointerQuery()?.matches ?? false);

  useEffect(() => {
    const query = coarsePointerQuery();
    if (query === undefined) return undefined;
    setCoarse(query.matches);
    const listener = (event: MediaQueryListEvent) => setCoarse(event.matches);
    // `addListener` is the deprecated spelling, and the only one Safari below
    // 14 has. Losing the subscription is silent, so both are tried.
    if (typeof query.addEventListener === 'function') {
      query.addEventListener('change', listener);
      return () => query.removeEventListener('change', listener);
    }
    query.addListener(listener);
    return () => query.removeListener(listener);
  }, []);

  return Platform.OS === 'web' ? coarse : true;
}
