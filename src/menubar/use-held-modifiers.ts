/**
 * The modifier keys held, followed while an open menu shows an item with an
 * alternate (`MenubarItemProps.alternate`), as a Mac's menu follows the flags
 * to swap an item for its alternate the instant Option goes down or up.
 *
 * WHERE THEY COME FROM:
 *  - the platform's `keyboard`: its `subscribeModifiers` (each change, and
 *    those held as the window takes the keyboard), and each key press's flags
 *    (a modifier's own press holds it), for a platform that tells no changes;
 *  - otherwise the document (the web): each key going down or up, and the
 *    pointer's flags as it moves or presses, so a menu opened with Option held
 *    shows its alternates as soon as the pointer moves; the window losing
 *    focus releases them all;
 *  - otherwise none: no modifier is ever held.
 */
import { useEffect, useState } from 'react';

import { usePlatformKeyboard } from '../platform-surface/context';
import type { PlatformKeyEvent, PlatformModifiers } from '../platform-surface/types';

export const NO_MODIFIERS: PlatformModifiers = {
  altKey: false,
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
};

/** The flags a key press leaves held: its own, and its key when the key is a modifier. */
export function modifiersOfKey(event: PlatformKeyEvent): PlatformModifiers {
  return {
    altKey: event.altKey || event.key === 'Alt',
    ctrlKey: event.ctrlKey || event.key === 'Control',
    metaKey: event.metaKey || event.key === 'Meta',
    shiftKey: event.shiftKey || event.key === 'Shift',
  };
}

const sameModifiers = (a: PlatformModifiers, b: PlatformModifiers) =>
  a.altKey === b.altKey &&
  a.ctrlKey === b.ctrlKey &&
  a.metaKey === b.metaKey &&
  a.shiftKey === b.shiftKey;

const flagsOf = (event: PlatformModifiers): PlatformModifiers => ({
  altKey: !!event.altKey,
  ctrlKey: !!event.ctrlKey,
  metaKey: !!event.metaKey,
  shiftKey: !!event.shiftKey,
});

/** The modifiers held now, while the calling component is mounted. */
export function useHeldModifiers(): PlatformModifiers {
  const keyboard = usePlatformKeyboard();
  const [held, setHeld] = useState(NO_MODIFIERS);

  useEffect(() => {
    const hold = (next: PlatformModifiers) =>
      setHeld((was) => (sameModifiers(was, next) ? was : next));
    if (keyboard) {
      const changes = keyboard.subscribeModifiers?.((flags) => hold(flagsOf(flags)));
      const presses = keyboard.subscribe((event) => {
        hold(modifiersOfKey(event));
        return false;
      });
      return () => {
        changes?.();
        presses();
      };
    }
    if (typeof document === 'undefined' || typeof window === 'undefined') return undefined;
    // A key going down carries its own modifier's flag, and going up drops it (W3C).
    const onKey = (event: KeyboardEvent) => hold(flagsOf(event));
    const onPointer = (event: PointerEvent) => hold(flagsOf(event));
    const onBlur = () => hold(NO_MODIFIERS);
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('keyup', onKey, true);
    document.addEventListener('pointermove', onPointer, true);
    document.addEventListener('pointerdown', onPointer, true);
    window.addEventListener('blur', onBlur);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.removeEventListener('keyup', onKey, true);
      document.removeEventListener('pointermove', onPointer, true);
      document.removeEventListener('pointerdown', onPointer, true);
      window.removeEventListener('blur', onBlur);
    };
  }, [keyboard]);

  return held;
}
