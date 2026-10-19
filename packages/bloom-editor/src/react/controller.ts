import type { RichTextInputHandle } from '@oxy.so/bloom-text';
import {
  isSafeLink,
  segmentsToPlainText,
  splitSegmentsAt,
  type ToggleableMark,
} from '@oxy.so/bloom-text/model';
import { useMemo } from 'react';
import { applyEdit, formatText, insertMention, type MentionInsert } from '../model/commands';
import { type BlockId, getBlock } from '../model/document';
import type { EditorStore } from '../model/store';
import { inlineTargetAt } from './inline-target';
import { UiStore } from './ui-store';

/**
 * What an editor and the controls around it share: its transient UI state,
 * its live inputs and the formatting commands on the current selection. An app
 * that draws controls outside `BlockEditor` (a toolbar above the keyboard)
 * creates one with `useEditorController` and passes it to both.
 */
export class EditorController {
  readonly ui = new UiStore();
  readonly inputs = new Map<BlockId, RichTextInputHandle>();

  constructor(readonly store: EditorStore) {}

  /** The caret or range in a block's text, the one formatting acts on. */
  get textSelection() {
    const selection = this.store.selection;
    return selection?.kind === 'text' && this.store.doc.blocks[selection.blockId]
      ? selection
      : null;
  }

  toggleMark(mark: ToggleableMark): void {
    const selection = this.textSelection;
    if (selection) this.inputs.get(selection.blockId)?.toggleMark(mark);
  }

  /** Link the selected text to `url`; false when nothing is selected or the URL is unsafe. */
  setLink(url: string): boolean {
    const selection = this.textSelection;
    const href = normalizeLink(url);
    if (!selection || selection.start === selection.end || !href) return false;
    const block = getBlock(this.store.doc, selection.blockId);
    const text = segmentsToPlainText(block.text ?? []).slice(selection.start, selection.end);
    this.inputs.get(selection.blockId)?.setLink(selection.start, selection.end, text, href);
    return true;
  }

  /** Remove the link under the selection, or the whole link the caret is in. */
  removeLink(): void {
    const selection = this.textSelection;
    if (!selection) return;
    let range: { start: number; end: number } | null = selection;
    if (selection.start === selection.end) {
      const target = inlineTargetAt(
        getBlock(this.store.doc, selection.blockId).text ?? [],
        selection.start,
      );
      range = target?.kind === 'link' ? target : null;
    }
    if (range) this.inputs.get(selection.blockId)?.removeLink(range.start, range.end);
  }

  /**
   * Start a mention at the caret, as typing the indicator would: a mention
   * opens at the start or after a space, so one is added after a word. An
   * edit like any other — each platform's input picks the mention up from the
   * text (their own `startMention` differs: only iOS adds the space).
   */
  startMention(indicator: string): void {
    const selection = this.textSelection;
    if (!selection) return;
    const text = segmentsToPlainText(getBlock(this.store.doc, selection.blockId).text ?? []);
    const before = text[selection.start - 1];
    const space = before !== undefined && !/\s/.test(before) ? ' ' : '';
    this.store.sealHistory();
    this.store.run((c) =>
      applyEdit(c, selection.blockId, {
        index: selection.start,
        deleteCount: selection.end - selection.start,
        insert: `${space}${indicator}`,
      }),
    );
  }

  /**
   * Colour the selected text (`'default'` clears it): the text colour, or the
   * highlight behind it with `background`. False when no text is selected.
   */
  setTextColor(name: string, kind: 'color' | 'background' = 'color'): boolean {
    const selection = this.textSelection;
    if (!selection || selection.start === selection.end) return false;
    this.store.sealHistory();
    return this.store.run((c) =>
      formatText(c, selection.blockId, selection.start, selection.end, {
        [kind]: name === 'default' ? null : name,
      }),
    );
  }

  /** The text colour and highlight where the selected text starts. */
  textColors(): { color?: string; background?: string } {
    const selection = this.textSelection;
    if (!selection || selection.start === selection.end) return {};
    const text = getBlock(this.store.doc, selection.blockId).text ?? [];
    const [, rest] = splitSegmentsAt(text, selection.start);
    const first = rest[0];
    return {
      ...(first?.color && { color: first.color }),
      ...(first?.background && { background: first.background }),
    };
  }

  /** The link the selection is in or starts in, for the link field to show. */
  linkAtSelection(): string | null {
    const selection = this.textSelection;
    if (!selection) return null;
    const text = getBlock(this.store.doc, selection.blockId).text ?? [];
    const target = inlineTargetAt(
      text,
      selection.start + (selection.start === selection.end ? 0 : 1),
    );
    return target?.kind === 'link' ? target.href : null;
  }

  /**
   * Open the link field (⌘K): for the selected text, or — at a caret inside a
   * link — for that whole link. False when there is nothing to link.
   */
  openLinkEditor(): boolean {
    const selection = this.textSelection;
    if (!selection) return false;
    if (selection.start === selection.end) {
      const target = inlineTargetAt(
        getBlock(this.store.doc, selection.blockId).text ?? [],
        selection.start,
      );
      if (target?.kind !== 'link') return false;
      this.store.setSelection({ ...selection, start: target.start, end: target.end });
      this.inputs.get(selection.blockId)?.setSelection(target.start, target.end);
    }
    this.ui.set({ linking: selection.blockId });
    return true;
  }

  /**
   * Put a mention at the selection (an inline equation an app's slash item
   * inserts, a page picked elsewhere), replacing selected text.
   */
  insertMention(mention: MentionInsert): boolean {
    const selection = this.textSelection;
    if (!selection) return false;
    this.store.sealHistory();
    return this.store.run((c) =>
      insertMention(c, selection.blockId, selection.start, selection.end, mention),
    );
  }

  /** Give the keyboard back to the selected block, with its selection. */
  refocus(): void {
    const selection = this.textSelection;
    const input = selection && this.inputs.get(selection.blockId);
    if (!selection || !input) return;
    input.focus();
    input.setSelection(selection.start, selection.end);
  }
}

export function useEditorController(store: EditorStore): EditorController {
  return useMemo(() => new EditorController(store), [store]);
}

/** A URL as typed (`example.com`) made a link, or null when it is not one we allow. */
export function normalizeLink(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed || /\s/.test(trimmed)) return null;
  if (isSafeLink(trimmed)) return trimmed;
  // A bare host and path: the web.
  if (/^[\w-]+(\.[\w-]+)+([/?#:]|$)/.test(trimmed)) {
    const withScheme = `https://${trimmed}`;
    return isSafeLink(withScheme) ? withScheme : null;
  }
  return null;
}
