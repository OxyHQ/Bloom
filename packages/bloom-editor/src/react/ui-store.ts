import type { ActiveMarks } from '@oxy.so/bloom-text/model';
import { useSyncExternalStore } from 'react';
import type { BlockId } from '../model/document';
import type { FormatAction, MentionItem } from './context';

/** Transient editor UI state, kept out of the document and its history. */
export interface UiState {
  /** The open slash menu: the block, where the slash is, the typed query. */
  slash: { blockId: BlockId; slashAt: number; query: string; highlighted: number } | null;
  /** The open mention menu: the block, the indicator and text typed after it, the matches. */
  mention: {
    blockId: BlockId;
    indicator: string;
    text: string;
    highlighted: number;
    items: readonly MentionItem[];
    loading: boolean;
  } | null;
  /** The block whose text input has the keyboard. */
  focused: BlockId | null;
  /** The formatting active at the focused block's selection, as its input reports it. */
  marks: { blockId: BlockId; marks: ActiveMarks } | null;
  /** The block whose selection a link is being entered for. */
  linking: BlockId | null;
  /** The block whose options menu is open. */
  blockMenu: BlockId | null;
  /** Blocks selected as whole blocks (Escape, Shift-click, drag selection). */
  selectedBlocks: readonly BlockId[];
  /** Where a block selection started, and where Shift-click or Shift-arrows took it. */
  selectionAnchor: BlockId | null;
  selectionHead: BlockId | null;
  /** The code block whose language menu is open. */
  codeLanguageMenu: BlockId | null;
  /** The block under the pointer (web), for its gutter handle. */
  hovered: BlockId | null;
  /** The application's actions on selected text, as the editor was given them. */
  formatActions: readonly FormatAction[];
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
    mention: null,
    focused: null,
    marks: null,
    linking: null,
    blockMenu: null,
    selectedBlocks: [],
    selectionAnchor: null,
    selectionHead: null,
    codeLanguageMenu: null,
    hovered: null,
    formatActions: [],
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
