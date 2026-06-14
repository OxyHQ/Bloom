/**
 * Web variant of the scroll-restoration primitive.
 *
 * Mirrors the proven Bluesky pattern (`history.scrollRestoration = 'manual'`
 * plus an in-memory `Map<routeKey, offset>` saved on blur and restored on focus
 * inside a single `requestAnimationFrame`) with one deliberate difference:
 * Bluesky restores the WINDOW scroller, whereas Oxy apps keep multi-column
 * layouts whose feed scrolls an INNER container. So we restore the offset of a
 * caller-registered scrollable (a ref to an element / RN scroll component, or
 * the `'window'` sentinel), keyed by the active navigation route.
 *
 * Native bundlers use `./index.ts` (a no-op); web bundlers select this file via
 * the `"browser"` export condition in `package.json`.
 */
import { createContext, useCallback, useContext, useMemo, useRef } from 'react';
import { useFocusEffect, useRoute } from '@react-navigation/native';

import { createScroller } from './scrollable.web';
import { ScrollOffsetStore, deriveScrollKey } from './store';
import type {
  ScrollRestorationProviderProps,
  ScrollRestorationTarget,
  UseScrollRestorationOptions,
} from './types';

export type {
  ScrollableHandle,
  ScrollRestorationProviderProps,
  ScrollRestorationTarget,
  UseScrollRestorationOptions,
} from './types';

const ScrollOffsetContext = createContext<ScrollOffsetStore | null>(null);
ScrollOffsetContext.displayName = 'BloomScrollOffsetContext';

/**
 * Switch the browser to manual scroll restoration exactly once per document.
 *
 * The browser's default `'auto'` restoration fights our manual restore on
 * Back/Forward navigations. Doing this at module scope (guarded for SSR) means
 * it is set before any provider mounts, matching Bluesky's module-level call.
 */
if (typeof history !== 'undefined' && 'scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

/**
 * Holds the per-route offset map for the subtree. One provider near the app
 * root is enough; the store lives for the document's lifetime so offsets
 * survive navigating away and back (including browser Back/Forward).
 */
export function ScrollRestorationProvider({
  children,
}: ScrollRestorationProviderProps) {
  const store = useMemo(() => new ScrollOffsetStore(), []);
  return (
    <ScrollOffsetContext.Provider value={store}>
      {children}
    </ScrollOffsetContext.Provider>
  );
}

function useScrollOffsetStore(): ScrollOffsetStore {
  const store = useContext(ScrollOffsetContext);
  if (store === null) {
    throw new Error(
      'useScrollRestoration must be used within a <ScrollRestorationProvider>.',
    );
  }
  return store;
}

/**
 * Preserve and restore the scroll offset of `target` across navigation, keyed
 * by the active route (plus an optional `options.key` for routes that host
 * multiple scrollables).
 *
 * Behaviour (web):
 * - On every scroll while the screen is focused, the current offset is saved.
 * - On focus, the saved offset is applied in a single `requestAnimationFrame`,
 *   giving a remounted list one frame to lay out its content first (no retry
 *   loops, no hide/show tricks).
 * - On blur, the latest offset is captured as a final safety net.
 */
export function useScrollRestoration(
  target: ScrollRestorationTarget,
  options?: UseScrollRestorationOptions,
): void {
  const store = useScrollOffsetStore();
  const route = useRoute();
  const subKey = options?.key;
  const enabled = options?.enabled ?? true;

  const scrollKey = deriveScrollKey(route.key, subKey);

  // Keep the latest target/enabled/key in refs so the focus effect can read
  // them without being re-subscribed on every render.
  const targetRef = useRef(target);
  targetRef.current = target;
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const scrollKeyRef = useRef(scrollKey);
  scrollKeyRef.current = scrollKey;

  useFocusEffect(
    // The effect identity is intentionally stable across renders: it reads all
    // varying inputs from refs. React Navigation re-runs it on each focus.
    useCallback(
      () => {
        const key = scrollKeyRef.current;
        if (!enabledRef.current || key === null) return undefined;

        const scroller = createScroller(targetRef.current);
        const element =
          targetRef.current === 'window'
            ? (typeof window !== 'undefined' ? window : null)
            : resolveScrollEventTarget(targetRef.current);

        const save = () => {
          const currentKey = scrollKeyRef.current;
          if (enabledRef.current && currentKey !== null) {
            store.save(currentKey, scroller.getOffset());
          }
        };

        // Restore on the next frame so a freshly remounted list has rendered
        // its content (and thus reached its full scroll height) before we move.
        const frame = requestAnimationFrame(() => {
          scroller.setOffset(store.read(key));
        });

        element?.addEventListener('scroll', save, { passive: true });

        return () => {
          cancelAnimationFrame(frame);
          element?.removeEventListener('scroll', save);
          // Final capture on blur, covering navigations that don't fire a
          // trailing scroll event.
          save();
        };
      },
      [store],
    ),
  );
}

/**
 * Resolve the EventTarget to listen for `scroll` on. RNW scroll components
 * expose `getScrollableNode()`; raw refs may hold the DOM node directly.
 */
function resolveScrollEventTarget(
  target: Exclude<ScrollRestorationTarget, 'window'>,
): EventTarget | null {
  const current = (target as { current: unknown }).current;
  if (current == null) return null;
  if (typeof EventTarget !== 'undefined' && current instanceof EventTarget) {
    return current;
  }
  const handle = current as { getScrollableNode?: () => unknown };
  if (typeof handle.getScrollableNode === 'function') {
    const node = handle.getScrollableNode();
    if (typeof EventTarget !== 'undefined' && node instanceof EventTarget) {
      return node;
    }
  }
  return null;
}
