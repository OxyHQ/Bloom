/**
 * Web variant of the scroll-restoration primitive.
 *
 * Mirrors the proven Bluesky pattern (manual `history.scrollRestoration` plus
 * an in-memory `Map<key, offset>`) with three deliberate differences forced by
 * Oxy's layouts and by the behaviour of the (expo-router-wrapped) React
 * Navigation web stack:
 *
 *  1. Bluesky restores the WINDOW scroller, whereas Oxy apps keep multi-column
 *     layouts whose feed scrolls an INNER container. So we restore the offset
 *     of a caller-registered scrollable (a ref to an element / RN scroll
 *     component, or the `'window'` sentinel).
 *
 *  2. The web stack HIDES the background screen on push. While hidden, the
 *     previous screen's scroll container collapses (`scrollHeight ===
 *     clientHeight`) and the navigator forces its `scrollTop` to 0. The screen
 *     is NOT unmounted, so a virtualized list (e.g. FlashList) keeps its rows
 *     but re-lays them out over SEVERAL frames once the screen is re-shown. Two
 *     problems follow, both handled here:
 *
 *       (a) A blur-time read of `scrollTop` returns the navigator's forced 0,
 *           not the user's real offset — saving it would clobber the good
 *           value. We therefore persist the last offset OBSERVED by the live
 *           scroll listener, never a fresh read taken at blur time.
 *
 *       (b) A single-frame restore writes `scrollTop` while the list is still
 *           collapsed; the write is clamped to 0 and never re-applied once the
 *           content grows. We therefore re-apply the target offset across a
 *           bounded run of animation frames, stopping as soon as the write
 *           sticks (the content has grown tall enough) or a small frame cap is
 *           reached.
 *
 *  3. A document-scrolled app (one window scroller shared by every route) has
 *     no per-screen container to reset, so an unrecognised key MUST be written
 *     to 0 explicitly. Doing nothing leaves the previous screen's offset in
 *     place and the new screen opens mid-page.
 *
 * Native bundlers use `./index.ts`; web bundlers select this file via the
 * `"browser"` export condition in `package.json`.
 */
import { useCallback, useRef } from 'react';

import { useScrollRestorationContext } from './context';
import { createScroller } from './scrollable.web';
import { deriveScrollKey } from './store';
import type {
  ScrollRestorationBinding,
  ScrollRestorationTarget,
  UseScrollRestorationOptions,
} from './types';

export { ScrollRestorationProvider } from './context';

export type {
  ScreenFocusEffect,
  ScrollableHandle,
  ScrollRestorationBinding,
  ScrollRestorationProviderProps,
  ScrollRestorationTarget,
  ScrollRouterAdapter,
  UseScrollRestorationOptions,
} from './types';

/**
 * Maximum number of animation frames the restore will re-apply the saved offset
 * before giving up. A virtualized list re-lays out its rows over a handful of
 * frames after its screen is re-shown; ~30 frames (≈0.5s at 60fps) is
 * comfortably longer than any observed relayout while staying short enough that
 * the loop never lingers as a perceptible cost. The loop normally exits far
 * earlier — as soon as the write sticks.
 */
const RESTORE_FRAME_CAP = 30;

/**
 * Tolerance (in CSS pixels) for considering a restore "stuck". After writing
 * `element.scrollTop = target`, the browser may clamp it to the current
 * `scrollHeight - clientHeight`; if the resulting offset is within this many
 * pixels of the target we treat the restore as complete. Sub-pixel rounding and
 * fractional device-pixel ratios make an exact equality check unreliable.
 */
const RESTORE_STICK_TOLERANCE_PX = 2;

/**
 * The web binding is a constant: this platform observes offsets by subscribing
 * to the resolved DOM node's own `scroll` event, so it needs nothing from the
 * caller. It is still returned — and still safe to spread onto a list — so a
 * call site is written once and runs on both platforms.
 */
const WEB_BINDING: ScrollRestorationBinding = { onScroll: () => undefined };

/**
 * Events that mean the USER has taken over the scroller, and the restore must
 * stop trying to put them back.
 *
 * The browser's own restoration is specified the same way: HTML §7.4.6.5 has
 * the UA re-attempt the saved position and "may continue to attempt to do so
 * periodically, until document's has been scrolled by the user becomes true".
 * Without this the loop fights anyone who starts scrolling inside the frame
 * budget, yanking them back once per frame for up to {@link RESTORE_FRAME_CAP}
 * frames.
 *
 * Two designs were rejected, and the reasons are the point:
 *
 *  - **"Any `scroll` event aborts"** — the obvious version, and it aborts on the
 *    FIRST frame every time: `setOffset` is itself a scroll, so the loop would
 *    cancel on the event its own write produced and no restore would ever
 *    complete.
 *  - **"Abort on an offset we did not write"** — tempting because it needs no
 *    listeners, but a virtualized list inserting rows ABOVE the viewport makes
 *    the browser's scroll anchoring move `scrollTop` on its own. That is
 *    precisely the situation the loop exists for, so the unexplained-delta test
 *    would abort exactly when it must not.
 *
 * What is being detected is user INPUT, so this detects user input. `pointerdown`
 * covers a scrollbar drag and a touch-less press; `keydown` covers arrow/page
 * keys, and reaches us whenever focus is inside the scroller it would scroll.
 */
const USER_TAKEOVER_EVENTS = ['wheel', 'touchstart', 'pointerdown', 'keydown'];

/**
 * Preserve and restore the scroll offset of `target` across navigation, keyed
 * by the content its screen is showing plus an optional `options.key`.
 *
 * Behaviour (web):
 * - On every scroll while the screen is focused, the current offset is recorded
 *   under the key that was live when the listener was attached. This stream of
 *   saves is the source of truth.
 * - On focus — and again whenever the key changes while the screen STAYS
 *   focused, which is how an in-screen tab or folder swap is seen at all — the
 *   offset saved for the new key is re-applied across a bounded run of
 *   animation frames, stopping as soon as the write sticks or
 *   {@link RESTORE_FRAME_CAP} is reached. Content never seen this session is
 *   written to 0 once instead; a write to 0 always sticks, so it needs no loop.
 * - On blur (and on a key change), the LAST OBSERVED offset is persisted under
 *   the OUTGOING key as a final safety net — not a fresh `scrollTop` read,
 *   which the navigator may already have forced to 0 while collapsing the
 *   hidden screen.
 */
export function useScrollRestoration(
  target: ScrollRestorationTarget,
  options?: UseScrollRestorationOptions,
): ScrollRestorationBinding {
  const { store, adapter } = useScrollRestorationContext();
  const contentId = adapter.useScreenContentId();
  const enabled = options?.enabled ?? true;
  const scrollKey = deriveScrollKey(contentId, options?.key);

  // The key this hook instance has already sent to the top. Writing 0 is a
  // one-time ARRIVAL action: a later re-run for the SAME key (`enabled` turning
  // on once the rows exist, a screen regaining focus) must not repeat it,
  // because by then the user may have scrolled somewhere the hook never got to
  // record. Restoring twice is harmless; resetting twice is data loss.
  const resetKeyRef = useRef<string | null>(null);

  adapter.useScreenFocusEffect(
    // Every varying input is a dependency rather than a ref read, so the
    // session below CLOSES OVER the key it belongs to. That is what makes a
    // key change mid-focus correct in both directions: the outgoing session's
    // cleanup persists to the old key, and the incoming one restores the new.
    useCallback(() => {
      if (!enabled || scrollKey === null) return undefined;

      const scroller = createScroller(target);
      const element =
        target === 'window'
          ? typeof window === 'undefined'
            ? null
            : window
          : resolveScrollEventTarget(target);

      // The last offset the live scroll listener observed for this session.
      // This — not a cleanup-time `getOffset()` — is what we persist at the
      // end, because by then the navigator may have collapsed the hidden
      // screen and forced its `scrollTop` to 0 (problem A). `null` means the
      // user never scrolled this session, so there is nothing newer to persist
      // than what the scroll listener already saved live.
      let lastObservedOffset: number | null = null;

      // The offset WE last wrote, which a real browser dispatches back as a
      // `scroll` event (jsdom does not, so the tests for this emit it
      // explicitly). Both writers arm it: the reset, and every frame of the
      // restore loop. Persisting either records an offset the user never
      // chose — the reset's 0 under a key another LIVE screen may share (the
      // two-live-entries trade content keying makes, see `deriveScrollKey`),
      // and the loop's intermediate value as a PARTIAL that outlives an
      // interrupted restore.
      //
      // A `restoring` FLAG covering the loop's duration is the obvious
      // alternative and is wrong. It could only be cleared by a takeover
      // event, so a session whose scroll came from a source that fires none —
      // `scrollIntoView` from another component, a focus-driven scroll — would
      // suppress saves indefinitely and never record the user's position at
      // all: an unbounded corruption traded for a bounded one. Arming a VALUE
      // is bounded to one event per write and covers every way the loop can
      // end (stuck, capped, aborted), because each frame re-arms.
      let echoOffset: number | null = null;

      // The largest offset reachable when we last PERSISTED one. A browser
      // clamp is recognised against this rather than against the previous
      // OBSERVATION, and that distinction is the whole mechanism: Chrome
      // dispatches TWO `scroll` events for one clamp, so an
      // observation-relative test sees the shrink on the first and nothing on
      // the second, which then saves the clamped value anyway. Measured.
      let maxOffsetAtLastSave = scroller.getMaxOffset();

      const save = () => {
        const offset = scroller.getOffset();
        const maxOffset = scroller.getMaxOffset();
        // Ignore a spurious 0 produced by the navigator collapsing a hidden
        // background screen: while collapsed the container cannot scroll, so
        // its `scrollTop` is forced to 0. Persisting it would clobber the good
        // offset recorded by earlier live saves (problem A). A genuine
        // scroll-to-top keeps the container scrollable and is saved normally.
        if (offset === 0 && maxOffset <= 0) return;
        // A partial clamp: the reachable range SHRANK and the offset is sitting
        // exactly at the new bottom. That is what the browser does to a tab
        // whose document has been taken over by a shorter sibling — the two
        // together are a signature a genuine scroll does not have, because
        // reaching the bottom on your own does not shrink the page in the same
        // breath. Suppressing keeps the pre-clamp offset, which on return
        // simply clamps to the same place if the content really did shrink.
        if (
          maxOffset < maxOffsetAtLastSave &&
          Math.abs(offset - maxOffset) <= RESTORE_STICK_TOLERANCE_PX
        ) {
          return;
        }
        if (offset === echoOffset) {
          // Our own write coming back. Consume the arming so a real scroll to
          // the same offset later is saved normally.
          echoOffset = null;
          return;
        }
        echoOffset = null;
        lastObservedOffset = offset;
        maxOffsetAtLastSave = maxOffset;
        store.save(scrollKey, offset);
      };

      // Restore and reset are ONE write. A miss reads 0, and 0 is exactly what
      // an unseen screen must be written to — left alone it would show the
      // previous screen's offset, since a document-scrolled app shares one
      // scroller across every route.
      const targetOffset = store.read(scrollKey);

      // They remain two DECISIONS, though, and `read` cannot tell them apart:
      // a key never seen and a key deliberately saved at the top both read 0.
      // Only the first is a RESET, and a reset is a one-time ARRIVAL action
      // gated on `resetKeyRef` — repeating it on a later re-run for the same
      // key would send a user who has since scrolled back to the top, and the
      // hook was inert while they did it so there is nothing to restore them
      // to afterwards. A 0 the user deliberately saved is theirs, and always
      // re-applies. `has` is the only thing that answers this.
      const isReset = !store.has(scrollKey);
      const alreadyReset = isReset && resetKeyRef.current === scrollKey;
      if (isReset) resetKeyRef.current = scrollKey;

      let rafId: number | null = null;

      const stopRestore = () => {
        if (rafId === null) return;
        cancelAnimationFrame(rafId);
        rafId = null;
      };

      if (alreadyReset) {
        // Nothing to write: this content has already been sent to the top once
        // and the user is wherever they have moved to since.
      } else if (targetOffset === 0) {
        // A write to 0 is never clamped away, so it needs no re-apply loop.
        echoOffset = 0;
        scroller.setOffset(0);
      } else if (typeof requestAnimationFrame !== 'undefined') {
        // Re-apply across a bounded run of frames. A freshly re-shown
        // virtualized list re-lays out its rows over several frames, so a
        // single write while it is still collapsed would be clamped to 0 and
        // never re-applied (problem B).
        //
        // Every write the loop makes is suppressed from the save path (see
        // `echoOffset` below), so an interrupted restore leaves the ORIGINAL
        // target stored rather than a partial. Nothing is lost on the success
        // path: `targetOffset` came out of the store, so persisting it again
        // would write back the same number.
        let framesLeft = RESTORE_FRAME_CAP;
        const applyOffset = () => {
          rafId = null;
          scroller.setOffset(targetOffset);
          framesLeft -= 1;
          // `getOffset` re-reads the value the browser actually took, which is
          // clamped to the content height it has reached so far. Arm it as the
          // echo to swallow: this write is about to come back as a `scroll`
          // event, and persisting a PARTIAL offset we wrote ourselves is how a
          // restore that is aborted or capped corrupts the stored position.
          const landed = scroller.getOffset();
          echoOffset = landed;
          // Stop once the write took effect (content grew tall enough) or we
          // exhaust the frame budget.
          const reached =
            Math.abs(landed - targetOffset) <= RESTORE_STICK_TOLERANCE_PX;
          if (!reached && framesLeft > 0) {
            rafId = requestAnimationFrame(applyOffset);
          }
        };
        rafId = requestAnimationFrame(applyOffset);
        // Only while a loop is actually in flight — the reset path has nothing
        // to abort, and the listeners would be idle on every screen.
        for (const type of USER_TAKEOVER_EVENTS) {
          element?.addEventListener(type, stopRestore, { passive: true });
        }
      }

      element?.addEventListener('scroll', save, { passive: true });

      return () => {
        stopRestore();
        element?.removeEventListener('scroll', save);
        // Removing a listener that was never added is a no-op, so this needs no
        // flag tracking whether the loop branch ran.
        for (const type of USER_TAKEOVER_EVENTS) {
          element?.removeEventListener(type, stopRestore);
        }
        // Final capture: persist the last offset the scroll listener OBSERVED,
        // never a fresh read (which the navigator may have forced to 0 while
        // collapsing the hidden screen). When the user never scrolled this
        // session there is nothing newer than the live saves already recorded.
        if (lastObservedOffset !== null) {
          store.save(scrollKey, lastObservedOffset);
        }
      };
    }, [store, scrollKey, enabled, target]),
  );

  return WEB_BINDING;
}

/**
 * Resolve the EventTarget to listen for `scroll` on. RNW scroll components
 * expose `getScrollableNode()`; raw refs may hold the DOM node directly.
 */
function resolveScrollEventTarget(
  target: Exclude<ScrollRestorationTarget, 'window'>,
): EventTarget | null {
  const current = target.current;
  if (current == null) return null;
  if (typeof EventTarget !== 'undefined' && current instanceof EventTarget) {
    return current;
  }
  const handle = current as { getScrollableNode?: () => unknown };
  if (typeof handle.getScrollableNode === 'function') {
    const node = handle.getScrollableNode();
    if (typeof EventTarget !== 'undefined' && node instanceof EventTarget) {
      return node;
    }
  }
  return null;
}
