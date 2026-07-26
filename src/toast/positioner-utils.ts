/**
 * Derived from sonner-native v0.26.4 — src/positioner-utils.ts
 * (MIT © Gunnar Torfi Steinarsson). See the top-level NOTICE.
 *
 * Pure geometry for the per-position container: `position: 'absolute'` is correct
 * here because the toast host provides a viewport-sized containing block (see
 * `ToastHost`), which is what keeps this module platform-agnostic.
 */
import type { ViewStyle } from 'react-native';
import { ESTIMATED_TOAST_HEIGHT, OUTSIDE_PRESS_PADDING } from './constants';
import type { ToastPosition } from './types';

export const getContainerStyle = (position: ToastPosition): ViewStyle => {
  if (position === 'center') {
    return {
      position: 'absolute',
      top: '50%',
      left: 0,
      right: 0,
      alignItems: 'center',
      overflow: 'visible',
    };
  }

  return {
    position: 'absolute',
    width: '100%',
    alignItems: 'center',
    overflow: 'visible',
  };
};

/**
 * A falsy `offset` means "derive from the safe area": the stack sits `inset + 8`
 * from the edge, or 16 when there is no inset.
 */
export const getInsetValues = ({
  position,
  offset,
  safeAreaInsets,
}: {
  position: ToastPosition;
  offset?: number;
  safeAreaInsets?: { top: number; bottom: number };
}): { top?: number; bottom?: number } => {
  const { top = 0, bottom = 0 } = safeAreaInsets || {};

  if (position === 'bottom-center') {
    if (offset) return { bottom: offset };
    return { bottom: bottom > 0 ? bottom + 8 : 16 };
  }

  if (position === 'top-center') {
    if (offset) return { top: offset };
    return { top: top > 0 ? top + 8 : 16 };
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
