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
 * ## A size and a state, because they travel differently
 *
 * A surface that collapses — the tab bar minimizes 58 -> 44 on scroll — publishes
 * two things, and only one of them is a measurement:
 *
 *   - RESERVED (`useBottomEdgeInset`) never shrinks while the claimant is
 *     mounted. It is what must be kept permanently free: a list's bottom
 *     padding, a toast stack's offset. Shrinking it on collapse would jitter a
 *     list's content size on every scroll and jump a toast 14px mid-display,
 *     because the bar re-expands the instant the user scrolls back up.
 *   - COLLAPSED (`useBottomEdgeCollapsed`) is a boolean, deliberately, and this
 *     is the part that was learned the hard way. It first shipped as a live
 *     PIXEL height so a FAB could ride down with the bar — and it felt broken on
 *     a device. The bar animates on the UI thread; a React consumer learns about
 *     the change through `runOnJS` plus two render passes, so its motion STARTS
 *     one to three frames late, worst exactly while scrolling because that is
 *     when the JS thread is busiest. No spring config fixes a variable start
 *     delay.
 *
 * Two things moving together betray that lag; a state change does not. A reader
 * that FADES on this boolean has no spatial relationship to violate, so the same
 * few frames of latency are imperceptible. That is why the channel is a state and
 * not a geometry: it is the shape of signal that survives the trip to the JS
 * thread. Anything that genuinely must track the collapse per-frame has to read
 * the tab bar's own shared value on the UI thread instead — React state is the
 * wrong transport for it, at any width.
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

interface Claim {
  /** What the surface keeps permanently free, collapsed or not. */
  reserved: number;
  /** Whether it is currently in its collapsed state. */
  collapsed: boolean;
}

interface BottomEdgeStore {
  subscribe: (onChange: () => void) => () => void;
  /**
   * The cached totals. Each returns the SAME number until a claim actually
   * changes it — `useSyncExternalStore` re-renders forever if the snapshot is
   * recomputed per call, and a reader of one channel must not re-render when
   * only the other moved.
   */
  getReserved: () => number;
  getCollapsed: () => boolean;
  claim: (id: string, reserved: number, collapsed: boolean) => void;
  release: (id: string) => void;
}

function createBottomEdgeStore(): BottomEdgeStore {
  const claims = new Map<string, Claim>();
  const listeners = new Set<() => void>();
  let reserved = 0;
  let collapsed = false;

  const recompute = () => {
    let nextReserved = 0;
    // ANY claimant collapsing collapses the edge. With the one floating bar this
    // is written for the two readings coincide; where they would not, "something
    // at this edge just retracted" is still the signal a reader wants, and it is
    // the safe direction — a FAB that fades when it did not strictly have to
    // beats one that stays put over a bar that left.
    let nextCollapsed = false;
    for (const claim of claims.values()) {
      if (claim.reserved > nextReserved) nextReserved = claim.reserved;
      if (claim.collapsed) nextCollapsed = true;
    }
    // Bail before notifying: a re-registration at an unchanged footprint (every
    // render of a claimant that did not move) must not re-render every reader.
    if (nextReserved === reserved && nextCollapsed === collapsed) return;
    reserved = nextReserved;
    collapsed = nextCollapsed;
    for (const listener of listeners) listener();
  };

  return {
    subscribe(onChange) {
      listeners.add(onChange);
      return () => {
        listeners.delete(onChange);
      };
    },
    getReserved: () => reserved,
    getCollapsed: () => collapsed,
    claim(id, nextReserved, nextCollapsed) {
      const existing = claims.get(id);
      if (existing?.reserved === nextReserved && existing.collapsed === nextCollapsed) return;
      claims.set(id, { reserved: nextReserved, collapsed: nextCollapsed });
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
const NO_COLLAPSE = () => false;

/**
 * How much of the bottom edge is permanently RESERVED, in px.
 *
 * Never shrinks while its claimant is mounted, so it is the number for anything
 * that must not move as the user scrolls — a list's bottom padding, a toast
 * stack's offset:
 *
 * ```tsx
 * const reserved = useBottomEdgeInset();
 * <FlatList contentContainerStyle={{ paddingBottom: reserved + 12 }} />
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
    store?.getReserved ?? NO_INSET,
    store?.getReserved ?? NO_INSET,
  );
}

/**
 * Whether the surface owning the bottom edge is currently COLLAPSED — the tab
 * bar minimized on scroll.
 *
 * A boolean rather than a live height, on purpose: see the note at the top of
 * this file. A reader should FADE or otherwise change state on it, never try to
 * stay geometrically locked to the collapsing surface — that lock is what a
 * React-state channel cannot deliver, because the surface animates on the UI
 * thread and this arrives one to three frames later.
 *
 * ```tsx
 * const collapsed = useBottomEdgeCollapsed();
 * // fade out; do not chase the bar's new top edge
 * ```
 *
 * `false` outside a provider.
 */
export function useBottomEdgeCollapsed(): boolean {
  const store = useContext(BottomEdgeContext);
  return useSyncExternalStore(
    store?.subscribe ?? NO_SUBSCRIPTION,
    store?.getCollapsed ?? NO_COLLAPSE,
    store?.getCollapsed ?? NO_COLLAPSE,
  );
}

/**
 * Claim the bottom edge for as long as the caller is mounted.
 *
 * The claimant owns its own placement — claiming does not move it. It declares
 * the space it occupies so that everything reading the edge stays off it. Pass
 * the FULL footprint (the surface's height plus the gap it holds off the window
 * edge), which is the same number the surface positions itself with, and keep it
 * at the surface's FULL size even while collapsed: `reserved` is what must stay
 * permanently free, and the collapse is reported separately by `collapsed`.
 *
 * A no-op outside a provider, so a surface stays usable standalone.
 */
export function useClaimBottomEdge(reserved: number, collapsed = false): void {
  const store = useContext(BottomEdgeContext);
  const id = useId();

  useEffect(() => {
    if (!store) return;
    store.claim(id, reserved, collapsed);
    return () => store.release(id);
  }, [store, id, reserved, collapsed]);
}
