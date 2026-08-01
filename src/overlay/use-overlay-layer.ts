/**
 * `useOverlayLayer` — the hook every Bloom overlay surface stacks with.
 *
 * See `./stack.ts` for the rule and the reasoning. The contract for callers is
 * one line: **call this from a component that mounts when the surface OPENS**,
 * not from one that stays mounted while it is closed. Every Bloom surface is
 * already shaped that way (`Dialog.web` returns null while closed;
 * `BottomSheetBase` returns null until `rendered`), and `OverlayRoot` — which
 * lives inside those guards — is where the call actually sits for most of them.
 */
import { useEffect, useState } from 'react';

import {
  acquireOverlayRank,
  layerForRank,
  registerOverlayRank,
  releaseOverlayRank,
  type OverlayLayer,
} from './stack';

/**
 * Reserve this surface's place in the overlay stack for as long as it is
 * mounted. Returns the z-indices it should paint with.
 */
export function useOverlayLayer(): OverlayLayer {
  // A state initializer, not a render-body call: it runs once per mount, so the
  // rank is fixed before the first paint (an effect would leave one frame at
  // the wrong depth) and it is not a position the React Compiler can memoize
  // into a stale read.
  const [rank] = useState(acquireOverlayRank);

  useEffect(() => {
    registerOverlayRank(rank);
    return () => releaseOverlayRank(rank);
  }, [rank]);

  const [layer] = useState(() => layerForRank(rank));
  return layer;
}
