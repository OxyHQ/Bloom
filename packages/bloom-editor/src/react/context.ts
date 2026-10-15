import type { RichTextInputHandle } from '@oxy.so/bloom-text';
import { createContext, type ReactNode, useContext, useSyncExternalStore } from 'react';
import type { Block, BlockId } from '../model/document';
import type { SlashItem } from '../model/slash';
import type { EditorSnapshot, EditorStore } from '../model/store';
import type { EditorLabels } from './labels';
import type { EditorTheme } from './theme';
import type { UiStore } from './ui-store';

/** What a custom block renderer receives. */
export interface BlockRendererProps {
  block: Block;
  readOnly: boolean;
  /** Merge into the block's props, as one undoable edit. */
  updateProps: (patch: Record<string, unknown>) => void;
  /** The block's children, laid out by the editor (for containers). */
  renderChildren: () => ReactNode;
}

export type BlockRenderer = (props: BlockRendererProps) => ReactNode;

export interface EditorContextValue {
  store: EditorStore;
  ui: UiStore;
  theme: EditorTheme;
  labels: EditorLabels;
  renderers: Readonly<Record<string, BlockRenderer>>;
  slashItems: readonly SlashItem[];
  onSlashAction?: (id: string, blockId: BlockId) => void;
  readOnly: boolean;
  /** Live input handles by block, for focus and formatting commands. */
  inputs: Map<BlockId, RichTextInputHandle>;
}

export const EditorContext = createContext<EditorContextValue | null>(null);

export function useEditorContext(): EditorContextValue {
  const value = useContext(EditorContext);
  if (!value) throw new Error('Editor components must render inside <BlockEditor>');
  return value;
}

/** The whole store snapshot (document, selection, undo state). */
export function useEditorSnapshot(store: EditorStore): EditorSnapshot {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}

/** One block; re-renders only when that block changes (blocks are immutable). */
export function useBlock(store: EditorStore, id: BlockId): Block | undefined {
  const read = () => store.getSnapshot().doc.blocks[id];
  return useSyncExternalStore(store.subscribe, read, read);
}
