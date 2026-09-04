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
 * ## Two numbers, because there are two questions
 *
 * A surface that collapses — the tab bar minimizes 58 -> 44 on scroll — occupies
 * less than it reserves. Readers want different halves of that:
 *
 *   - RESERVED (`useBottomEdgeInset`) never shrinks while the claimant is
 *     mounted. It is what must be kept permanently free: a list's bottom
 *     padding, a toast stack's offset. Tracking the collapse here would jitter a
 *     list's content size on every scroll and jump a toast 14px mid-display.
 *   - LIVE (`useBottomEdgeLiveInset`) follows the collapse. It is what a surface
 *     SITTING ON the edge wants, so it rides down with the bar instead of
 *     leaving a hole.
 *
 * A claimant that never collapses passes one number and both answers agree.
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
  /** What it occupies right now. */
  current: number;
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
  getLive: () => number;
  claim: (id: string, reserved: number, current: number) => void;
  release: (id: string) => void;
}

function createBottomEdgeStore(): BottomEdgeStore {
  const claims = new Map<string, Claim>();
  const listeners = new Set<() => void>();
  let reserved = 0;
  let live = 0;

  const recompute = () => {
    let nextReserved = 0;
    let nextLive = 0;
    for (const claim of claims.values()) {
      if (claim.reserved > nextReserved) nextReserved = claim.reserved;
      if (claim.current > nextLive) nextLive = claim.current;
    }
    // Bail before notifying: a re-registration at unchanged heights (every
    // render of a claimant whose footprint did not move) must not re-render
    // every reader.
    if (nextReserved === reserved && nextLive === live) return;
    reserved = nextReserved;
    live = nextLive;
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
    getLive: () => live,
    claim(id, nextReserved, nextCurrent) {
      const existing = claims.get(id);
      if (existing?.reserved === nextReserved && existing.current === nextCurrent) return;
      claims.set(id, { reserved: nextReserved, current: nextCurrent });
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
 * How much of the bottom edge is occupied RIGHT NOW, in px — the same number as
 * {@link useBottomEdgeInset} for a surface that does not collapse, and smaller
 * while one does.
 *
 * This is what a surface sitting ON the edge wants, so it rides down with a
 * minimizing tab bar rather than leaving a hole above it. It changes when the
 * collapse STATE changes, not per frame: a claimant reports its settled
 * footprint and the reader animates the difference itself, which keeps the
 * motion on whatever animation system that reader already uses instead of
 * forcing a shared one through React state.
 */
export function useBottomEdgeLiveInset(): number {
  const store = useContext(BottomEdgeContext);
  return useSyncExternalStore(
    store?.subscribe ?? NO_SUBSCRIPTION,
    store?.getLive ?? NO_INSET,
    store?.getLive ?? NO_INSET,
  );
}

/**
 * Claim the bottom edge for as long as the caller is mounted.
 *
 * The claimant owns its own placement — claiming does not move it. It declares
 * the space it occupies so that everything reading the edge stays off it. Pass
 * the FULL footprint (the surface's height plus the gap it holds off the window
 * edge), which is the same number the surface positions itself with.
 *
 * `current` is what the surface occupies right now; it defaults to `reserved`,
 * which is correct for anything that does not collapse. A surface that shrinks
 * on scroll passes its live footprint as `current` and keeps `reserved` at its
 * full size — see the two channels above for why both are needed.
 *
 * A no-op outside a provider, so a surface stays usable standalone.
 */
export function useClaimBottomEdge(reserved: number, current: number = reserved): void {
  const store = useContext(BottomEdgeContext);
  const id = useId();

  useEffect(() => {
    if (!store) return;
    store.claim(id, reserved, current);
    return () => store.release(id);
  }, [store, id, reserved, current]);
}
