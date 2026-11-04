import { type ComponentRef, useEffect, useRef, type RefObject } from 'react';
import { TextInput, type ScrollView } from 'react-native';
import { useKeyboardMetrics } from './use-keyboard-metrics';

/** Clearance kept between the focused field and the keyboard's top, px. */
export const KEYBOARD_REVEAL_MARGIN = 16;

type Measurable = {
  measureInWindow?: (cb: (x: number, y: number, width: number, height: number) => void) => void;
};

/**
 * Keep a scrolling page's focused field above the software keyboard — native
 * only; on web the browser scrolls a focused field into view itself.
 *
 * A page drawn edge to edge has the keyboard slide OVER it rather than resize
 * it: a field low on the page (the settings modal's Personalization, a Pixel 8a
 * at Android 16) stayed behind the keyboard with nothing to scroll it out. This
 * returns the keyboard's height for the page to pad its content by — so there
 * is room to scroll — and, when the keyboard shows, scrolls the page by exactly
 * what the focused field sits below the keyboard's top.
 *
 * `offset` is the page's current scroll offset (its scroll handler keeps it).
 */
export function useKeyboardReveal(
  scrollRef: RefObject<ComponentRef<typeof ScrollView> | null>,
  offset: { value: number },
  enabled = true,
): number {
  const { height, top } = useKeyboardMetrics({ enabled, timing: 'will' });
  const offsetRef = useRef(offset);
  offsetRef.current = offset;

  // After the commit that pads the page by the keyboard: before it, the scroll
  // range ends where the keyboard begins and the scroll would be clamped short.
  useEffect(() => {
    if (top === null) return;
    const field = TextInput.State?.currentlyFocusedInput?.() as Measurable | null | undefined;
    if (!field || typeof field.measureInWindow !== 'function') return;
    field.measureInWindow((_x, y, _width, fieldHeight) => {
      const overlap = y + fieldHeight + KEYBOARD_REVEAL_MARGIN - top;
      if (overlap > 0)
        scrollRef.current?.scrollTo({ y: offsetRef.current.value + overlap, animated: true });
    });
  }, [height, top, scrollRef]);

  return height;
}
