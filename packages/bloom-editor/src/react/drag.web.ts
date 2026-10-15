import { moveBlocks } from '../model/commands';
import type { BlockId } from '../model/document';
import { acceptsChildren } from '../model/schema';
import type { EditorStore } from '../model/store';
import { BLOCK_DOM_PREFIX } from './block-dom';
import type { UiStore } from './ui-store';

const THRESHOLD = 4;

/** The block under a point and where a drop there would land. */
function dropTarget(
  store: EditorStore,
  x: number,
  y: number,
): { target: BlockId; position: 'before' | 'after' | 'inside' } | null {
  const element = document.elementFromPoint(x, y)?.closest(`[id^="${BLOCK_DOM_PREFIX}"]`);
  const target = element?.id.slice(BLOCK_DOM_PREFIX.length);
  if (!element || !target) return null;
  const block = store.doc.blocks[target];
  if (!block) return null;
  // Measure the block's own row, not its children below it.
  const row = (element.firstElementChild as HTMLElement | null) ?? (element as HTMLElement);
  const rect = row.getBoundingClientRect();
  const ratio = (y - rect.top) / Math.max(rect.height, 1);
  if (acceptsChildren(store.schema, block) && ratio > 0.3 && ratio < 0.7 && y <= rect.bottom) {
    return { target, position: 'inside' };
  }
  return { target, position: ratio < 0.5 ? 'before' : 'after' };
}

/**
 * Web: drag a block (or the selected blocks it belongs to) by its gutter
 * handle. The pointer is followed on the window; a drop runs `moveBlocks`.
 * Under the threshold it stays a click, which opens the block menu.
 */
export function startBlockDrag(
  store: EditorStore,
  ui: UiStore,
  id: BlockId,
  start: { x: number; y: number },
): void {
  const startX = start.x;
  const startY = start.y;
  const selected = ui.get().selectedBlocks;
  const ids = selected.includes(id) ? selected : [id];
  let dragging = false;

  const onMove = (e: PointerEvent) => {
    if (!dragging) {
      if (Math.hypot(e.pageX - startX, e.pageY - startY) < THRESHOLD) return;
      dragging = true;
      document.body.style.cursor = 'grabbing';
    }
    e.preventDefault();
    const drop = dropTarget(store, e.clientX, e.clientY);
    ui.set({ drag: { ids, target: drop?.target ?? null, position: drop?.position ?? 'after' } });
  };

  const onUp = () => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    document.body.style.cursor = '';
    const drag = ui.get().drag;
    if (dragging && drag?.target) {
      store.sealHistory();
      store.run((c) => moveBlocks(c, drag.ids, drag.target as BlockId, drag.position));
    }
    // Cleared after the click this pointerup produces, so the handle's press
    // handler can tell a drag from a click.
    setTimeout(() => ui.set({ drag: null }), 0);
  };

  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
}
