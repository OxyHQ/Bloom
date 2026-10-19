import { useSyncExternalStore } from 'react';
import type { BlockId } from '../model/document';

/**
 * A stretch of a block's text the application marks: a highlight behind it
 * (a collaborator's selection, a commented passage), a caret, or both.
 * Offsets are the block's plain-text offsets, as its selection counts them.
 */
export interface TextRangeDecoration {
  start: number;
  /**
   * Where the caret is drawn, when there is one: a selection made backwards
   * has its `end` before its `start`.
   */
  end: number;
  /** A colour behind the text from `start` to `end`. */
  background?: string;
  /** A thin caret at `end`, with a name over it. */
  caret?: { color: string; label?: string };
}

/**
 * How a block is marked by the application: a coloured edge and a label
 * (whose caret is there), and marks on stretches of its text.
 */
export interface BlockDecoration {
  /** The colour of an edge beside the block; no edge without one. */
  color?: string;
  /** Read by assistive technology, e.g. "Ana is editing". */
  label?: string;
  /**
   * Highlights and carets in the block's text. Drawn over the text while the
   * block is not being edited; while it is, over the input on web, and not at
   * all on native (where the input tells nothing of where its text is drawn).
   */
  ranges?: readonly TextRangeDecoration[];
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
