import { useEffect, useRef } from 'react';

import type { WindowDragHandlers } from './types';

/**
 * Follows drags over the page, from any application (`useWindowDrag`), on the
 * web: the document's HTML5 drag events.
 *
 * - A drag comes over the page with its first `dragenter` (or `dragover`).
 * - Moving within the page, a drag enters the next element before it leaves
 *   the last (HTML's drag-and-drop processing model), so it has left the page
 *   when it leaves the element it last entered for nothing of the page. That
 *   holds when the element under it is replaced (a folder sprung open), whose
 *   leaving never reaches the document, where counting entries and leavings
 *   would not.
 * - Released over something of the page that took it, the `drop` reaches the
 *   document after the zone's own `onDrop`: dropped. Released over nothing
 *   that takes it, or Escape, the browser fires `dragleave`: not dropped.
 * - A drag that started in the page ends with `dragend`, which also ends one
 *   whose `drop` a target kept from the document.
 */
export function useWindowDrag(handlers: WindowDragHandlers): void {
  const latest = useRef(handlers);
  latest.current = handlers;
  useEffect(() => {
    if (typeof document === 'undefined') return;
    let inside = false;
    // The element the drag last entered.
    let over: EventTarget | null = null;
    const enter = (event: DragEvent) => {
      over = event.target;
      if (inside) return;
      inside = true;
      latest.current.onEnter?.();
    };
    const exit = (dropped: boolean) => {
      over = null;
      if (!inside) return;
      inside = false;
      latest.current.onExit?.(dropped);
    };
    const onDragEnter = (event: DragEvent) => enter(event);
    const onDragOver = (event: DragEvent) => {
      if (!inside) enter(event);
    };
    const onDragLeave = (event: DragEvent) => {
      const to = event.relatedTarget;
      if (to instanceof Node && document.contains(to)) return;
      if (event.target === over) exit(false);
    };
    const onDrop = () => exit(true);
    const onDragEnd = (event: DragEvent) => {
      const effect = event.dataTransfer?.dropEffect;
      exit(effect !== undefined && effect !== 'none');
    };
    document.addEventListener('dragenter', onDragEnter);
    document.addEventListener('dragover', onDragOver);
    document.addEventListener('dragleave', onDragLeave);
    document.addEventListener('drop', onDrop);
    document.addEventListener('dragend', onDragEnd);
    return () => {
      document.removeEventListener('dragenter', onDragEnter);
      document.removeEventListener('dragover', onDragOver);
      document.removeEventListener('dragleave', onDragLeave);
      document.removeEventListener('drop', onDrop);
      document.removeEventListener('dragend', onDragEnd);
    };
  }, []);
}
