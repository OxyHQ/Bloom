import type { PastedImage, RichTextInputHandle } from '@oxy.so/bloom-text';
import type { MentionMark } from '@oxy.so/bloom-text/model';
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

/** A stretch of one block's text, as a format action receives it. */
export interface TextRangeSelection {
  blockId: BlockId;
  start: number;
  end: number;
}

/**
 * An application action on selected text (comment on it, ask about it),
 * shown after the marks in the web selection bubble and in `EditorToolbar`
 * while text is selected.
 */
export interface FormatAction {
  id: string;
  /** Its accessible name, and what the button shows without an icon. */
  label: string;
  /** Draws the button's icon in the toolbar's colour and size. */
  icon?: (props: { color: string; size: number }) => ReactNode;
  onPress: (selection: TextRangeSelection) => void;
}

/** What is being pasted into a block's text, before the editor pastes it. */
export interface PasteTextInput {
  text: string;
  /** The clipboard's HTML, when it has some. */
  html?: string;
  blockId: BlockId;
}

/**
 * Asked before blocks are removed; nothing is removed unless it answers true
 * (or resolves to true).
 */
export type ConfirmRemove = (ids: readonly BlockId[]) => boolean | Promise<boolean>;

/** A language a code block can be in, as the app names it. */
export interface CodeLanguage {
  /** Stored as the block's `language` prop. */
  id: string;
  label: string;
}

/** One run of highlighted code: its text and the colour the app gives it. */
export interface CodeToken {
  text: string;
  color?: string;
}

/**
 * Highlights code for display: the lines of `code` (split at `\n`), each a
 * list of tokens whose texts join up to that line exactly.
 */
export type CodeHighlighter = (code: string, language: string) => readonly (readonly CodeToken[])[];

/** Inline equations typed as `$$…$$`: mentions under `indicator`. */
export interface InlineEquations {
  /**
   * The mention indicator the equation is stored under. Each platform's
   * input styles only the indicators it listens for, so pass one of
   * `mentions.indicators`.
   */
  indicator: string;
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
  /** Follow a link (the editor's own default opens it with `Linking`). */
  onOpenLink: (href: string) => void;
  /** Follow a mention (open the page, show the person); without it mentions offer no "Open". */
  onOpenMention?: (mention: MentionMark, text: string) => void;
  slashItems: readonly SlashItem[];
  onSlashAction?: (id: string, blockId: BlockId) => void;
  /** Copy a link to a block; without it the block menu offers no such action. */
  onCopyBlockLink?: (blockId: BlockId) => void;
  /** Images pasted into a block's text, for the app to upload and insert. */
  onPasteImages?: (images: PastedImage[], blockId: BlockId) => void;
  /** The languages a code block offers; without them it shows no language button. */
  codeLanguages?: readonly CodeLanguage[];
  /** Highlights a code block while it is not being edited. */
  highlightCode?: CodeHighlighter;
  inlineEquations?: InlineEquations;
  /** A paste into a block's text, for the app to take before the editor does (web). */
  onPasteText?: (input: PasteTextInput) => boolean;
  /**
   * Remove whole blocks, once the app's `confirmRemove` agrees: the selection
   * of blocks is cleared and one undoable edit removes those still there.
   */
  requestRemove: (ids: readonly BlockId[]) => void;
  /** The DOM id prefix of this surface's block rows (web). */
  domIdPrefix: string;
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
