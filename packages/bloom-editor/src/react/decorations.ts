import { useSyncExternalStore } from 'react';
import type { BlockId } from '../model/document';

/** How a block is marked by the application: a coloured edge and a label (whose caret is there). */
export interface BlockDecoration {
  color: string;
  /** Read by assistive technology, e.g. "Ana is editing". */
  label?: string;
}

/**
 * Per-block decorations an application changes often (collaborators' carets):
 * a store outside the editor's context, so setting them re-renders only the
 * blocks whose decoration changed.
 */
export class BlockDecorations {
  private map: ReadonlyMap<BlockId, BlockDecoration> = new Map();
  private readonly listeners = new Set<() => void>();

  readonly subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  readonly get = (id: BlockId): BlockDecoration | undefined => this.map.get(id);

  /** Replace every decoration. */
  set(decorations: ReadonlyMap<BlockId, BlockDecoration>): void {
    this.map = decorations;
    for (const listener of this.listeners) listener();
  }
}

/** One block's decoration; re-renders only when it changes. */
export function useBlockDecoration(
  store: BlockDecorations | undefined,
  id: BlockId,
): BlockDecoration | undefined {
  return useSyncExternalStore(
    store?.subscribe ?? noop,
    () => store?.get(id),
    () => store?.get(id),
  );
}

const noop = () => () => {};
