/**
 * Bloom-original — NATIVE. Metro resolves this over `use-stack-hover.ts` on iOS and
 * Android, the same filename split `ToastHost.native.tsx` uses.
 *
 * Native keeps PRESS as the only way to expand a stack, so this hands back no
 * handlers at all. Two reasons it is a fork rather than a runtime `Platform` check:
 * the web file's module-level hover state and its `setTimeout` have no business
 * existing in a native bundle, and `onPointerEnter`/`onPointerLeave` DO fire on
 * native for touch (RN's pointer events unify touch and mouse), which would make
 * every tap expand-then-collapse while the press toggle fired as well.
 *
 * Keep the shape identical to the web file — `ToastSwipeHandler` spreads whatever
 * this returns onto the row box, and `ToastRow` calls `isStackHovered()`
 * unconditionally.
 */
export type StackHoverProps = Record<string, never>;

/** Parity with the web file's export; nothing here waits for anything. */
export const HOVER_LEAVE_GRACE = 0;

/** Nothing hovers on a touch screen. */
export function isStackHovered(): boolean {
  return false;
}

/** One frozen object, so spreading it never changes the row box's props. */
const NO_HOVER_PROPS: StackHoverProps = Object.freeze({});

export function useStackHover(_options: { enableStacking: boolean }): StackHoverProps {
  return NO_HOVER_PROPS;
}

/** Parity with the web file so the shared suite can call it on either platform. */
export function resetStackHoverForTests(): void {}
