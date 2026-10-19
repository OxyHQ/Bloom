import type { BlockId } from '../model/document';
import type { EditorStore } from '../model/store';
import type { UiStore } from './ui-store';

/** Native: blocks move through the block menu, not by dragging the gutter. */
export function startBlockDrag(
  _store: EditorStore,
  _ui: UiStore,
  _id: BlockId,
  _start: { x: number; y: number },
  _prefix: string,
): void {}
