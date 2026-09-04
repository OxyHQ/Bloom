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
 * The tab bar minimizes 58 -> 44 on scroll, and this registry twice tried to
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
  useContext,
  useEffect,
  useId,
  useState,
  useSyncExternalStore,
  type PropsWithChildren,
} from 'react';

interface BottomEdgeStore {
  subscribe: (onChange: () => void) => () => void;
  /**
   * The cached total. Returns the SAME number until a claim actually changes it
   * — `useSyncExternalStore` re-renders forever if the snapshot is recomputed
   * per call.
   */
  getInset: () => number;
  claim: (id: string, height: number) => void;
  release: (id: string) => void;
}

function createBottomEdgeStore(): BottomEdgeStore {
  const claims = new Map<string, number>();
  const listeners = new Set<() => void>();
  let inset = 0;

  const recompute = () => {
    let next = 0;
    for (const height of claims.values()) {
      if (height > next) next = height;
    }
    // Bail before notifying: a re-registration at an unchanged height (every
    // render of a claimant whose footprint did not move) must not re-render
    // every reader.
    if (next === inset) return;
    inset = next;
    for (const listener of listeners) listener();
  };

  return {
    subscribe(onChange) {
      listeners.add(onChange);
      return () => {
        listeners.delete(onChange);
      };
    },
    getInset: () => inset,
    claim(id, height) {
      if (claims.get(id) === height) return;
      claims.set(id, height);
      recompute();
    },
    release(id) {
      if (!claims.delete(id)) return;
      recompute();
    },
  };
}

const BottomEdgeContext = createContext<BottomEdgeStore | null>(null);

/**
 * Wrap the app once — `BloomProvider` already does. Rendering a second one
 * scopes a nested subtree to its own claims, which is a real (if rare) thing to
 * want: a bottom-edge surface inside a full-screen modal should not be offset by
 * the tab bar the modal is covering.
 */
export function BottomEdgeProvider({ children }: PropsWithChildren) {
  const [store] = useState(createBottomEdgeStore);
  return <BottomEdgeContext.Provider value={store}>{children}</BottomEdgeContext.Provider>;
}

BottomEdgeProvider.displayName = 'BottomEdgeProvider';

// Stable module-scope identities for the no-provider path. Fresh closures here
// would resubscribe `useSyncExternalStore` on every render.
const NO_SUBSCRIPTION = () => () => {};
const NO_INSET = () => 0;

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
 * `0` outside a provider, and `0` on the first commit even inside one — a claim
 * registers in an effect, so a reader mounted in the same commit as its claimant
 * settles one frame later. That is a layout offset rather than a measurement, so
 * the settle is invisible in practice; nothing here waits on a real layout pass.
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

  useEffect(() => {
    if (!store) return;
    store.claim(id, height);
    return () => store.release(id);
  }, [store, id, height]);
}
