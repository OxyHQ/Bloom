import { useEffect, useRef, useState, type RefObject } from 'react';
import { Keyboard, Platform, TextInput, type KeyboardEvent, type ScrollView } from 'react-native';

/** Clearance kept between the focused field and the keyboard's top, px. */
export const KEYBOARD_REVEAL_MARGIN = 16;

type Measurable = { measureInWindow?: (cb: (x: number, y: number, width: number, height: number) => void) => void };

/**
 * Keep a settings page's focused field above the software keyboard — native
 * only; on web the browser scrolls a focused field into view itself.
 *
 * The settings modal draws edge to edge, so the keyboard slides OVER it rather
 * than resizing it: a field low on a page (Personalization's last input, a
 * Pixel 8a at Android 16) stayed behind the keyboard with nothing to scroll it
 * out. This returns the keyboard's height for the page to pad its content by —
 * so there is room to scroll — and, when the keyboard shows, scrolls the page
 * by exactly what the focused field sits below the keyboard's top.
 *
 * `offset` is the page's current scroll offset (its scroll handler keeps it).
 */
export function useKeyboardReveal(
  scrollRef: RefObject<ScrollView | null>,
  offset: { value: number },
  enabled: boolean,
): number {
  const [keyboard, setKeyboard] = useState<{ height: number; overlap: number }>({ height: 0, overlap: 0 });
  const offsetRef = useRef(offset);
  offsetRef.current = offset;

  useEffect(() => {
    if (!enabled || typeof Keyboard?.addListener !== 'function') return;
    const reveal = (event: KeyboardEvent) => {
      const { height, screenY } = event.endCoordinates;
      const field = TextInput.State?.currentlyFocusedInput?.() as Measurable | null | undefined;
      if (!field || typeof field.measureInWindow !== 'function') {
        setKeyboard({ height, overlap: 0 });
        return;
      }
      field.measureInWindow((_x, y, _width, fieldHeight) => {
        setKeyboard({ height, overlap: Math.max(0, y + fieldHeight + KEYBOARD_REVEAL_MARGIN - screenY) });
      });
    };
    // iOS announces the keyboard before it moves; Android only once it is up.
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', reveal);
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () =>
      setKeyboard({ height: 0, overlap: 0 }),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, [enabled]);

  // After the commit that pads the page by the keyboard: before it, the scroll
  // range ends where the keyboard begins and the scroll would be clamped short.
  useEffect(() => {
    if (keyboard.overlap > 0) scrollRef.current?.scrollTo({ y: offsetRef.current.value + keyboard.overlap, animated: true });
  }, [keyboard, scrollRef]);

  return enabled ? keyboard.height : 0;
}
