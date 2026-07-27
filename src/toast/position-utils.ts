/**
 * Derived from sonner-native v0.26.4 — src/position-utils.ts
 * (MIT © Gunnar Torfi Steinarsson). See the top-level NOTICE.
 *
 * PURE geometry, called from plain JS. Upstream runs `calculateToastPosition`
 * inside a Reanimated mapper (hence its `'worklet'` directive); Bloom computes the
 * target in React and drives the shared value imperatively instead, because an
 * animation returned from a mapper never ticks on web — see `use-animated-target.ts`.
 * That also makes every function here directly unit-testable.
 *
 * Upstream's non-null assertions on the ordered id lookups are replaced with real
 * guards: an id can genuinely be missing for a frame while the store's ordering
 * and the rendered rows converge.
 */
import { ESTIMATED_TOAST_HEIGHT, MIN_STACK_SCALE_X } from './constants';
import type { ToastPosition, ToastProps } from './types';

export const getOrderedToastIds = (
  toasts: ToastProps[],
  position: ToastPosition,
  enableStacking: boolean,
): Array<string | number> => {
  if (enableStacking) {
    // Already in rendering order — the Toaster reverses top-center up front.
    return toasts.map((t) => t.id);
  }
  return position === 'top-center'
    ? toasts.map((t) => t.id).reverse()
    : toasts.map((t) => t.id);
};

/**
 * How much a buried row is squeezed horizontally, so the stack reads as depth.
 *
 * Scale rather than width: changing the real width would rewrap the text. Returns
 * 1 (no squeeze) for a single row, an expanded stack, stacking turned off, or
 * before the row width is known.
 *
 * `rowWidth` is the row's OWN width, not the window's. Upstream can use the
 * screen width because its row is always full-bleed; Bloom's is capped at
 * `TOAST_MAX_ROW_WIDTH`, and dividing a fixed `stackGap` inset by a 1280px window
 * would shrink a buried row by 4 visible pixels instead of the intended 16.
 */
export const calculateStackScaleX = ({
  index,
  numberOfToasts,
  enableStacking,
  position,
  isExpanded,
  stackGap,
  rowWidth,
}: {
  index: number;
  numberOfToasts: number;
  enableStacking: boolean;
  position: ToastPosition;
  isExpanded: boolean;
  stackGap: number;
  rowWidth: number;
}): number => {
  if (!enableStacking || numberOfToasts <= 1 || isExpanded || rowWidth <= 0) {
    return 1;
  }

  const distanceFromFront =
    position === 'top-center' ? index : numberOfToasts - index - 1;
  const narrowAmount = stackGap * distanceFromFront * 2;
  return Math.max(MIN_STACK_SCALE_X, 1 - narrowAmount / rowWidth);
};

const heightOf = (
  allToastHeights: Record<string | number, number>,
  id: string | number | undefined,
): number => {
  if (id === undefined) {
    return ESTIMATED_TOAST_HEIGHT;
  }
  // A measured 0 is not a real height — treat it as "not measured yet".
  return allToastHeights[id] || ESTIMATED_TOAST_HEIGHT;
};

export const calculateToastPosition = ({
  index,
  numberOfToasts,
  enableStacking,
  position,
  allToastHeights,
  gap,
  orderedToastIds,
  isExpanded,
  stackGap,
}: {
  index: number;
  numberOfToasts: number;
  enableStacking: boolean;
  position: ToastPosition;
  allToastHeights: Record<string | number, number>;
  gap: number;
  orderedToastIds: Array<string | number>;
  isExpanded: boolean;
  stackGap: number;
}): number => {
  const effectiveEnableStacking = enableStacking && !isExpanded;

  // Center anchors at top:50% of the screen (top edge of toast = center line).
  // Shift by -frontHeight/2 so the front toast is visually centered on the line.
  const centerShift =
    position === 'center'
      ? -(heightOf(allToastHeights, orderedToastIds[numberOfToasts - 1]) / 2)
      : 0;

  if (effectiveEnableStacking) {
    const currentHeight = heightOf(allToastHeights, orderedToastIds[index]);

    if (position === 'top-center') {
      const frontHeight = heightOf(allToastHeights, orderedToastIds[0]);
      return frontHeight + index * stackGap - currentHeight;
    }
    // bottom-center and center
    const frontHeight = heightOf(
      allToastHeights,
      orderedToastIds[numberOfToasts - 1],
    );
    const distFromFront = numberOfToasts - 1 - index;
    return (
      centerShift - (frontHeight + distFromFront * stackGap - currentHeight)
    );
  }

  const effectiveGap = isExpanded ? stackGap : gap;

  if (position === 'top-center') {
    let totalOffset = 0;
    for (let i = 0; i < index; i++) {
      const toastId = orderedToastIds[i];
      if (toastId === undefined) {
        continue;
      }
      totalOffset += heightOf(allToastHeights, toastId) + effectiveGap;
    }
    return totalOffset;
  }

  // bottom-center and center
  let totalOffset = 0;
  for (let i = numberOfToasts - 1; i > index; i--) {
    const toastId = orderedToastIds[i];
    if (toastId === undefined) {
      continue;
    }
    totalOffset += heightOf(allToastHeights, toastId) + effectiveGap;
  }
  return centerShift - totalOffset;
};
