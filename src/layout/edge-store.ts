/**
 * The claim REGISTRY behind `bottom-edge` and `top-edge`, written once.
 *
 * `bottom-edge.tsx` carried this store inline while it was the only edge with
 * claimants. A floating page header is the second — it parks at the TOP edge
 * and the content under it has the same question the FAB had about the tab bar:
 * how much of the edge is already taken. The two registries are the same object
 * with a different context, so the object moved here rather than being written
 * out twice; the reasoning that decided its shape (why MAX rather than sum, why
 * an external store, why the collapse is NOT published through it) stays in
 * `bottom-edge.tsx`, which is where a reader looking for it will be.
 */

export interface EdgeStore {
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

export function createEdgeStore(): EdgeStore {
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

/**
 * Stable module-scope identities for the no-provider path. Fresh closures here
 * would resubscribe `useSyncExternalStore` on every render.
 */
export const NO_SUBSCRIPTION = () => () => {};
export const NO_INSET = () => 0;
