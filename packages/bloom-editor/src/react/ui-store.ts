import { useSyncExternalStore } from 'react';
import type { BlockId } from '../model/document';

/** Transient editor UI state, kept out of the document and its history. */
export interface UiState {
  /** The open slash menu: the block, where the slash is, the typed query. */
  slash: { blockId: BlockId; slashAt: number; query: string; highlighted: number } | null;
  /** The block whose options menu is open. */
  blockMenu: BlockId | null;
  /** Blocks selected as whole blocks (Escape, Shift-click, drag selection). */
  selectedBlocks: readonly BlockId[];
  /** The block under the pointer (web), for its gutter handle. */
  hovered: BlockId | null;
  /** A block being dragged and where it would drop. */
  drag: {
    ids: readonly BlockId[];
    target: BlockId | null;
    position: 'before' | 'after' | 'inside';
  } | null;
}

export class UiStore {
  private state: UiState = {
    slash: null,
    blockMenu: null,
    selectedBlocks: [],
    hovered: null,
    drag: null,
  };
  private readonly listeners = new Set<() => void>();

  readonly subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  readonly get = (): UiState => this.state;

  set(patch: Partial<UiState>): void {
    this.state = { ...this.state, ...patch };
    for (const listener of this.listeners) listener();
  }
}

/** Read a slice of UI state; re-renders only when the slice changes. */
export function useUi<T>(store: UiStore, select: (state: UiState) => T): T {
  return useSyncExternalStore(
    store.subscribe,
    () => select(store.get()),
    () => select(store.get()),
  );
}
