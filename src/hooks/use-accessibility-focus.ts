/**
 * Screen-reader focus for a surface that opens and closes.
 *
 * A sighted user's eye follows a menu when it appears. VoiceOver and TalkBack
 * do not: unless something moves their cursor, it stays wherever it was, so an
 * opened surface is announced as nothing and the user is left swiping through
 * the screen behind it hunting for content that is now covered. Closing is the
 * mirror image — the cursor was inside a view that has just unmounted, and it
 * lands back at the top of the root view rather than on the control the user
 * pressed.
 *
 * The two hooks here are a PAIR and are meant to be used as one: `useAccessibilityFocus`
 * on the surface, `useRestoreAccessibilityFocus` on the trigger. Using only the
 * first is worse than using neither, because it moves the cursor and never gives
 * it back.
 *
 * NATIVE ONLY, by construction rather than by omission. On web the browser owns
 * focus and Bloom's surfaces are real DOM in a portal, so both hooks return
 * early rather than asking the platform to move a cursor it does not have.
 *
 * The move is `AccessibilityInfo.sendAccessibilityEvent(view, 'focus')`, which
 * goes through the renderer (Fabric's `sendAccessibilityEvent`). The deprecated
 * `setAccessibilityFocus(reactTag)` takes React Native's legacy path instead,
 * which on Android reads `UIManager.getConstants().AccessibilityEventTypes`: in
 * a bridgeless app those constants exist only when the host installs the
 * legacy UIManager constants, so closing any surface threw a TypeError.
 */
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

/**
 * How long to wait before commanding the focus move, in ms.
 *
 * Not a guess and not a race-hiding sleep: the platform accessibility service
 * reads the view tree, and a view committed in this frame is not in it yet.
 * Both platforms drop a focus request aimed at a node that has not been laid
 * out, and drop it SILENTLY, which is why calling synchronously on mount looks
 * like the API not working. One frame is not reliably enough on a cold sheet
 * presentation; this is the smallest delay that survived both.
 */
export const FOCUS_SETTLE_MS = 50;

/**
 * Read at the point of use rather than hoisted to a module constant. The value
 * never changes at runtime, so the constant would be free — but it is captured
 * at IMPORT time, which puts the web branch out of reach of any test that does
 * not re-import the module. A guard nothing can exercise is a guard nobody knows
 * is still there.
 */
const isNative = (): boolean => Platform.OS !== 'web';

type HostInstance = Parameters<typeof AccessibilityInfo.sendAccessibilityEvent>[0];

/** Moves screen-reader focus to a mounted host view; nothing for an empty ref. */
function focusView(instance: unknown): void {
  if (instance == null) return;
  AccessibilityInfo.sendAccessibilityEvent(instance as HostInstance, 'focus');
}

/**
 * Move screen-reader focus INTO a surface when it opens.
 *
 * Attach the returned ref to the surface's container. That container must NOT be
 * `accessible`: collapsing it into one accessibility element would make its rows
 * unreachable, and focus would land on the group rather than on the first row.
 */
export function useAccessibilityFocus<T>(open: boolean): React.RefObject<T | null> {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    if (!isNative() || !open) return;
    const timer = setTimeout(() => focusView(ref.current), FOCUS_SETTLE_MS);
    return () => clearTimeout(timer);
  }, [open]);

  return ref;
}

/**
 * Give screen-reader focus BACK to the trigger when its surface closes.
 *
 * Fires on the `true -> false` edge only. A surface that was never open must not
 * steal the cursor on mount, which is what keying on `open` alone would do for
 * every closed menu on the screen. `restore` false at that edge leaves the
 * cursor where it goes next: a menu bar's menu closed because the next one
 * opened in its place, whose own surface takes the cursor.
 */
export function useRestoreAccessibilityFocus(
  open: boolean,
  ref: React.RefObject<unknown>,
  restore = true,
): void {
  const wasOpen = useRef(open);

  useEffect(() => {
    const closing = wasOpen.current && !open;
    wasOpen.current = open;
    if (!isNative() || !closing || !restore) return;
    // Let the surface finish unmounting first: moving the cursor to the trigger
    // while the surface is still in the tree lands it back inside the surface.
    const timer = setTimeout(() => focusView(ref.current), FOCUS_SETTLE_MS);
    return () => clearTimeout(timer);
  }, [open, ref, restore]);
}

/**
 * Screen-reader focus that follows the CURRENT ITEM of a collection that keeps
 * the keyboard itself: a file list whose arrows move its selection while the
 * list stays the one focused control, as Finder's list keeps the key view and
 * VoiceOver says each row the selection moves to.
 *
 * Each item hands its mounted view to the returned function under its key
 * (`ref={(view) => focusItem(item.key, view)}`); when `current` changes to a
 * key, screen-reader focus moves to that item's view — at once if it is
 * mounted, else as it mounts (a virtualized list drawing the row it scrolled
 * to). Focus on a view that is no control of the keyboard's leaves the
 * keyboard where it is, so the collection keeps it.
 *
 * Only a CHANGE of `current` moves focus: the collection appearing with an item
 * already current, or a row scrolled away and back, takes nothing from where
 * the cursor is. Native only, as the hooks above.
 */
export function useItemAccessibilityFocus(
  current: string | null,
): (key: string, view: unknown) => void {
  const views = useRef(new Map<string, unknown>());
  // The key focus is owed to until its view mounts.
  const pending = useRef<string | null>(null);
  const shown = useRef(current);
  // A move owed to a view that mounted, not yet made; the collection going cancels it.
  const mounted = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (mounted.current !== null) clearTimeout(mounted.current);
    },
    [],
  );

  useEffect(() => {
    const changed = shown.current !== current;
    shown.current = current;
    if (!isNative() || !changed || current === null) {
      if (changed) pending.current = null;
      return;
    }
    const view = views.current.get(current);
    if (view == null) {
      pending.current = current;
      return;
    }
    pending.current = null;
    const timer = setTimeout(() => focusView(view), FOCUS_SETTLE_MS);
    return () => clearTimeout(timer);
  }, [current]);

  const [register] = useState(() => (key: string, view: unknown) => {
    if (view == null) {
      views.current.delete(key);
      return;
    }
    views.current.set(key, view);
    if (pending.current !== key) return;
    pending.current = null;
    if (mounted.current !== null) clearTimeout(mounted.current);
    mounted.current = setTimeout(() => {
      mounted.current = null;
      focusView(view);
    }, FOCUS_SETTLE_MS);
  });
  return register;
}
