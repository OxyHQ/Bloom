import type { ActiveMarks } from '@oxy.so/bloom-text/model';
import {
  type KeyCommand,
  type PasteData,
  type RichTextChange,
  RichTextInput,
  type RichTextInputHandle,
  type RichTextStyle,
  segmentsToPlainText,
  type TextSelection,
} from '@oxy.so/bloom-text';
import {
  type ComponentRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { Platform, Pressable, StyleSheet, Text, type TextStyle, View } from 'react-native';
import {
  applyEdit,
  backspaceAtStart,
  type CommandContext,
  composeCommands,
  deleteAtEnd,
  duplicateBlocks,
  editText,
  indent,
  insertBlockAfter,
  moveBlocks,
  nextTextBlock,
  outdent,
  previousTextBlock,
  setProps,
  splitBlock,
  turnInto,
} from '../model/commands';
import { type Block, childrenOf, getBlock, positionOf } from '../model/document';
import { htmlToSnapshot, isPlainSnapshot } from '../model/html';
import {
  applyBlockShortcut,
  applyInlineEquation,
  applyInlineShortcut,
  detectBlockShortcut,
} from '../model/markdown';
import { pasteIntoBlock, pasteSnapshot } from '../model/paste';
import type { EditorSelection, Transaction } from '../model/operations';
import { isStructural, specOf } from '../model/schema';
import { filterSlashItems, type SlashItem, slashQuery, slashTriggerAt } from '../model/slash';
import { clearBlockSelection, selectBlocks } from './block-selection';
import { type MentionItem, useEditorContext } from './context';
import { useBlockDecoration } from './decorations';
import { FormatBar } from './FormatBar';
import { InlinePopover } from './InlinePopover';
import { inlineTargetAt } from './inline-target';
import { MentionMenu } from './MentionMenu';
import { MeasuredCarets, MeasuredHighlights, useMeasuredMarks } from './RangeMarks';
import { MONO_FONT, RunsText } from './RunsText';
import { SlashMenu } from './SlashMenu';
import { useUi } from './ui-store';
import { codeRuns, hasValueOnlyMarks, segmentRuns } from './text-runs';
import { textStyleFor } from './typography';

const caret = (blockId: string, offset: number): EditorSelection => ({
  kind: 'text',
  blockId,
  start: offset,
  end: offset,
});

export function TextBlock({ block }: { block: Block }) {
  const {
    store,
    controller,
    ui,
    theme,
    labels,
    inputs,
    readOnly,
    slashItems,
    onSlashAction,
    mentions,
    onPasteImages,
    codeLanguages,
    highlightCode,
    inlineEquations,
    decorations,
    onPasteText,
  } = useEditorContext();
  const id = block.id;
  const hostRef = useRef<ComponentRef<typeof View> | null>(null);
  const spec = specOf(store.schema, block.type);
  const inputRef = useRef<RichTextInputHandle | null>(null);
  const selectionRef = useRef<TextSelection>({ start: 0, end: 0 });
  const focusedRef = useRef(false);
  const shiftEnterRef = useRef(false);
  const [focused, setFocused] = useState(false);

  // Register this block's input for focus moves and formatting commands.
  useEffect(() => {
    const handle = inputRef.current;
    if (handle) inputs.set(id, handle);
    return () => {
      inputs.delete(id);
    };
  }, [id, inputs]);

  // Follow the store's selection when it points into this block and the
  // input is not already there (a command moved the caret here).
  const target = useSyncExternalStore(store.subscribe, () => {
    const sel = store.selection;
    return sel?.kind === 'text' && sel.blockId === id ? sel : null;
  });
  /** Focus as the input itself sees it; its focus event can be missed after a remount. */
  const hasFocus = useCallback(
    () => focusedRef.current || inputRef.current?.isFocused() === true,
    [],
  );

  // The selection a command asked for, applied once — never re-applied
  // later, so it cannot overwrite a caret the user has moved since.
  useLayoutEffect(() => {
    if (!target || readOnly) return;
    const local = selectionRef.current;
    if (hasFocus() && local.start === target.start && local.end === target.end) return;
    const wanted = { start: target.start, end: target.end };
    selectionRef.current = wanted;
    let frame = 0;
    let cancelled = false;
    // A block created by this same edit may not have its editing surface
    // mounted yet: ask for focus on the next frames until it lands, then
    // place the caret.
    const attempt = (tries: number) => {
      // The user moved the caret since: their selection wins.
      if (cancelled || selectionRef.current !== wanted) return;
      if (!hasFocus()) inputRef.current?.focus();
      if (hasFocus()) {
        focusedRef.current = true;
        inputRef.current?.setSelection(wanted.start, wanted.end);
        return;
      }
      if (tries < 10) frame = requestAnimationFrame(() => attempt(tries + 1));
    };
    attempt(0);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [target, readOnly, hasFocus]);

  const run = useCallback(
    (command: (ctx: CommandContext) => Transaction | null) => store.run(command),
    [store],
  );

  const runSlashItem = useCallback(
    (item: SlashItem) => {
      const slash = ui.get().slash;
      ui.set({ slash: null });
      if (!slash) return;
      const current = getBlock(store.doc, id);
      const text = segmentsToPlainText(current.text ?? []);
      const end = Math.min(text.length, slash.slashAt + 1 + slash.query.length);
      const removeQuery = (c: CommandContext) =>
        applyEdit(c, id, { index: slash.slashAt, deleteCount: end - slash.slashAt, insert: '' });
      const emptyAfter = text.length - (end - slash.slashAt) === 0;
      if (item.action.kind === 'block') {
        const { type, props } = item.action;
        store.sealHistory();
        run((c) =>
          composeCommands(c, [
            removeQuery,
            emptyAfter
              ? (cc) => turnInto(cc, id, type)
              : (cc) => insertBlockAfter(cc, id, type, props ? { props } : {}),
            (cc) => (emptyAfter && props ? setProps(cc, id, props) : null),
          ]),
        );
      } else {
        run(removeQuery);
        onSlashAction?.(item.action.id, id);
      }
    },
    [id, onSlashAction, run, store, ui],
  );

  const onChange = useCallback(
    ({ segments, edit }: RichTextChange) => {
      const ctx = store.context();
      const current = getBlock(ctx.doc, id);
      const text = segmentsToPlainText(segments);

      if (edit && edit.deleteCount === 0) {
        const at = slashTriggerAt(text, edit.index, edit.insert);
        if (at !== null) ui.set({ slash: { blockId: id, slashAt: at, query: '', highlighted: 0 } });
      }

      // Line breaks pasted into a one-line block: a block per line (Notion).
      if (edit?.insert.includes('\n')) {
        const pasted = pasteIntoBlock(ctx, id, segments, edit);
        if (pasted) {
          store.sealHistory();
          store.dispatch(pasted);
          store.sealHistory();
          return;
        }
      }

      const shortcut = detectBlockShortcut(current.type, text, edit);
      if (shortcut) {
        store.sealHistory();
        store.dispatch(
          composeCommands(ctx, [
            (c) => editText(c, id, segments),
            (c) => applyBlockShortcut(c, id, shortcut),
          ]),
        );
        return;
      }
      const inline =
        applyInlineShortcut(segments, edit) ??
        (inlineEquations && !spec.multiline
          ? applyInlineEquation(segments, edit, inlineEquations.indicator)
          : null);
      if (inline) {
        store.dispatch(
          composeCommands(ctx, [
            (c) => editText(c, id, segments),
            (c) => editText(c, id, inline.segments, caret(id, inline.caret)),
          ]),
        );
        return;
      }
      store.dispatch(editText(ctx, id, segments));
    },
    [id, inlineEquations, spec.multiline, store, ui],
  );

  // Web: HTML pasted from a page or another editor becomes blocks. A paste
  // that says no more than its plain text is left to the input, whose lines
  // (and their Markdown prefixes) make blocks in `onChange`; code takes
  // plain text.
  const onPaste = useCallback(
    ({ html, text }: PasteData): boolean => {
      if (readOnly) return false;
      // The app's first: a link it unfurls, a page it recognises.
      if (onPasteText?.({ text, ...(html ? { html } : {}), blockId: id })) return true;
      if (!html) return false;
      const current = store.doc.blocks[id];
      if (!current || specOf(store.schema, current.type).multiline) return false;
      const snapshot = htmlToSnapshot(html, { schema: store.schema });
      if (snapshot.length === 0 || isPlainSnapshot(snapshot)) return false;
      const { start, end } = selectionRef.current;
      store.sealHistory();
      const pasted = store.run((c) => pasteSnapshot(c, id, start, end, snapshot));
      store.sealHistory();
      return pasted;
    },
    [id, onPasteText, readOnly, store],
  );

  const onSelectionChange = useCallback(
    (selection: TextSelection) => {
      selectionRef.current = selection;
      // Inputs report selection changes without focus too (loading content,
      // applying a remote edit); only the focused one speaks for the caret.
      if (!hasFocus()) return;
      store.setSelection({ kind: 'text', blockId: id, start: selection.start, end: selection.end });
      const slash = ui.get().slash;
      if (slash && slash.blockId === id) {
        const text = segmentsToPlainText(getBlock(store.doc, id).text ?? []);
        const query = slashQuery(text, slash.slashAt, selection.start);
        if (query === null) ui.set({ slash: null });
        else if (query !== slash.query) ui.set({ slash: { ...slash, query, highlighted: 0 } });
      }
    },
    [hasFocus, id, store, ui],
  );

  const focusBlock = useCallback(
    (targetId: string | null, atEnd: boolean) => {
      if (!targetId) return false;
      const target = getBlock(store.doc, targetId);
      const offset = atEnd ? segmentsToPlainText(target.text ?? []).length : 0;
      store.sealHistory();
      store.setSelection(caret(targetId, offset));
      return true;
    },
    [store],
  );

  // Each lookup gets a number; only the latest one's answer is shown.
  const mentionSearch = useRef(0);
  const onMentionQuery = useCallback(
    (query: { indicator: string; text: string } | null) => {
      if (!query || !mentions) {
        if (ui.get().mention?.blockId === id) ui.set({ mention: null });
        return;
      }
      const current = ui.get().mention;
      const seq = ++mentionSearch.current;
      ui.set({
        mention: {
          blockId: id,
          indicator: query.indicator,
          text: query.text,
          highlighted: 0,
          items: current?.blockId === id ? current.items : [],
          loading: true,
        },
      });
      mentions.search(query).then(
        (items) => {
          const open = ui.get().mention;
          if (seq !== mentionSearch.current || open?.blockId !== id) return;
          ui.set({ mention: { ...open, items, loading: false, highlighted: 0 } });
        },
        () => {
          const open = ui.get().mention;
          if (seq !== mentionSearch.current || open?.blockId !== id) return;
          ui.set({ mention: { ...open, items: [], loading: false } });
        },
      );
    },
    [id, mentions, ui],
  );

  const chooseMention = useCallback(
    (item: MentionItem) => {
      const open = ui.get().mention;
      ui.set({ mention: null });
      if (!open) return;
      inputRef.current?.insertMention(open.indicator, item.label, { ...item.attributes });
    },
    [ui],
  );

  const onKeyCommand = useCallback(
    (key: KeyCommand): boolean => {
      const mention = ui.get().mention;
      if (mention && mention.blockId === id) {
        const count = Math.max(mention.items.length, 1);
        if (key.key === 'ArrowDown' || key.key === 'ArrowUp') {
          const step = key.key === 'ArrowDown' ? 1 : -1;
          ui.set({
            mention: { ...mention, highlighted: (mention.highlighted + step + count) % count },
          });
          return true;
        }
        if (key.key === 'Escape') {
          ui.set({ mention: null });
          return true;
        }
        if (key.key === 'Enter' || key.key === 'Tab') {
          const item = mention.items[mention.highlighted];
          if (item) chooseMention(item);
          else ui.set({ mention: null });
          return true;
        }
      }
      const slash = ui.get().slash;
      if (slash && slash.blockId === id) {
        const matches = filterSlashItems(slashItems, slash.query);
        if (key.key === 'ArrowDown' || key.key === 'ArrowUp') {
          const step = key.key === 'ArrowDown' ? 1 : -1;
          const count = Math.max(matches.length, 1);
          ui.set({ slash: { ...slash, highlighted: (slash.highlighted + step + count) % count } });
          return true;
        }
        if (key.key === 'Escape') {
          ui.set({ slash: null });
          return true;
        }
        if (key.key === 'Enter') {
          const item = matches[slash.highlighted];
          if (item) runSlashItem(item);
          else ui.set({ slash: null });
          return true;
        }
      }

      const sel = selectionRef.current;
      const collapsed = sel.start === sel.end;
      const length = segmentsToPlainText(getBlock(store.doc, id).text ?? []).length;
      const ctxSel = caret(id, sel.start);

      if (key.mod && (key.key === 'z' || key.key === 'Z')) {
        if (key.shift) store.redo();
        else store.undo();
        return true;
      }
      if (key.mod && key.key === 'y') {
        store.redo();
        return true;
      }
      if (key.mod && !key.shift && (key.key === 'k' || key.key === 'K')) {
        // The link field, for the selection or the link the caret is in.
        controller.openLinkEditor();
        return true;
      }
      if (key.key === 'Enter' && key.shift) {
        // Soft line break; `onSubmit` reads this flag.
        shiftEnterRef.current = true;
        return false;
      }
      if (key.key === 'Tab') {
        store.sealHistory();
        run((c) => (key.shift ? outdent(c, id, ctxSel) : indent(c, id, ctxSel)));
        return true;
      }
      if (key.key === 'Backspace' && collapsed && sel.start === 0 && !key.mod) {
        store.sealHistory();
        return run((c) => backspaceAtStart(c, id));
      }
      if (key.key === 'Delete' && collapsed && sel.start === length) {
        store.sealHistory();
        return run((c) => deleteAtEnd(c, id));
      }
      if (key.key === 'ArrowUp' && collapsed && sel.start === 0 && !key.mod) {
        return focusBlock(previousTextBlock(store.context(), id), true);
      }
      if (key.key === 'ArrowDown' && collapsed && sel.start === length && !key.mod) {
        return focusBlock(nextTextBlock(store.context(), id), false);
      }
      if (key.mod && key.shift && (key.key === 'ArrowUp' || key.key === 'ArrowDown')) {
        const { parent, index } = positionOf(store.doc, id);
        const siblings = childrenOf(store.doc, parent);
        const neighbour = siblings[key.key === 'ArrowUp' ? index - 1 : index + 1];
        if (!neighbour) return true;
        store.sealHistory();
        run((c) => {
          const tx = moveBlocks(c, [id], neighbour, key.key === 'ArrowUp' ? 'before' : 'after');
          return tx ? { ...tx, selectionAfter: ctxSel } : null;
        });
        return true;
      }
      if (key.mod && (key.key === 'd' || key.key === 'D')) {
        store.sealHistory();
        run((c) => duplicateBlocks(c, [id]));
        return true;
      }
      if (key.key === 'Escape') {
        inputRef.current?.blur();
        // A table cell selects its table: a cell on its own is not a block.
        let selected = id;
        while (isStructural(store.schema, getBlock(store.doc, selected).type)) {
          const parent = getBlock(store.doc, selected).parent;
          if (parent === null) break;
          selected = parent;
        }
        selectBlocks(ui, [selected]);
        return true;
      }
      return false;
    },
    [chooseMention, controller, focusBlock, id, run, runSlashItem, slashItems, store, ui],
  );

  const onSubmit = useCallback(() => {
    const mention = ui.get().mention;
    if (mention && mention.blockId === id) {
      const item = mention.items[mention.highlighted];
      if (item) chooseMention(item);
      else ui.set({ mention: null });
      return;
    }
    const slash = ui.get().slash;
    if (slash && slash.blockId === id) {
      const item = filterSlashItems(slashItems, slash.query)[slash.highlighted];
      if (item) runSlashItem(item);
      else ui.set({ slash: null });
      return;
    }
    const sel = selectionRef.current;
    store.sealHistory();
    if (shiftEnterRef.current) {
      shiftEnterRef.current = false;
      run((c) =>
        applyEdit(c, id, { index: sel.start, deleteCount: sel.end - sel.start, insert: '\n' }),
      );
      return;
    }
    run((c) =>
      composeCommands(c, [
        (cc) =>
          sel.end > sel.start
            ? applyEdit(cc, id, { index: sel.start, deleteCount: sel.end - sel.start, insert: '' })
            : null,
        (cc) => splitBlock(cc, id, sel.start),
      ]),
    );
  }, [chooseMention, id, run, runSlashItem, slashItems, store, ui]);

  // The input reports its marks whenever they change, focused or not (a link
  // set while the link field has the keyboard): the block the selection is in
  // speaks for the toolbar, and says again what it last had when focused.
  const marksRef = useRef<ActiveMarks | null>(null);
  const onActiveMarksChange = useCallback(
    (marks: ActiveMarks) => {
      marksRef.current = marks;
      if (controller.textSelection?.blockId === id) ui.set({ marks: { blockId: id, marks } });
    },
    [controller, id, ui],
  );

  // The link or mention at the caret, for its popover.
  const inlineKey = useSyncExternalStore(store.subscribe, () => {
    const sel = store.selection;
    if (sel?.kind !== 'text' || sel.blockId !== id || sel.start !== sel.end) return null;
    const found = inlineTargetAt(store.doc.blocks[id]?.text ?? [], sel.start);
    return found ? `${found.start}:${found.end}` : null;
  });
  const inlineTarget = useMemo(() => {
    if (!inlineKey) return null;
    const sel = store.selection;
    return sel?.kind === 'text' ? inlineTargetAt(block.text ?? [], sel.start) : null;
  }, [inlineKey, block.text, store]);
  const slashOpen = useUi(ui, (s) => s.slash?.blockId === id || s.mention?.blockId === id);

  // Web: the marks and link of a selection, over the block (touch devices
  // get `EditorToolbar` above the keyboard instead).
  const linking = useUi(ui, (s) => s.linking === id);
  const showBubble =
    Platform.OS === 'web' &&
    !readOnly &&
    (linking || (focused && target !== null && target.start !== target.end));

  const placeholder = useMemo(() => {
    if (block.type.startsWith('heading_')) return labels.emptyHeading;
    if (
      block.type === 'bulleted_list_item' ||
      block.type === 'numbered_list_item' ||
      block.type === 'todo'
    ) {
      return labels.emptyListItem;
    }
    if (block.type === 'toggle') return labels.emptyToggle;
    return focused ? labels.placeholder : undefined;
  }, [block.type, focused, labels]);

  const isEmpty = (block.text ?? []).every((segment) => segment.text.length === 0);

  const textStyle: RichTextStyle = useMemo(() => {
    const color =
      typeof block.props.color === 'string' ? theme.colors[block.props.color]?.text : undefined;
    const muted = block.type === 'todo' && block.props.checked === true;
    return {
      ...textStyleFor(block.type, theme),
      ...(color && { color }),
      ...(muted && { color: theme.textMuted }),
      linkColor: theme.accent,
      codeColor: theme.colors.red?.text ?? theme.text,
      codeBackgroundColor: theme.codeBackground,
      mentionColor: theme.accent,
    };
  }, [block.props.checked, block.props.color, block.type, theme]);

  // While the block is not being edited, what its input cannot draw is drawn
  // over it: colours and highlights in its text, or highlighted code. The
  // input stays in place, unseen, and takes the press that starts editing.
  // The app's highlights and carets in the text: drawn with the runs while
  // the block is not being edited, and measured on the input while it is.
  const ranges = useBlockDecoration(decorations, id)?.ranges;
  const hasRanges = ranges !== undefined && ranges.length > 0;
  const isCode = block.type === 'code';
  const language = typeof block.props.language === 'string' ? block.props.language : 'plain';
  const runs = useMemo(() => {
    if (focused) return null;
    const text = block.text ?? [];
    if (isCode && highlightCode) {
      const code = segmentsToPlainText(text);
      const highlighted = code ? codeRuns(code, highlightCode(code, language)) : null;
      if (highlighted || !hasRanges) return highlighted;
    }
    return hasValueOnlyMarks(text) || hasRanges
      ? segmentRuns(text, theme, textStyle, MONO_FONT)
      : null;
  }, [focused, block.text, isCode, highlightCode, language, theme, textStyle, hasRanges]);
  const plainText = useMemo(() => segmentsToPlainText(block.text ?? []), [block.text]);
  const measured = useMeasuredMarks(inputRef, hostRef, ranges, plainText, focused && hasRanges);
  const hovered = useUi(ui, (s) => s.hovered === block.id);
  const languageLabel = codeLanguages?.find((l) => l.id === language)?.label ?? language;
  const showLanguage =
    isCode &&
    codeLanguages !== undefined &&
    codeLanguages.length > 0 &&
    !readOnly &&
    // Touch has no hover, and a press that blurs the input must still land.
    (Platform.OS !== 'web' || hovered || focused);

  return (
    <View ref={hostRef}>
      {/* Under the input's text: the highlights measured on it. */}
      <MeasuredHighlights marks={measured} />
      <View style={runs ? styles.unseen : undefined}>
        <RichTextInput
          ref={inputRef}
          value={block.text ?? []}
          onChange={onChange}
          onSelectionChange={onSelectionChange}
          onKeyCommand={onKeyCommand}
          onActiveMarksChange={onActiveMarksChange}
          mentionIndicators={mentions ? [...mentions.indicators] : undefined}
          onMentionQuery={mentions ? onMentionQuery : undefined}
          onSubmit={spec.multiline ? undefined : onSubmit}
          onPaste={readOnly ? undefined : onPaste}
          onPasteImages={
            onPasteImages && !readOnly ? (images) => onPasteImages(images, id) : undefined
          }
          onFocus={() => {
            focusedRef.current = true;
            setFocused(true);
            clearBlockSelection(ui);
            ui.set({
              focused: id,
              ...(marksRef.current && { marks: { blockId: id, marks: marksRef.current } }),
            });
            // The input reports its caret before it reports focus; claim it now.
            const { start, end } = selectionRef.current;
            store.setSelection({ kind: 'text', blockId: id, start, end });
          }}
          onBlur={() => {
            focusedRef.current = false;
            setFocused(false);
            if (ui.get().focused === id) ui.set({ focused: null });
            store.sealHistory();
          }}
          editable={!readOnly}
          textStyle={textStyle}
          style={isCode ? styles.codeInput : undefined}
          accessibilityLabel={placeholder}
          testID={`block-input-${id}`}
        />
      </View>
      <MeasuredCarets marks={measured} textColor={theme.background} />
      {runs ? (
        <RunsText
          runs={runs}
          ranges={ranges}
          textStyle={textStyle}
          flagTextColor={theme.background}
          style={isCode ? styles.codeInput : undefined}
        />
      ) : null}
      {showLanguage ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${labels.codeLanguage}: ${languageLabel}`}
          onPress={() => ui.set({ codeLanguageMenu: id })}
          style={({ pressed }) => [
            styles.language,
            pressed && { backgroundColor: theme.selection },
          ]}
        >
          <Text style={[styles.languageText, { color: theme.textMuted }]}>{languageLabel}</Text>
        </Pressable>
      ) : null}
      {placeholder && isEmpty ? (
        // Drawn here rather than passed to the input: the input rebuilds its
        // editing surface whenever its placeholder changes, which would drop
        // the caret on every focus change and type change.
        <Text
          pointerEvents="none"
          accessible={false}
          style={[styles.placeholder, textStyleToText(textStyle), { color: theme.textMuted }]}
          numberOfLines={1}
        >
          {placeholder}
        </Text>
      ) : null}
      {showBubble ? (
        <View
          style={[styles.bubble, { backgroundColor: theme.background, borderColor: theme.border }]}
          accessibilityRole="toolbar"
          accessibilityLabel={labels.formatting}
        >
          <FormatBar controller={controller} theme={theme} labels={labels} />
        </View>
      ) : null}
      {inlineTarget && focused && !slashOpen && !readOnly ? (
        <InlinePopover target={inlineTarget} />
      ) : null}
      <SlashMenu blockId={id} onChoose={runSlashItem} />
      <MentionMenu blockId={id} onChoose={chooseMention} />
    </View>
  );
}

function textStyleToText(style: RichTextStyle): TextStyle {
  return {
    fontSize: style.fontSize,
    lineHeight: style.lineHeight,
    fontFamily: style.fontFamily,
    fontWeight: style.fontWeight,
  };
}

const styles = StyleSheet.create({
  placeholder: { position: 'absolute', left: 0, right: 0, top: 0 },
  unseen: { opacity: 0 },
  codeInput: { padding: 12 },
  language: {
    position: 'absolute',
    top: 4,
    right: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  languageText: { fontSize: 12 },
  bubble: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    zIndex: 60,
    marginBottom: 6,
    padding: 2,
    borderWidth: 1,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 8,
  },
});
