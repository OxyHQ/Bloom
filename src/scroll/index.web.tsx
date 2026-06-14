/**
 * Web variant of the scroll-restoration primitive.
 *
 * Mirrors the proven Bluesky pattern (`history.scrollRestoration = 'manual'`
 * plus an in-memory `Map<routeKey, offset>`) with two deliberate differences
 * forced by Oxy's layouts and the behaviour of the (expo-router-wrapped)
 * React Navigation web stack:
 *
 *  1. Bluesky restores the WINDOW scroller, whereas Oxy apps keep multi-column
 *     layouts whose feed scrolls an INNER container. So we restore the offset
 *     of a caller-registered scrollable (a ref to an element / RN scroll
 *     component, or the `'window'` sentinel), keyed by the active route.
 *
 *  2. The web stack HIDES the background screen on push. While
 *     hidden, the previous screen's scroll container collapses
 *     (`scrollHeight === clientHeight`) and the navigator forces its
 *     `scrollTop` to 0. The screen is NOT unmounted, so a virtualized list
 *     (e.g. FlashList) keeps its rows but re-lays them out over SEVERAL frames
 *     once the screen is re-shown. Two problems follow, both handled here:
 *
 *       (a) A blur-time read of `scrollTop` returns the navigator's forced 0,
 *           not the user's real offset — saving it would clobber the good
 *           value. We therefore persist the last offset OBSERVED by the live
 *           scroll listener, never a fresh read taken at blur time.
 *
 *       (b) A single-frame restore writes `scrollTop` while the list is still
 *           collapsed; the write is clamped to 0 and never re-applied once the
 *           content grows. We therefore re-apply the target offset across a
 *           bounded run of animation frames, stopping as soon as the write
 *           sticks (the content has grown tall enough) or a small frame cap is
 *           reached.
 *
 * Native bundlers use `./index.ts` (a no-op); web bundlers select this file via
 * the `"browser"` export condition in `package.json`.
 *
 * The navigation hooks are imported from `expo-router` (which re-exports
 * `useFocusEffect` and `useRoute` from its bundled React Navigation core) rather
 * than from `@react-navigation/native` directly. Every Oxy app uses expo-router
 * as its router, so it is always a DIRECT, top-level dependency that resolves
 * cleanly under Bun's isolated linker — whereas `@react-navigation/native` is
 * only a nested/transitive dependency of expo-router and would fail to resolve
 * when bundling those apps.
 */
import { createContext, useCallback, useContext, useMemo, useRef } from 'react';
import { useFocusEffect, useRoute } from 'expo-router';

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
 * Maximum number of animation frames the focus restore will re-apply the saved
 * offset before giving up. A virtualized list re-lays out its rows over a
 * handful of frames after its screen is re-shown; ~30 frames (≈0.5s at 60fps)
 * is comfortably longer than any observed relayout while staying short enough
 * that the loop never lingers as a perceptible cost. The loop normally exits
 * far earlier — as soon as the write sticks.
 */
const RESTORE_FRAME_CAP = 30;

/**
 * Tolerance (in CSS pixels) for considering a restore "stuck". After writing
 * `element.scrollTop = target`, the browser may clamp it to the current
 * `scrollHeight - clientHeight`; if the resulting offset is within this many
 * pixels of the target we treat the restore as complete. Sub-pixel rounding and
 * fractional device-pixel ratios make an exact equality check unreliable.
 */
const RESTORE_STICK_TOLERANCE_PX = 2;

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
 * - On every scroll while the screen is focused, the current offset is recorded
 *   in memory and persisted. This live stream of saves is the source of truth.
 * - On focus, the saved offset is re-applied across a bounded run of animation
 *   frames, stopping as soon as the write sticks (the list has re-rendered its
 *   rows and grown tall enough) or {@link RESTORE_FRAME_CAP} is reached. A
 *   saved offset of 0 is a no-op (nothing to restore).
 * - On blur, the LAST OBSERVED offset is persisted as a final safety net — not
 *   a fresh `scrollTop` read, which the navigator may already have forced to 0
 *   while collapsing the hidden screen.
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
    // varying inputs from refs. expo-router's `useFocusEffect` re-runs it on
    // each focus.
    useCallback(
      () => {
        const key = scrollKeyRef.current;
        if (!enabledRef.current || key === null) return undefined;

        const scroller = createScroller(targetRef.current);
        const element =
          targetRef.current === 'window'
            ? (typeof window !== 'undefined' ? window : null)
            : resolveScrollEventTarget(targetRef.current);

        // The last offset the live scroll listener observed for this focus
        // session. This — not a blur-time `getOffset()` — is what we persist on
        // blur, because by blur time the navigator may have collapsed the
        // hidden screen and forced its `scrollTop` to 0 (bug A). `null` means
        // the user never scrolled this session, so there is nothing newer to
        // persist than what the scroll listener already saved live.
        let lastObservedOffset: number | null = null;

        const save = () => {
          const currentKey = scrollKeyRef.current;
          if (!enabledRef.current || currentKey === null) return;
          const offset = scroller.getOffset();
          // Ignore a spurious 0 produced by the navigator collapsing a hidden
          // background screen: while collapsed the container cannot scroll, so
          // its `scrollTop` is forced to 0. Persisting it would clobber the
          // good offset recorded by earlier live saves (bug A). A genuine
          // scroll-to-top keeps the container scrollable and is saved normally.
          if (offset === 0 && !scroller.canScroll()) return;
          lastObservedOffset = offset;
          store.save(currentKey, offset);
        };

        // Restore across a bounded run of frames. A freshly re-shown
        // virtualized list re-lays out its rows over several frames, so a
        // single write while it is still collapsed would be clamped to 0 and
        // never re-applied (bug B). We re-apply each frame until the write
        // sticks or the frame cap is hit.
        const targetOffset = store.read(key);
        let rafId: number | null = null;

        if (targetOffset > 0 && typeof requestAnimationFrame !== 'undefined') {
          let framesLeft = RESTORE_FRAME_CAP;
          const applyOffset = () => {
            rafId = null;
            scroller.setOffset(targetOffset);
            framesLeft -= 1;
            // Stop once the write took effect (content grew tall enough) or we
            // exhaust the frame budget. `getOffset` re-reads the clamped value.
            const reached =
              Math.abs(scroller.getOffset() - targetOffset) <=
              RESTORE_STICK_TOLERANCE_PX;
            if (!reached && framesLeft > 0) {
              rafId = requestAnimationFrame(applyOffset);
            }
          };
          rafId = requestAnimationFrame(applyOffset);
        }

        element?.addEventListener('scroll', save, { passive: true });

        return () => {
          if (rafId !== null) cancelAnimationFrame(rafId);
          element?.removeEventListener('scroll', save);
          // Final capture on blur: persist the last offset the scroll listener
          // OBSERVED, never a fresh read (which the navigator may have forced
          // to 0 while collapsing the hidden screen). When the user never
          // scrolled this session there is nothing newer to persist than the
          // live saves already recorded.
          if (lastObservedOffset !== null) {
            const currentKey = scrollKeyRef.current;
            if (enabledRef.current && currentKey !== null) {
              store.save(currentKey, lastObservedOffset);
            }
          }
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
