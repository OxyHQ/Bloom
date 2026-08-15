/**
 * Derived from sonner-native v0.26.4 — src/use-toast-position.ts
 * (MIT © Gunnar Torfi Steinarsson). See the top-level NOTICE.
 *
 * Upstream computes the row's offset inside a `useDerivedValue` worklet and
 * returns `withTiming(...)` from it, which does not animate on web. Bloom computes
 * the target in plain JS — `calculateToastPosition` is pure and unit-tested — and
 * hands it to `useAnimatedTarget`, which drives the shared value imperatively. See
 * that file for the full reasoning.
 *
 * Two dependency traps disappear with the worklet:
 *
 *  - No memo and no dependency array. The target is a NUMBER, and
 *    `useAnimatedTarget` keys its effect on that number, so recomputing a pure
 *    O(visibleToasts) sum on every render costs nothing and cannot go stale.
 *    Upstream needs a deps array (including a joined `orderedToastIds` key) purely
 *    because a mapper has no other way to know when to re-run.
 *  - No `toastHeightsVersion`. The store creates a new `toastHeights` OBJECT on
 *    every mutation, and React re-renders on that; the manual version counter only
 *    existed because a mapper cannot observe a plain object. The invariant that
 *    replaces it is ordinary React — the store must never mutate `toastHeights` in
 *    place — pinned by `toast-store.test.ts`.
 */
import type { SharedValue } from 'react-native-reanimated';

import { easeOutQuartFn } from './animations';
import { STACKING_ANIMATION_DURATION } from './constants';
import { calculateToastPosition } from './row-geometry';
import type { ToastPosition } from './types';
import { useAnimatedTarget } from './use-animated-target';

export const useToastPosition = (params: {
  index: number;
  numberOfToasts: number;
  enableStacking: boolean;
  position: ToastPosition;
  allToastHeights: Record<string | number, number>;
  gap: number;
  orderedToastIds: Array<string | number>;
  isExpanded: boolean;
  stackGap: number;
}): SharedValue<number> =>
  useAnimatedTarget(calculateToastPosition(params), {
    duration: STACKING_ANIMATION_DURATION,
    easing: easeOutQuartFn,
  });
