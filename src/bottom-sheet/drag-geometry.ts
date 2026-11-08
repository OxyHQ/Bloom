/** Direction ownership before a touch browser commits to native panning. */
export function sheetOwnsBodyDirection(
  delta: number,
  scrollOffset: number,
  expansionOffset: number,
) {
  'worklet';
  return (delta > 0 && scrollOffset <= 0) || (delta < 0 && expansionOffset > 0);
}

/** Gesture arbitration shared by modal dismissal and persistent detents. */
export function sheetPanIntent(
  delta: number,
  scrollOffset: number,
  expansionOffset: number,
  mode: 'dismiss' | 'detents',
): 'activate' | 'fail' | 'wait' {
  'worklet';
  const atTop = scrollOffset <= (mode === 'dismiss' ? 4 : 0);
  if (atTop && delta > 8) return 'activate';
  if (mode === 'dismiss') return delta < -4 || !atTop ? 'fail' : 'wait';
  if (Math.abs(delta) > 8 && sheetOwnsBodyDirection(delta, scrollOffset, expansionOffset))
    return 'activate';
  return Math.abs(delta) > 8 ? 'fail' : 'wait';
}

/** A short host never grows to an invented minimum larger than its own room. */
export function resolveSheetDetents(available: number, peek: number, half: number) {
  const full = Math.max(0, available);
  const collapsed = Math.min(full, Math.max(0, peek));
  const middle = Math.min(full, Math.max(collapsed, half));
  return {
    full,
    peek: collapsed,
    half: middle,
    offsets: { full: 0, half: full - middle, peek: full - collapsed },
    maxOffset: full - collapsed,
  };
}
