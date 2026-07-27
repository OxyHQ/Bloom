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

/** The portal root every toast row lives under — see `portal/index.web.tsx`. */
const PORTAL_ROOT_ID = 'bloom-portal-root';

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
 * Whether the pointer is over the stack RIGHT NOW.
 *
 * Two sources, and both are load-bearing:
 *
 *  - the `hovered` latch answers "a mouse entered and has not left", which is the
 *    only thing available where there is no DOM (jest runs on `testEnvironment:
 *    'node'`), and is a cheap early-out.
 *  - the live `:hover` query answers "a row is under the pointer", which the latch
 *    CANNOT: a row can stop being hovered with no event whatsoever. Measured — a row
 *    culled by `visibleToasts` under a stationary cursor fires no `pointerleave`,
 *    `pointerout` or `mouseleave` at all, and the restack then slides the remaining
 *    rows out from under the pointer. A latch alone therefore sticks TRUE, which
 *    would disable the press toggle for the rest of the session and suppress every
 *    later auto-collapse.
 *
 * Requiring both means a stale latch is corrected by the DOM and a stray DOM match
 * (a pen, a touch) is rejected by the latch.
 *
 * COVERAGE, stated plainly: jest cannot see the DOM half at all
 * (`testEnvironment: 'node'`), and a browser cannot isolate it either — its two
 * consequences are a press toggle standing down (unreachable with a mouse, which
 * always hovers what it presses) and a suppressed auto-collapse (which the deferred
 * leave below independently corrects the moment any boundary event fires). Both
 * halves are kept because each is measurably more accurate than the other alone, not
 * because a test proves the composite.
 *
 * `ToastRow` asks so a press does not TOGGLE what hover already opened, and
 * `toastStore` asks before auto-collapsing a stack down to its last row. The press
 * still runs the toast's own `onPress`; only the expansion toggle steps aside.
 */
export function isStackHovered(): boolean {
  return hovered && rowUnderPointer() !== false;
}

/**
 * The live DOM answer, or `undefined` where there is no DOM to ask (jest runs on
 * `testEnvironment: 'node'`). Deliberately tri-state: "unknowable" and "no" must not
 * collapse into the same value, because the two callers want opposite defaults —
 * `isStackHovered` trusts the latch when it cannot check, while the deferred leave
 * only stands down on a positive "yes, still hovered".
 */
function rowUnderPointer(): boolean | undefined {
  if (typeof document === 'undefined') {
    return undefined;
  }
  return document.querySelector(`#${PORTAL_ROOT_ID} [aria-live]:hover`) !== null;
}

/**
 * A pointer resting on the stack HOLDS it open, so the store must not auto-collapse
 * it out from under the cursor. Registered here rather than passed in because this
 * file is the one that knows what hovering means; the store only knows that
 * something says "not yet". Native's fork registers nothing.
 */
toastStore.setExpansionHold(isStackHovered);

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
          // The rows may have moved rather than the pointer: an expand, a collapse
          // or a restack slides them under a stationary cursor without firing a
          // single pointer event, so re-ask the DOM before acting on a leave that
          // fired 80ms ago. Only a positive "still hovered" stands the collapse down.
          if (rowUnderPointer() === true) {
            return;
          }
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
