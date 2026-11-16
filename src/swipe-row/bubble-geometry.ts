/** The full-swipe target must leave deliberate travel beyond the revealed actions. */
export function fullSwipeThreshold(rowWidth: number, paneWidth: number): number {
  'worklet';
  return Math.max(rowWidth * 0.72, paneWidth + 48);
}

/** No measured width, a missing key or insufficient space means reveal-only. */
export function canFullSwipe(rowWidth: number, paneWidth: number, hasAction: boolean): boolean {
  'worklet';
  return hasAction && rowWidth > 0 && fullSwipeThreshold(rowWidth, paneWidth) < rowWidth;
}

/**
 * Capsules share the revealed space. Beyond the resting width the chosen action
 * grows while its neighbours shrink; reversing the drag reverses the same geometry.
 */
export function bubbleGeometry(
  travel: number,
  paneWidth: number,
  rowWidth: number,
  count: number,
  index: number,
  primary: number,
): { width: number; gap: number; scaleY: number } {
  'worklet';
  const progress = Math.min(1, travel / Math.max(1, paneWidth));
  const expansion =
    primary < 0
      ? 0
      : Math.max(0, Math.min(1, (travel - paneWidth) / Math.max(1, rowWidth - paneWidth)));
  const gap = 4 * progress * (1 - expansion);
  const usable = Math.max(0, travel - gap * (count + 1));
  const normal = Math.max(0, paneWidth - 4 * (count + 1)) / Math.max(1, count);
  const secondary = normal * (1 - expansion);
  const width =
    expansion > 0
      ? index === primary
        ? usable - secondary * (count - 1)
        : secondary
      : usable / Math.max(1, count);
  return { width: Math.max(0, width), gap, scaleY: 0.82 + 0.18 * progress };
}
