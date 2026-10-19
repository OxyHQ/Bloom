import type { PastedImage } from '@oxy.so/bloom-text';
import { type ComponentRef, type ReactNode, useEffect, useMemo, useRef } from 'react';
import type { MentionMark } from '@oxy.so/bloom-text/model';
import {
  Linking,
  Platform,
  Pressable,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import {
  duplicateBlocks,
  indentBlocks,
  insertBlockAfter,
  outdentBlocks,
  removeBlocks,
} from '../model/commands';
import { exportSnapshot, snapshotToMarkdown } from '../model/snapshot';
import { getBlock } from '../model/document';
import type { BlockId } from '../model/document';
import { specOf } from '../model/schema';
import type { SlashItem } from '../model/slash';
import type { EditorStore } from '../model/store';
import { BLOCK_DOM_PREFIX, GUTTER_DOM_PREFIX } from './block-dom';
import { BlockMenu } from './BlockMenu';
import {
  clearBlockSelection,
  extendBlockSelection,
  selectBlocks,
  stepBlockSelection,
} from './block-selection';
import { CodeLanguageMenu } from './CodeLanguageMenu';
import { type EditorController, useEditorController } from './controller';
import { BlockList } from './BlockRow';
import { blockRange } from '../model/selection';
import {
  type BlockAction,
  type BlockRenderer,
  type CodeHighlighter,
  type CodeLanguage,
  EditorContext,
  type InlineEquations,
  type MentionSource,
  type EditorContextValue,
  useEditorContext,
  useEditorSnapshot,
} from './context';
import type { BlockDecorations } from './decorations';
import { DEFAULT_LABELS, type EditorLabels } from './labels';
import { DEFAULT_THEME, type EditorTheme } from './theme';

export interface BlockEditorProps {
  store: EditorStore;
  /** Items of the `/` menu (and of "Turn into"), localized by the app. */
  slashItems: readonly SlashItem[];
  /** Runs a slash item whose action is `custom` (upload an image, add a database). */
  onSlashAction?: (id: string, blockId: BlockId) => void;
  /** Renderers for block types the editor does not draw (media, embeds, app blocks). */
  renderers?: Readonly<Record<string, BlockRenderer>>;
  /**
   * Markers drawn beside a text block in place of the editor's own, by type
   * (a callout's icon from the app's icon set).
   */
  markers?: Readonly<Record<string, BlockRenderer>>;
  /** The application's own entries in each block's menu, listed first. */
  blockActions?: readonly BlockAction[];
  /** Per-block marks the application changes often (collaborators' carets). */
  decorations?: BlockDecorations;
  /** Mentions: the indicators that open the menu, and where to look matches up. */
  mentions?: MentionSource;
  /** Follow a link from its popover; opens it with `Linking` by default. */
  onOpenLink?: (href: string) => void;
  /** Follow a mention from its popover (open the page, show the person). */
  onOpenMention?: (mention: MentionMark, text: string) => void;
  /**
   * Copy a link to a block (the app knows its URL): the block menu offers
   * "Copy link to block" when given.
   */
  onCopyBlockLink?: (blockId: BlockId) => void;
  /**
   * Images pasted into a block's text (a screenshot, a copied picture), for
   * the app to upload and insert after `blockId`: `blob:` URLs on web, file
   * URIs on native. Without it, pasted images are ignored.
   */
  onPasteImages?: (images: PastedImage[], blockId: BlockId) => void;
  /** The languages a code block offers in its language menu (stored as `props.language`). */
  codeLanguages?: readonly CodeLanguage[];
  /** Highlights code blocks while they are not being edited. */
  highlightCode?: CodeHighlighter;
  /**
   * Typing `$$…$$` makes an inline equation: a mention whose attributes are
   * `{ kind: 'equation', latex }`, shown and followed like any mention
   * (`onOpenMention`).
   */
  inlineEquations?: InlineEquations;
  theme?: EditorTheme;
  labels?: Partial<EditorLabels>;
  readOnly?: boolean;
  /**
   * Shared with controls drawn outside the editor (`EditorToolbar`); the
   * editor makes its own when none is given.
   */
  controller?: EditorController;
  style?: StyleProp<ViewStyle>;
}

export interface EditorSurfaceProps extends BlockEditorProps {
  /**
   * The blocks, laid out by the app: `BlockList`s of whichever ids it places
   * where it likes (a note on a canvas, a column), all over the one store.
   */
  children: ReactNode;
}

const NONE: Readonly<Record<string, BlockRenderer>> = {};
const openWithLinking = (href: string) => {
  void Linking.openURL(href);
};
const NO_ACTIONS: readonly BlockAction[] = [];

/**
 * A Notion-style block editor over an `EditorStore`, the document laid out
 * top to bottom. Every edit goes through the store's commands; the app
 * persists by listening to its transactions.
 */
export function BlockEditor(props: BlockEditorProps) {
  return (
    <EditorSurface {...props}>
      <DocumentBody />
    </EditorSurface>
  );
}

/** The document's blocks in order, and the space below them that adds one. */
function DocumentBody() {
  const { store, readOnly, labels } = useEditorContext();
  const snapshot = useEditorSnapshot(store);

  // Clicking below the last block focuses it when it is an empty paragraph,
  // otherwise adds one — as in Notion.
  const focusEnd = () => {
    if (readOnly) return;
    const last = snapshot.doc.root[snapshot.doc.root.length - 1];
    if (last) {
      const block = getBlock(snapshot.doc, last);
      const isEmptyParagraph =
        block.type === 'paragraph' &&
        block.children.length === 0 &&
        (block.text ?? []).every((s) => !s.text);
      if (isEmptyParagraph && specOf(store.schema, block.type).hasText) {
        store.setSelection({ kind: 'text', blockId: last, start: 0, end: 0 });
        return;
      }
    }
    store.sealHistory();
    store.run((c) => insertBlockAfter(c, last ?? null, 'paragraph'));
  };

  return (
    <>
      <BlockList ids={snapshot.doc.root} depth={0} />
      {!readOnly ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={labels.addBelow}
          onPress={focusEnd}
          style={styles.tail}
        />
      ) : null}
    </>
  );
}

/**
 * The editor without a layout: its context (store, menus, theme), the
 * keyboard and clipboard handling of whole-block selections, and the block
 * menu; the app lays the blocks out with `BlockList`s inside it.
 */
export function EditorSurface({
  store,
  slashItems,
  onSlashAction,
  renderers = NONE,
  markers = NONE,
  blockActions = NO_ACTIONS,
  decorations,
  mentions,
  onOpenLink = openWithLinking,
  onOpenMention,
  onCopyBlockLink,
  onPasteImages,
  codeLanguages,
  highlightCode,
  inlineEquations,
  theme = DEFAULT_THEME,
  labels,
  readOnly = false,
  controller: given,
  style,
  children,
}: EditorSurfaceProps) {
  const own = useEditorController(store);
  const controller = given ?? own;
  const { ui, inputs } = controller;
  const mergedLabels = useMemo(() => ({ ...DEFAULT_LABELS, ...labels }), [labels]);

  const value: EditorContextValue = useMemo(
    () => ({
      store,
      controller,
      ui,
      theme,
      labels: mergedLabels,
      renderers,
      markers,
      blockActions,
      decorations,
      mentions,
      onOpenLink,
      onOpenMention,
      slashItems,
      onSlashAction,
      onCopyBlockLink,
      onPasteImages,
      codeLanguages,
      highlightCode,
      inlineEquations,
      readOnly,
      inputs,
    }),
    [
      store,
      controller,
      ui,
      theme,
      mergedLabels,
      renderers,
      markers,
      blockActions,
      decorations,
      mentions,
      onOpenLink,
      onOpenMention,
      slashItems,
      onSlashAction,
      onCopyBlockLink,
      onPasteImages,
      codeLanguages,
      highlightCode,
      inlineEquations,
      readOnly,
      inputs,
    ],
  );

  // Whole-block selection on web: arrows move it (Shift extends it),
  // Backspace deletes, ⌘D duplicates, Tab and Shift-Tab nest, Return edits.
  useEffect(() => {
    if (Platform.OS !== 'web' || readOnly) return;
    const onKey = (event: KeyboardEvent) => {
      const { selectedBlocks: selected, blockMenu, codeLanguageMenu } = ui.get();
      // An open menu has the keyboard.
      if (selected.length === 0 || blockMenu !== null || codeLanguageMenu !== null) return;
      // A field of the editor's own (a menu's search, the link field) types.
      const target = event.target as HTMLElement | null;
      if (target?.closest?.('input, textarea, [contenteditable="true"]')) return;
      const mod = event.metaKey || event.ctrlKey;
      if (event.key === 'Backspace' || event.key === 'Delete') {
        event.preventDefault();
        clearBlockSelection(ui);
        store.sealHistory();
        store.run((c) => removeBlocks(c, selected));
      } else if (mod && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        store.sealHistory();
        store.run((c) => duplicateBlocks(c, selected));
      } else if (event.key === 'Tab') {
        event.preventDefault();
        store.sealHistory();
        store.run((c) => (event.shiftKey ? outdentBlocks(c, selected) : indentBlocks(c, selected)));
      } else if ((event.key === 'ArrowUp' || event.key === 'ArrowDown') && !mod) {
        event.preventDefault();
        stepBlockSelection(store, ui, event.key === 'ArrowUp' ? 'up' : 'down', event.shiftKey);
      } else if (event.key === 'Escape') {
        clearBlockSelection(ui);
      } else if (event.key === 'Enter') {
        event.preventDefault();
        const first = selected[0];
        clearBlockSelection(ui);
        if (first && store.doc.blocks[first]?.text) {
          store.setSelection({ kind: 'text', blockId: first, start: 0, end: 0 });
        }
      } else if (mod && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) store.redo();
        else store.undo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [readOnly, store, ui]);

  // Selecting blocks with the pointer (web): Shift-click extends a selection
  // to the block clicked (from the selected blocks, or from the block being
  // edited); dragging out of one block's text into another selects the
  // blocks between them, as Notion does.
  const root = useRef<ComponentRef<typeof View> | null>(null);
  useEffect(() => {
    const node = root.current as unknown as HTMLElement | null;
    if (Platform.OS !== 'web' || readOnly || !node?.addEventListener) return;
    const blockAt = (target: EventTarget | null): string | null => {
      const element = (target as HTMLElement | null)?.closest?.(`[id^="${BLOCK_DOM_PREFIX}"]`);
      const id = element?.id.slice(BLOCK_DOM_PREFIX.length);
      return id && store.doc.blocks[id] ? id : null;
    };
    const inGutter = (target: EventTarget | null) =>
      Boolean((target as HTMLElement | null)?.closest?.(`[id^="${GUTTER_DOM_PREFIX}"]`));
    let drag: { from: string; selecting: boolean } | null = null;
    let suppressMouseDown = false;

    const endDrag = () => {
      if (drag?.selecting) node.style.userSelect = '';
      drag = null;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', endDrag);
      window.removeEventListener('pointercancel', endDrag);
    };
    const onMove = (event: PointerEvent) => {
      if (!drag || event.buttons === 0) {
        endDrag();
        return;
      }
      if (ui.get().drag) return;
      const over = blockAt(document.elementFromPoint(event.clientX, event.clientY));
      if (!over) return;
      if (!drag.selecting) {
        if (over === drag.from) return;
        // Out of the block the drag began in: whole blocks from here on.
        drag.selecting = true;
        node.style.userSelect = 'none';
        const focused = ui.get().focused;
        if (focused) controller.inputs.get(focused)?.blur();
      }
      window.getSelection?.()?.removeAllRanges();
      selectBlocks(ui, blockRange(store.doc, store.schema, drag.from, over), drag.from, over);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || inGutter(event.target)) return;
      const id = blockAt(event.target);
      if (!id) {
        clearBlockSelection(ui);
        return;
      }
      const state = ui.get();
      const fromElsewhere =
        state.selectedBlocks.length > 0 || (state.focused !== null && state.focused !== id);
      if (event.shiftKey && fromElsewhere) {
        // Not a click into the text: its mousedown (which would focus it and
        // place a caret) is cancelled below.
        suppressMouseDown = true;
        if (extendBlockSelection(store, ui, id) && state.focused) {
          controller.inputs.get(state.focused)?.blur();
        }
        return;
      }
      clearBlockSelection(ui);
      if (!(event.target as HTMLElement).closest?.('[contenteditable="true"]')) return;
      drag = { from: id, selecting: false };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', endDrag);
      window.addEventListener('pointercancel', endDrag);
    };
    const onMouseDown = (event: MouseEvent) => {
      if (!suppressMouseDown) return;
      suppressMouseDown = false;
      // Neither the browser nor the editing surface below acts on it.
      event.preventDefault();
      event.stopPropagation();
    };
    node.addEventListener('pointerdown', onPointerDown, true);
    node.addEventListener('mousedown', onMouseDown, true);
    return () => {
      endDrag();
      node.removeEventListener('pointerdown', onPointerDown, true);
      node.removeEventListener('mousedown', onMouseDown, true);
    };
  }, [controller, readOnly, store, ui]);

  // Copying and cutting selected blocks (web): as Markdown, which pasting
  // turns back into blocks — in this editor or any other.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onCopy = (cut: boolean) => (event: ClipboardEvent) => {
      const selected = ui.get().selectedBlocks;
      if (selected.length === 0 || !event.clipboardData) return;
      const ids = selected.filter((id) => !selected.includes(store.doc.blocks[id]?.parent ?? ''));
      event.clipboardData.setData('text/plain', snapshotToMarkdown(exportSnapshot(store.doc, ids)));
      event.preventDefault();
      if (cut && !readOnly) {
        clearBlockSelection(ui);
        store.sealHistory();
        store.run((c) => removeBlocks(c, ids));
      }
    };
    const copy = onCopy(false);
    const cut = onCopy(true);
    document.addEventListener('copy', copy);
    document.addEventListener('cut', cut);
    return () => {
      document.removeEventListener('copy', copy);
      document.removeEventListener('cut', cut);
    };
  }, [readOnly, store, ui]);

  return (
    <EditorContext.Provider value={value}>
      <View ref={root} style={[styles.editor, style]}>
        {children}
        <BlockMenu />
        <CodeLanguageMenu />
      </View>
    </EditorContext.Provider>
  );
}

const styles = StyleSheet.create({
  editor: { position: 'relative' },
  tail: { minHeight: 96 },
});
