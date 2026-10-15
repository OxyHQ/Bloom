import { type RefObject, useEffect, useRef } from 'react';
import type { View } from 'react-native';
import type { KeyCommand } from './types';

/**
 * Web: listen for keydown in the capture phase on the input's wrapper, so the
 * handler sees the key with its modifiers before the editing surface acts on
 * it, and can claim it (the default action and the surface's own handling
 * are then skipped).
 */
/** Web: whether the document's focused element sits inside the input. */
export function containsFocus(ref: RefObject<View | null>): boolean {
  const node = ref.current as unknown as HTMLElement | null;
  const active = typeof document === 'undefined' ? null : document.activeElement;
  return Boolean(node && active && node.contains(active));
}

export function useKeyCapture(
  ref: RefObject<View | null>,
  handler: ((command: KeyCommand) => boolean) | undefined,
): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  useEffect(() => {
    const node = ref.current as unknown as HTMLElement | null;
    if (!node || typeof node.addEventListener !== 'function') return;
    const listener = (event: KeyboardEvent) => {
      if (event.isComposing) return;
      const claimed = handlerRef.current?.({
        key: event.key,
        shift: event.shiftKey,
        alt: event.altKey,
        // One "command" modifier: Cmd on Apple platforms, Ctrl elsewhere.
        mod: event.metaKey || event.ctrlKey,
      });
      if (claimed) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    node.addEventListener('keydown', listener, true);
    return () => node.removeEventListener('keydown', listener, true);
  }, [ref]);
}
