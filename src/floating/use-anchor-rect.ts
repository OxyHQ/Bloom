/**
 * Measure a trigger into the viewport-relative box `resolveDropdownPlacement`
 * takes. WEB ONLY — imported by the `.web.tsx` forks; the native families
 * present a sheet and never anchor to anything.
 *
 * `getBoundingClientRect` rather than `measureInWindow`: the panels are
 * `position: fixed`, so viewport coordinates are exactly what they need, and
 * the DOM call is synchronous — an async `measureInWindow` callback lands a
 * frame late and the surface visibly jumps into place on open.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { View } from 'react-native';

import type { FloatingAnchor } from './types';
import { useFrameThrottle } from './use-frame-throttle';

/**
 * react-native-web resolves a `View` ref to the DOM element itself. Read
 * through the one method needed rather than asserting the whole `HTMLElement`
 * interface, so a ref that is NOT a DOM node (a jsdom stub, a native build that
 * reached this file by accident) answers `null` instead of throwing.
 */
export function rectOf(node: View | null): FloatingAnchor | null {
  const element = node as unknown as { getBoundingClientRect?: () => DOMRect } | null;
  if (typeof element?.getBoundingClientRect !== 'function') return null;
  const box = element.getBoundingClientRect();
  return { top: box.top, bottom: box.bottom, left: box.left, right: box.right };
}

/**
 * Do two measurements describe the same box? Two `null`s do; a `null` and a box
 * do not.
 *
 * The anchor is the INPUT to every surface's placement, so its identity is what
 * decides whether an open panel re-renders. A fresh object per scroll event
 * re-resolves the placement, re-measures the panel and re-registers its
 * listeners for a trigger that did not move — which is most scroll events, since
 * a trigger inside a `position: fixed` header or a non-scrolling ancestor keeps
 * its viewport box while the page moves under it.
 */
export function sameAnchor(a: FloatingAnchor | null, b: FloatingAnchor | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.top === b.top && a.bottom === b.bottom && a.left === b.left && a.right === b.right;
}

/**
 * The trigger's viewport box while `open`, re-measured on scroll and resize.
 * `null` until it has been measured — callers render nothing until then rather
 * than painting at the wrong place for one frame.
 *
 * Opening measures SYNCHRONOUSLY in a layout effect, so the surface's first
 * painted frame is already in the right place. Everything after that is
 * coalesced to one measurement per animation frame ({@link useFrameThrottle})
 * and only replaces the box when it actually moved.
 */
export function useAnchorRect(
  ref: React.RefObject<View | null>,
  open: boolean,
): FloatingAnchor | null {
  const [anchor, setAnchor] = useState<FloatingAnchor | null>(null);
  // What was last published, mirrored so an unchanged measurement never reaches
  // the dispatcher at all. Returning the current state from a `setState` updater
  // is NOT the same thing: React still re-renders the component once before it
  // bails out, which on a scroll is a render per frame for a surface that has
  // not moved.
  const published = useRef<FloatingAnchor | null>(null);

  const store = useCallback((next: FloatingAnchor | null) => {
    if (sameAnchor(published.current, next)) return;
    published.current = next;
    setAnchor(next);
  }, []);

  const measure = useCallback(() => {
    store(rectOf(ref.current));
  }, [ref, store]);

  const schedule = useFrameThrottle(measure);

  useLayoutEffect(() => {
    if (!open) {
      store(null);
      return;
    }
    measure();
  }, [open, measure, store]);

  useEffect(() => {
    if (!open || typeof window === 'undefined') return;
    // Capture phase: a scroll inside any ancestor moves the trigger too, and a
    // bubbling listener never sees a scroll on an inner container.
    //
    // `schedule` is stable for the hook's whole life, so this pair is registered
    // ONCE per open and survives every re-measurement.
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, true);
    return () => {
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule, true);
    };
  }, [open, schedule]);

  return anchor;
}
