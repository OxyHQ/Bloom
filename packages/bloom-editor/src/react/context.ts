import type { RichTextInputHandle } from '@oxy.so/bloom-text';
import { createContext, type ReactNode, useContext, useSyncExternalStore } from 'react';
import type { Block, BlockId } from '../model/document';
import type { SlashItem } from '../model/slash';
import type { EditorSnapshot, EditorStore } from '../model/store';
import type { EditorController } from './controller';
import type { BlockDecorations } from './decorations';
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

/** Something a mention can point at (a person, a page, a date), as the app finds it. */
export interface MentionItem {
  id: string;
  label: string;
  description?: string;
  /** Section heading in the menu (People, Pages…). */
  group?: string;
  /** Stored with the mention: what it points at, e.g. `{ kind: 'page', id }`. */
  attributes: Readonly<Record<string, string>>;
}

/** Where the editor looks up mentions: typing an indicator (`@`) opens the menu. */
export interface MentionSource {
  indicators: readonly string[];
  search(query: { indicator: string; text: string }): Promise<readonly MentionItem[]>;
}

/** An application action in a block's menu (comment on the block, copy a link to it). */
export interface BlockAction {
  id: string;
  label: string;
  onPress: (blockId: BlockId) => void;
}

export interface EditorContextValue {
  store: EditorStore;
  controller: EditorController;
  ui: UiStore;
  theme: EditorTheme;
  labels: EditorLabels;
  renderers: Readonly<Record<string, BlockRenderer>>;
  markers: Readonly<Record<string, BlockRenderer>>;
  blockActions: readonly BlockAction[];
  decorations?: BlockDecorations;
  mentions?: MentionSource;
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
