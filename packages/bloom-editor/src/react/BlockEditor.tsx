import { useEffect, useMemo } from 'react';
import {
  Platform,
  Pressable,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { duplicateBlocks, insertBlockAfter, removeBlocks } from '../model/commands';
import { getBlock } from '../model/document';
import type { BlockId } from '../model/document';
import { specOf } from '../model/schema';
import type { SlashItem } from '../model/slash';
import type { EditorStore } from '../model/store';
import { BlockMenu } from './BlockMenu';
import { type EditorController, useEditorController } from './controller';
import { BlockList } from './BlockRow';
import {
  type BlockAction,
  type BlockRenderer,
  EditorContext,
  type MentionSource,
  type EditorContextValue,
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

const NONE: Readonly<Record<string, BlockRenderer>> = {};
const NO_ACTIONS: readonly BlockAction[] = [];

/**
 * A Notion-style block editor over an `EditorStore`. Every edit goes through
 * the store's commands; the app persists by listening to its transactions.
 */
export function BlockEditor({
  store,
  slashItems,
  onSlashAction,
  renderers = NONE,
  markers = NONE,
  blockActions = NO_ACTIONS,
  decorations,
  mentions,
  theme = DEFAULT_THEME,
  labels,
  readOnly = false,
  controller: given,
  style,
}: BlockEditorProps) {
  const own = useEditorController(store);
  const controller = given ?? own;
  const { ui, inputs } = controller;
  const snapshot = useEditorSnapshot(store);
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
      slashItems,
      onSlashAction,
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
      slashItems,
      onSlashAction,
      readOnly,
      inputs,
    ],
  );

  // Whole-block selection (Escape, then arrows / Backspace / ⌘D) on web.
  useEffect(() => {
    if (Platform.OS !== 'web' || readOnly) return;
    const onKey = (event: KeyboardEvent) => {
      const selected = ui.get().selectedBlocks;
      if (selected.length === 0) return;
      const mod = event.metaKey || event.ctrlKey;
      if (event.key === 'Backspace' || event.key === 'Delete') {
        event.preventDefault();
        ui.set({ selectedBlocks: [] });
        store.sealHistory();
        store.run((c) => removeBlocks(c, selected));
      } else if (mod && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        store.sealHistory();
        store.run((c) => duplicateBlocks(c, selected));
      } else if (event.key === 'Escape') {
        ui.set({ selectedBlocks: [] });
      } else if (event.key === 'Enter') {
        event.preventDefault();
        const first = selected[0];
        ui.set({ selectedBlocks: [] });
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
    <EditorContext.Provider value={value}>
      <View style={[styles.editor, style]}>
        <BlockList ids={snapshot.doc.root} depth={0} />
        {!readOnly ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={mergedLabels.addBelow}
            onPress={focusEnd}
            style={styles.tail}
          />
        ) : null}
        <BlockMenu />
      </View>
    </EditorContext.Provider>
  );
}

const styles = StyleSheet.create({
  editor: { position: 'relative' },
  tail: { minHeight: 96 },
});
