/**
 * Derived from sonner-native v0.26.4 — src/positioner-utils.ts
 * (MIT © Gunnar Torfi Steinarsson).
 *
 * Named for what it computes — the per-position CONTAINER's box — rather than
 * carried over as `positioner-utils.ts`, which sat one letter from its sibling
 * `position-utils.ts` (now `row-geometry.ts`). Two modules a character apart is
 * the same hazard as `const.ts` beside `constants.ts`: an import that resolves,
 * type-checks and computes the wrong geometry.
 *
 * Pure geometry for the per-position container: `position: 'absolute'` is correct
 * here because the toast host provides a viewport-sized containing block (see
 * `ToastHost`), which is what keeps this module platform-agnostic.
 *
 * INVARIANT: a row must never be laid out outside its container's box. See
 * `getContainerStyle`.
 */
import type { ViewStyle } from 'react-native';
import { windowEdgeGap } from '../layout/edge';
import { ESTIMATED_TOAST_HEIGHT, OUTSIDE_PRESS_PADDING } from './constants';

/** The stack's own breathing room beyond the OS band. */
const TOAST_EDGE_GAP = 8;
import type { ToastPosition } from './types';

/**
 * ALL FOUR EDGES ARE PINNED, for every position. `Positioner` then overrides the
 * one anchored edge with `getInsetValues`, so the container still spans the host in
 * the other direction and always has a REAL HEIGHT.
 *
 * That is the whole point. This used to be `{position:'absolute', width:'100%'}`
 * plus an inset of only `{bottom: N}` — and since every row inside is ITSELF
 * `position:'absolute'`, the container had no in-flow content and measured ZERO
 * HEIGHT, so every row was laid out entirely OUTSIDE its parent's box. Measured on
 * web: a bottom-center container was a 0-height line at y=884 with its rows at
 * y=784 and y=838, i.e. at NEGATIVE offsets (`top: -46px`) from a zero-height
 * parent. The DOM does not clip, so web rendered it anyway; Android does not
 * tolerate it, and `bottom-center` — the DEFAULT position — painted nothing at all.
 *
 * Two things that look like they would work here and do NOT:
 *  - `justifyContent` cannot place the rows. They are absolutely positioned, so it
 *    has no effect on them; the row's own anchor (`top: 0` / `bottom: 0` /
 *    `top: '50%'`) does the placing.
 *  - PADDING cannot supply the edge offset. In CSS an absolutely positioned child
 *    resolves against its ancestor's PADDING BOX, so padding does not inset it —
 *    while Yoga DOES inset it. Padding would have moved the rows on native and left
 *    them at the screen edge on web. The offset therefore stays an inset on the
 *    container itself, which behaves identically on both.
 */
export const getContainerStyle = (): ViewStyle => ({
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  alignItems: 'center',
  // Enter and exit animations translate a row past the container edge on purpose.
  overflow: 'visible',
});

/**
 * How far the stack sits from its screen edge.
 *
 * The gap is the shared `windowEdgeGap` rule with the stack's own breathing room
 * on top, so the stack clears the OS's reserved band the same way a detached
 * sheet and the tab bar do. `offset` overrides that gap outright — it is the
 * consumer saying where the stack goes.
 *
 * `bottomEdgeInset` is separate from both, and additive to either: it is not a
 * gap preference but an OBSTRUCTION — whatever floating surface has already
 * claimed the bottom edge (see `layout/bottom-edge`). A floating tab bar occupies
 * ~82dp on a gesture-navigation Android device while this stack sat at 32dp, so
 * every bottom toast rendered on top of the bar until the stack started reading
 * it. An explicit `offset` does not excuse the stack from clearing it.
 */
export const getInsetValues = ({
  position,
  offset,
  safeAreaInsets,
  bottomEdgeInset = 0,
}: {
  position: ToastPosition;
  offset?: number;
  safeAreaInsets?: { top: number; bottom: number };
  bottomEdgeInset?: number;
}): { top?: number; bottom?: number } => {
  const { top = 0, bottom = 0 } = safeAreaInsets || {};

  if (position === 'bottom-center') {
    return { bottom: (offset || windowEdgeGap(bottom, TOAST_EDGE_GAP)) + bottomEdgeInset };
  }

  if (position === 'top-center') {
    return { top: offset || windowEdgeGap(top, TOAST_EDGE_GAP) };
  }

  return {};
};

/**
 * The area OUTSIDE the toast stack, used to collapse an expanded stack on press.
 * It deliberately stops short of the stack itself so a press on a toast still
 * reaches the toast.
 */
export const calculateOutsidePressableArea = ({
  position,
  toastHeights,
  gap,
  visibleToasts,
  insetValues,
}: {
  position: ToastPosition;
  toastHeights: Record<string | number, number>;
  gap: number;
  visibleToasts: number;
  insetValues: { top?: number; bottom?: number };
}): ViewStyle => {
  const measuredHeights = Object.values(toastHeights);
  const hasMeasurements = measuredHeights.length > 0;

  // Upstream counts `min(measured.length, visibleToasts)` rows and only THEN
  // falls back to the estimate — which makes the fallback multiply by zero, so
  // an unmeasured stack reserved nothing and the press area ran underneath it.
  // Reserve a full stack instead: this area is only rendered while the stack is
  // expanded, so over-reserving is the safe direction.
  const rowCount = hasMeasurements
    ? Math.min(measuredHeights.length, visibleToasts)
    : visibleToasts;

  const totalToastHeight = hasMeasurements
    ? measuredHeights.slice(0, rowCount).reduce((sum, height) => sum + height, 0)
    : ESTIMATED_TOAST_HEIGHT * rowCount;

  const gapHeight = gap * Math.max(0, rowCount - 1);
  const stackHeight = totalToastHeight + gapHeight + OUTSIDE_PRESS_PADDING;

  if (position === 'top-center') {
    const topOffset = (insetValues.top || 40) + stackHeight;
    return {
      position: 'absolute',
      top: topOffset,
      bottom: 0,
      left: 0,
      right: 0,
    };
  }

  if (position === 'bottom-center') {
    const bottomOffset = (insetValues.bottom || 40) + stackHeight;
    return {
      position: 'absolute',
      top: 0,
      bottom: bottomOffset,
      left: 0,
      right: 0,
    };
  }

  return { display: 'none' };
};
