import { type RefObject, useEffect, useRef } from 'react';
import type { View } from 'react-native';
import type { PasteData } from './types';

/** Whether the clipboard holds files (a pasted image): those go to `onPasteImages`. */
function hasFiles(data: DataTransfer): boolean {
  for (const item of Array.from(data.items ?? [])) if (item.kind === 'file') return true;
  return (data.files?.length ?? 0) > 0;
}

/**
 * Web: listen for paste in the capture phase on the input's wrapper, so the
 * handler sees what the clipboard holds before the editing surface pastes,
 * and can claim it (the surface then pastes nothing).
 */
export function usePasteCapture(
  ref: RefObject<View | null>,
  handler: ((paste: PasteData) => boolean) | undefined,
): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  useEffect(() => {
    const node = ref.current as unknown as HTMLElement | null;
    if (!node || typeof node.addEventListener !== 'function') return;
    const listener = (event: ClipboardEvent) => {
      const data = event.clipboardData;
      if (!data || !handlerRef.current || hasFiles(data)) return;
      const claimed = handlerRef.current({
        html: data.getData('text/html'),
        text: data.getData('text/plain'),
      });
      if (claimed) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    node.addEventListener('paste', listener, true);
    return () => node.removeEventListener('paste', listener, true);
  }, [ref]);
}
