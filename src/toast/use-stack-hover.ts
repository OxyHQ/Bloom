/**
 * Bloom-original — WEB/default. `use-stack-hover.native.ts` is the native no-op,
 * filename-resolved by Metro exactly as `ToastHost.native.tsx` is, so `toast/`
 * stays one universal engine with no `index.web` fork.
 *
 * sonner expands its stack on HOVER; sonner-native only has press, because a phone
 * has no pointer. Bloom needs both: press is the touch and native affordance, hover
 * is what a desktop user expects, and a touch-capable web device must not get a
 * phantom hover from its own taps.
 *
 * THIS IS A TRIGGER, NOT A SECOND MECHANISM. It drives the store's existing
 * `expand`/`collapse`, which already pause and resume the auto-close timers
 * (`ToastStore.expand` calls `timers.pauseAll()`, `collapse` calls `resumeAll()`),
 * so hovering to read a toast cannot let it expire under the cursor — no new
 * pausing path, no new store state. With stacking OFF there is nothing to expand,
 * so the pointer pauses the timers directly instead: the reason sonner pauses is
 * that the pointer is over the toast, which has nothing to do with stacking.
 *
 * TWO THINGS ARE LOAD-BEARING:
 *
 *  - `pointerType === 'mouse'`. Touch fires `pointerenter` before `pointerdown`
 *    and `pointerleave` after `pointerup` (the pointer ceases to exist), so
 *    without this guard every TAP on a touch-capable web device would expand then
 *    collapse the stack while the press toggle fired too — three handlers fighting
 *    over one tap. Hover is additive: pens and touch fall through to press.
 *  - THE LEAVE IS DEFERRED BY A FRAME-ISH GRACE PERIOD, and any enter cancels it.
 *    Rows are separate absolutely-positioned boxes with `gap` between them once
 *    expanded, so moving the pointer from one row to the next leaves the first
 *    before entering the second. Collapsing on that would snap the stack shut and
 *    reopen it on whatever row ends up under the pointer — a jitter loop, plus a
 *    resume/pause pair per crossing that re-banks each timer's remaining time.
 *
 * The state is module-level on purpose: there is ONE stack per document, the same
 * reason `toastStore` is a module singleton. It is written and read only inside
 * event handlers — never in render — so the React Compiler has nothing to freeze.
 */
import { useMemo } from 'react';

import { toastStore } from './toast-store';

/**
 * How long a leave waits for a neighbouring row to claim the pointer. One frame is
 * enough for the same-tick leave/enter pair a row crossing produces; this is a
 * little more so a slow frame cannot flash the stack shut. Exported so the suite
 * asserts against the real value rather than a copy of it.
 */
export const HOVER_LEAVE_GRACE = 80;

type HoverEvent = { nativeEvent: { pointerType?: string } };

let hovered = false;
let leaveTimeout: ReturnType<typeof setTimeout> | null = null;

const isMouse = (event: HoverEvent) => event.nativeEvent.pointerType === 'mouse';

const cancelPendingLeave = () => {
  if (leaveTimeout !== null) {
    clearTimeout(leaveTimeout);
    leaveTimeout = null;
  }
};

/**
 * Whether the pointer is over the stack right now. `ToastRow` asks so a press does
 * not TOGGLE what hover already opened — on web a click would otherwise collapse
 * the stack under the cursor and resume its timers. The press still runs the
 * toast's own `onPress`; only the expansion toggle steps aside.
 */
export function isStackHovered(): boolean {
  return hovered;
}

export type StackHoverProps = {
  onPointerEnter: (event: HoverEvent) => void;
  onPointerLeave: (event: HoverEvent) => void;
};

export function useStackHover({
  enableStacking,
}: {
  enableStacking: boolean;
}): StackHoverProps {
  // Stable per outlet configuration: these land on the row box as props, and every
  // row re-renders on each stack change.
  return useMemo(
    () => ({
      onPointerEnter: (event: HoverEvent) => {
        if (!isMouse(event)) {
          return;
        }
        cancelPendingLeave();
        hovered = true;
        if (enableStacking) {
          // Pauses the timers as part of expanding.
          toastStore.expand();
        } else {
          toastStore.pauseAllTimers();
        }
      },
      onPointerLeave: (event: HoverEvent) => {
        if (!isMouse(event) || !hovered) {
          return;
        }
        cancelPendingLeave();
        leaveTimeout = setTimeout(() => {
          leaveTimeout = null;
          hovered = false;
          if (enableStacking) {
            // Resumes the timers as part of collapsing.
            toastStore.collapse();
          } else {
            toastStore.resumeAllTimers();
          }
        }, HOVER_LEAVE_GRACE);
      },
    }),
    [enableStacking],
  );
}

/** Test-only reset: the module state outlives a render tree, so a suite must clear it. */
export function resetStackHoverForTests(): void {
  cancelPendingLeave();
  hovered = false;
}
