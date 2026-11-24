/**
 * The bottom edge's OCCUPANCY — how much of it is already claimed by a floating
 * surface, so the next surface can stack above it instead of underneath it.
 *
 * ## The problem
 *
 * `windowEdgeGap` tells a surface where the window edge is. It cannot tell it
 * that a tab bar is already parked there. Nothing could, so nothing did: Bloom's
 * `Fab` anchored itself 16px off the edge and landed squarely behind the
 * floating tab bar, and every app that hit it patched around Bloom instead —
 * Mention grew a `BottomBarAwareFab` that read `useTabBarFootprint()` and lifted
 * the FAB by hand, on web only, leaving native broken across seven screens.
 *
 * A z-index cannot rescue that placement either. The tab bar host is the last
 * sibling of the app shell, so it paints above every descendant regardless of
 * what they claim; the FAB has to be somewhere ELSE, not merely on top.
 *
 * ## The model
 *
 * A surface that parks at the bottom edge CLAIMS its footprint. A surface that
 * wants to avoid it READS the total and offsets itself. Neither one imports the
 * other, so a consumer composes them in any combination — a tab bar with no FAB,
 * a FAB with no tab bar, both, or a third surface written later — and the
 * geometry still resolves.
 *
 * Claims combine with MAX, not sum. Every claim is measured from the same window
 * edge, so two surfaces at that edge overlap rather than stack; the tallest is
 * what a new surface has to clear. Summing would strand it at twice the height.
 *
 * ## What does NOT belong here: the collapse
 *
 * The tab bar minimizes 62 -> 44 on scroll, and this registry twice tried to
 * publish that so a FAB could react — first as a live pixel height (1.11.0), then
 * as a boolean (1.12.0). Both felt wrong on a device, for the same reason, and
 * the reason is structural rather than a matter of tuning:
 *
 *   the bar animates on the UI thread, while anything reading it from here
 *   arrives via `runOnJS` plus two React render passes.
 *
 * So a consumer's reaction STARTS one to three frames after the bar's, and the
 * delay is variable — worst exactly while scrolling, because that is when the JS
 * thread is busiest. Fading instead of moving does not hide it either: the eye
 * still sees two pieces of chrome change at different moments.
 *
 * A collapse is MOTION, and motion that must stay in lock-step with a
 * reanimated animation has to travel as a shared value on the UI thread. React
 * state is the wrong transport at any width, so it is not offered here at all.
 * The app owns that signal — Mention drives its header, its bar and its FAB from
 * one `SharedValue` through `useAnimatedStyle` — and this registry stays what it
 * is good at: GEOMETRY. Where things are, not when they move.
 *
 * ## Taking the edge
 *
 * A screen whose own bar takes the place of the app's navigation (a post's reply
 * prompt with the tabs docked beside it, `Screen replacesBottomBar`) TAKES the
 * edge while it is in front. The navigation parked there steps aside on the UI
 * thread (`useBottomEdgeTaken`): it stays mounted and keeps its claim, so
 * nothing re-renders, no view is removed and the screens it covers keep their
 * geometry; only the screen that took the edge sits on the window's edge.
 * Unlike the collapse, this is not motion two surfaces must share frame by
 * frame: the navigation cuts out and back in, so a shared value written in the
 * commit that takes or gives the edge is all it needs.
 *
 * ## Why an external store
 *
 * The claim set is mutable state living outside React. Reading it in a memoized
 * position is exactly the stale-read the React Compiler produces, so it is read
 * through `useSyncExternalStore` and never touched directly. The store is
 * created per provider (not at module scope) so tests, and any app mounting two
 * roots, stay isolated from each other.
 */
import {
  createContext,
  useCallback,
  useContext,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type PropsWithChildren,
} from 'react';
import { makeMutable, type SharedValue } from 'react-native-reanimated';
import { useIsomorphicLayoutEffect } from '../theme/use-isomorphic-layout-effect';

import { createEdgeStore, NO_INSET, NO_SUBSCRIPTION, type EdgeStore } from './edge-store';

/** Who has taken the edge from the navigation parked on it (see "Taking the edge"). */
interface EdgeTakeover {
  /** 1 while a screen holds the edge, else 0: read on the UI thread. */
  readonly taken: SharedValue<number>;
  take: (id: string) => void;
  give: (id: string) => void;
}

function createTakeover(): EdgeTakeover {
  const takers = new Set<string>();
  const taken = makeMutable(0);
  return {
    taken,
    take(id) {
      if (takers.has(id)) return;
      takers.add(id);
      if (takers.size === 1) taken.value = 1;
    },
    give(id) {
      if (takers.delete(id) && takers.size === 0) taken.value = 0;
    },
  };
}

type BottomEdgeStore = EdgeStore & { takeover: EdgeTakeover };

const BottomEdgeContext = createContext<BottomEdgeStore | null>(null);

/**
 * Wrap the app once — `BloomProvider` already does. Rendering a second one
 * scopes a nested subtree to its own claims, which is a real (if rare) thing to
 * want: a bottom-edge surface inside a full-screen modal should not be offset by
 * the tab bar the modal is covering.
 */
export function BottomEdgeProvider({
  children,
  inherit = false,
  consume,
}: PropsWithChildren<{
  inherit?: boolean;
  /** Space already occupied by an in-flow slot above this viewport's edge. */
  consume?: number;
}>) {
  const parent = useContext(BottomEdgeContext);
  const [store] = useState<BottomEdgeStore>(() => ({
    ...createEdgeStore(),
    takeover: createTakeover(),
  }));
  const consumed =
    consume === undefined ? undefined : Math.max(0, Number.isFinite(consume) ? consume : 0);
  const initialConsumed = useRef(consumed ?? 0);
  // Keep the snapshot identity stable when the viewport consumes a new height.
  // useSyncExternalStore refreshes its getter in a passive effect: replacing it
  // during render can make a simultaneous parent claim update compare against
  // the previous translation and leave stale padding visible for one frame.
  const translated = useMemo(() => {
    let amount = initialConsumed.current;
    const listeners = new Set<() => void>();
    return {
      ...store,
      // A viewport inside the parent's is still under the parent's navigation.
      takeover: parent?.takeover ?? store.takeover,
      getInset: () => Math.max(store.getInset(), (parent?.getInset() ?? 0) - amount),
      subscribe(listener: () => void) {
        listeners.add(listener);
        const own = store.subscribe(listener);
        const outer = parent?.subscribe(listener);
        return () => {
          listeners.delete(listener);
          own();
          outer?.();
        };
      },
      setConsumed(next: number) {
        if (amount === next) return;
        amount = next;
        for (const listener of listeners) listener();
      },
    };
  }, [store, parent]);
  useIsomorphicLayoutEffect(() => {
    translated.setConsumed(consumed ?? 0);
  }, [translated, consumed]);
  return (
    <BottomEdgeContext.Provider
      value={consumed !== undefined ? translated : inherit ? parent : store}
    >
      {children}
    </BottomEdgeContext.Provider>
  );
}

BottomEdgeProvider.displayName = 'BottomEdgeProvider';

/**
 * How much of the bottom edge is already occupied, in px.
 *
 * Add it to whatever offset the surface would otherwise use:
 *
 * ```tsx
 * const occupied = useBottomEdgeInset();
 * <View style={{ position: 'absolute', bottom: windowEdgeGap(insets.bottom) + occupied }} />
 * ```
 *
 * `0` outside a provider and during server rendering. Claims synchronize in the
 * layout phase, so a changed or hidden surface updates its readers before paint.
 * Measurements still belong to the claimant, never to this registry.
 */
export function useBottomEdgeInset(): number {
  const store = useContext(BottomEdgeContext);
  return useSyncExternalStore(
    store?.subscribe ?? NO_SUBSCRIPTION,
    store?.getInset ?? NO_INSET,
    store?.getInset ?? NO_INSET,
  );
}

/**
 * Claim `height` px of the bottom edge for as long as the caller is mounted.
 *
 * The claimant owns its own placement — claiming does not move it. It declares
 * the space it occupies so that everything reading `useBottomEdgeInset()` stays
 * off it. Pass the FULL footprint (the surface's height plus the gap it holds
 * off the window edge), which is the same number the surface positions itself
 * with.
 *
 * A no-op outside a provider, so a surface stays usable standalone.
 */
export function useClaimBottomEdge(height: number): void {
  const store = useContext(BottomEdgeContext);
  const id = useId();

  useIsomorphicLayoutEffect(() => {
    if (!store) return;
    store.claim(id, height);
    return () => store.release(id);
  }, [store, id, height]);
}

/** Publish a naturally laid-out host without using its height to lay it out again. */
export function useMeasuredBottomEdgeClaim(active: boolean): (height: number) => void {
  const store = useContext(BottomEdgeContext);
  const id = useId();
  useIsomorphicLayoutEffect(() => {
    if (!active) store?.release(id);
    return () => store?.release(id);
  }, [active, store, id]);
  return useCallback(
    (height: number) => {
      if (active && Number.isFinite(height)) store?.claim(id, Math.max(0, height));
    },
    [active, store, id],
  );
}

/**
 * Take the bottom edge while `active`: the navigation parked on it steps aside
 * until it is given back (on release, or when the caller unmounts). Taken in the
 * layout phase, so the navigation is gone in the frame that shows the taker.
 */
export function useTakeBottomEdge(active: boolean): void {
  const takeover = useContext(BottomEdgeContext)?.takeover;
  const id = useId();
  useIsomorphicLayoutEffect(() => {
    if (!active || !takeover) return;
    takeover.take(id);
    return () => takeover.give(id);
  }, [active, takeover, id]);
}

/** 1 while a screen has taken the edge, else 0 (`null` outside a provider): for the navigation to step aside. */
export function useBottomEdgeTaken(): SharedValue<number> | null {
  return useContext(BottomEdgeContext)?.takeover.taken ?? null;
}
