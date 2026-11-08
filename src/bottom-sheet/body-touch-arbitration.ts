import { sheetOwnsBodyDirection } from './drag-geometry';

/**
 * A touch browser decides native panning before RNGH's activation threshold.
 * Reserve only a panel-owned direction before that decision. Browser scrolling
 * remains native for the other directions; no scroll offsets are synthesized.
 */
export function attachSheetBodyTouchArbitration(
  node: HTMLElement,
  read: () => { enabled: boolean; scrollOffset: number; expansionOffset: number },
) {
  let start: { y: number; scrollOffset: number; expansionOffset: number } | null = null;
  const begin = (event: TouchEvent) => {
    const state = read();
    start =
      state.enabled && event.touches.length === 1
        ? { y: event.touches[0]!.clientY, ...state }
        : null;
  };
  const move = (event: TouchEvent) => {
    if (!start || event.touches.length !== 1) return;
    if (
      sheetOwnsBodyDirection(
        event.touches[0]!.clientY - start.y,
        start.scrollOffset,
        start.expansionOffset,
      ) &&
      event.cancelable
    )
      event.preventDefault();
  };
  const end = () => {
    start = null;
  };
  node.addEventListener('touchstart', begin, { passive: true });
  node.addEventListener('touchmove', move, { passive: false });
  node.addEventListener('touchend', end);
  node.addEventListener('touchcancel', end);
  return () => {
    node.removeEventListener('touchstart', begin);
    node.removeEventListener('touchmove', move);
    node.removeEventListener('touchend', end);
    node.removeEventListener('touchcancel', end);
  };
}
