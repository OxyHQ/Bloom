import { useEffect, useRef } from 'react';

import { usePlatformDrag } from '../platform-surface/context';
import type { WindowDragHandlers } from './types';

/**
 * Follows drags over the application's window, from any application: `onEnter`
 * when one first comes over it, `onExit(dropped)` when it has left or ended,
 * `dropped` true when it was dropped on this window (after that drop's
 * `onDrop`). A window that opened a folder under a drag puts it back when the
 * drag exits without a drop, as Finder's spring-loaded folders do.
 *
 * Native: the platform's `drag.watchWindow`, when the adapter reports
 * `drag-and-drop` and has it; otherwise nothing is told. The handlers are
 * read when called, so they need not be memoised.
 */
export function useWindowDrag(handlers: WindowDragHandlers): void {
  const drag = usePlatformDrag();
  const latest = useRef(handlers);
  latest.current = handlers;
  useEffect(() => {
    if (!drag?.watchWindow) return;
    return drag.watchWindow((event) => {
      if (event.type === 'enter') latest.current.onEnter?.();
      else latest.current.onExit?.(event.dropped);
    });
  }, [drag]);
}
