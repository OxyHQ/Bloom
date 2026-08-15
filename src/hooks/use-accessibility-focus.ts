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
 * focus, Bloom's surfaces are real DOM in a portal, and
 * `AccessibilityInfo.setAccessibilityFocus` is a no-op there — so both hooks
 * return early rather than calling into a function that silently does nothing.
 */
import { useEffect, useRef } from 'react';
import { AccessibilityInfo, findNodeHandle, Platform } from 'react-native';

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
const FOCUS_SETTLE_MS = 50;

/**
 * Read at the point of use rather than hoisted to a module constant. The value
 * never changes at runtime, so the constant would be free — but it is captured
 * at IMPORT time, which puts the web branch out of reach of any test that does
 * not re-import the module. A guard nothing can exercise is a guard nobody knows
 * is still there.
 */
const isNative = (): boolean => Platform.OS !== 'web';

/**
 * The node handle for a ref'd component, or `null`.
 *
 * `findNodeHandle` is typed for the class-component era (`React.Component`),
 * while a ref to a modern host component resolves to a host instance that
 * satisfies it at runtime but not in the type. Narrowed here, once, so no caller
 * has to.
 */
function nodeHandleOf(instance: unknown): number | null {
  if (instance == null) return null;
  return findNodeHandle(instance as React.Component);
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
    const timer = setTimeout(() => {
      const handle = nodeHandleOf(ref.current);
      if (handle != null) AccessibilityInfo.setAccessibilityFocus(handle);
    }, FOCUS_SETTLE_MS);
    return () => clearTimeout(timer);
  }, [open]);

  return ref;
}

/**
 * Give screen-reader focus BACK to the trigger when its surface closes.
 *
 * Fires on the `true -> false` edge only. A surface that was never open must not
 * steal the cursor on mount, which is what keying on `open` alone would do for
 * every closed menu on the screen.
 */
export function useRestoreAccessibilityFocus(
  open: boolean,
  ref: React.RefObject<unknown>,
): void {
  const wasOpen = useRef(open);

  useEffect(() => {
    const closing = wasOpen.current && !open;
    wasOpen.current = open;
    if (!isNative() || !closing) return;
    // Let the surface finish unmounting first: moving the cursor to the trigger
    // while the surface is still in the tree lands it back inside the surface.
    const timer = setTimeout(() => {
      const handle = nodeHandleOf(ref.current);
      if (handle != null) AccessibilityInfo.setAccessibilityFocus(handle);
    }, FOCUS_SETTLE_MS);
    return () => clearTimeout(timer);
  }, [open, ref]);
}
