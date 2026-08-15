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
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import type { View } from 'react-native';

import type { FloatingAnchor } from './types';

/**
 * react-native-web resolves a `View` ref to the DOM element itself. Read
 * through the one method needed rather than asserting the whole `HTMLElement`
 * interface, so a ref that is NOT a DOM node (a jsdom stub, a native build that
 * reached this file by accident) answers `null` instead of throwing.
 */
function rectOf(node: View | null): FloatingAnchor | null {
  const element = node as unknown as { getBoundingClientRect?: () => DOMRect } | null;
  if (typeof element?.getBoundingClientRect !== 'function') return null;
  const box = element.getBoundingClientRect();
  return { top: box.top, bottom: box.bottom, left: box.left, right: box.right };
}

/**
 * The trigger's viewport box while `open`, re-measured on scroll and resize.
 * `null` until it has been measured — callers render nothing until then rather
 * than painting at the wrong place for one frame.
 */
export function useAnchorRect(
  ref: React.RefObject<View | null>,
  open: boolean,
): FloatingAnchor | null {
  const [anchor, setAnchor] = useState<FloatingAnchor | null>(null);

  const measure = useCallback(() => {
    setAnchor(rectOf(ref.current));
  }, [ref]);

  useLayoutEffect(() => {
    if (!open) {
      setAnchor(null);
      return;
    }
    measure();
  }, [open, measure]);

  useEffect(() => {
    if (!open || typeof window === 'undefined') return;
    // Capture phase: a scroll inside any ancestor moves the trigger too, and a
    // bubbling listener never sees a scroll on an inner container.
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [open, measure]);

  return anchor;
}
