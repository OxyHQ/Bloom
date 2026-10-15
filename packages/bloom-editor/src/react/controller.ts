import type { RichTextInputHandle } from '@oxy.so/bloom-text';
import { isSafeLink, segmentsToPlainText, type ToggleableMark } from '@oxy.so/bloom-text/model';
import { useMemo } from 'react';
import { applyEdit } from '../model/commands';
import { type BlockId, getBlock } from '../model/document';
import type { EditorStore } from '../model/store';
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
    const range =
      selection.start === selection.end
        ? linkRangeAt(getBlock(this.store.doc, selection.blockId).text ?? [], selection.start)
        : selection;
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

/** The run of one link around `offset` (the caret just inside or at its end). */
function linkRangeAt(
  segments: readonly { text: string; link?: string }[],
  offset: number,
): { start: number; end: number } | null {
  let at = 0;
  const runs: { start: number; end: number; link?: string }[] = [];
  for (const segment of segments) {
    const last = runs[runs.length - 1];
    if (last && segment.link && last.link === segment.link) last.end += segment.text.length;
    else runs.push({ start: at, end: at + segment.text.length, link: segment.link });
    at += segment.text.length;
  }
  const run = runs.find((r) => r.link && offset > r.start && offset <= r.end);
  return run ? { start: run.start, end: run.end } : null;
}
