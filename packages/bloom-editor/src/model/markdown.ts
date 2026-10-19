/**
 * Markdown-style shortcuts typed into a block, Notion's set:
 *
 * - At the start of a paragraph, followed by a space: `#` `##` `###`
 *   headings, `-` `*` `+` bullets, `1.` numbers, `[]` to-do (`[x]` checked),
 *   `>` toggle, `"` quote. Three backticks give a code block and three dashes
 *   a divider, without the space.
 * - Inline, when the closing delimiter is typed: `**bold**`, `*italic*` or
 *   `_italic_`, `` `code` ``, `~~strike~~`.
 */
import {
  applyMarks,
  segmentsToPlainText,
  type Segment,
  splitSegmentsAt,
  type TextEdit,
  type ToggleableMark,
} from '@oxy.so/bloom-text/model';
import type { CommandContext } from './commands';
import { getBlock, positionOf } from './document';
import type { BlockId } from './document';
import type { Transaction } from './operations';
import { applyOperation } from './operations';
import { specOf } from './schema';

interface BlockShortcut {
  pattern: RegExp;
  type: string;
  props?: Record<string, unknown>;
}

const BLOCK_SHORTCUTS: readonly BlockShortcut[] = [
  { pattern: /^#\s$/, type: 'heading_1' },
  { pattern: /^##\s$/, type: 'heading_2' },
  { pattern: /^###\s$/, type: 'heading_3' },
  { pattern: /^[-*+]\s$/, type: 'bulleted_list_item' },
  { pattern: /^1[.)]\s$/, type: 'numbered_list_item' },
  { pattern: /^\[\s?\]\s$/, type: 'todo', props: { checked: false } },
  { pattern: /^\[[xX]\]\s$/, type: 'todo', props: { checked: true } },
  { pattern: /^>\s$/, type: 'toggle' },
  { pattern: /^"\s$/, type: 'quote' },
  { pattern: /^```$/, type: 'code' },
  { pattern: /^---$/, type: 'divider' },
];

/**
 * The block shortcut completed by `edit` in a paragraph, if any: the typed
 * prefix must sit at the very start, and the caret right after it.
 */
export function detectBlockShortcut(
  type: string,
  textAfterEdit: string,
  edit: TextEdit | null,
): (BlockShortcut & { prefixLength: number }) | null {
  if (type !== 'paragraph' || !edit || edit.deleteCount !== 0 || edit.insert.length !== 1)
    return null;
  const caret = edit.index + 1;
  const prefix = textAfterEdit.slice(0, caret);
  for (const shortcut of BLOCK_SHORTCUTS) {
    if (shortcut.pattern.test(prefix)) return { ...shortcut, prefixLength: caret };
  }
  return null;
}

/**
 * Turn the paragraph `id` into the shortcut's type, dropping the typed
 * prefix. A divider keeps the rest of the line in a new paragraph below.
 */
export function applyBlockShortcut(
  ctx: CommandContext,
  id: BlockId,
  shortcut: BlockShortcut & { prefixLength: number },
): Transaction {
  const block = getBlock(ctx.doc, id);
  const [, rest] = splitSegmentsAt(block.text ?? [], shortcut.prefixLength);
  const spec = specOf(ctx.schema, shortcut.type);
  const ops: Transaction['ops'][number][] = [];
  let doc = ctx.doc;
  const push = (op: Transaction['ops'][number]) => {
    doc = applyOperation(doc, op);
    ops.push(op);
  };

  if (!spec.hasText) {
    push({
      kind: 'update',
      id,
      before: { type: block.type, text: block.text, props: block.props },
      after: { type: shortcut.type, text: undefined, props: { ...spec.defaultProps } },
    });
    const { parent } = positionOf(doc, id);
    const next = ctx.newId();
    push({
      kind: 'insert',
      parent,
      after: id,
      blocks: [{ id: next, type: 'paragraph', parent, text: rest, props: {}, children: [] }],
    });
    return {
      ops,
      selectionBefore: null,
      selectionAfter: { kind: 'text', blockId: next, start: 0, end: 0 },
    };
  }

  push({
    kind: 'update',
    id,
    before: { type: block.type, text: block.text, props: block.props },
    after: {
      type: shortcut.type,
      text: rest,
      props: { ...spec.defaultProps, ...block.props, ...shortcut.props },
    },
  });
  return {
    ops,
    selectionBefore: null,
    selectionAfter: { kind: 'text', blockId: id, start: 0, end: 0 },
  };
}

interface InlineShortcut {
  /** Matches the text before the caret, ending with the closing delimiter. */
  pattern: RegExp;
  mark: ToggleableMark;
  delimiter: number;
}

const INLINE_SHORTCUTS: readonly InlineShortcut[] = [
  { pattern: /\*\*([^*\s](?:[^*]*[^*\s])?)\*\*$/, mark: 'bold', delimiter: 2 },
  { pattern: /~~([^~\s](?:[^~]*[^~\s])?)~~$/, mark: 'strike', delimiter: 2 },
  { pattern: /(?:^|[^*])\*([^*\s](?:[^*]*[^*\s])?)\*$/, mark: 'italic', delimiter: 1 },
  { pattern: /(?:^|[^_\w])_([^_\s](?:[^_]*[^_\s])?)_$/, mark: 'italic', delimiter: 1 },
  { pattern: /`([^`]+)`$/, mark: 'code', delimiter: 1 },
];

/**
 * When `edit` typed the closing delimiter of an inline shortcut, the segments
 * with the delimiters removed and the mark applied, and where the caret goes.
 */
export function applyInlineShortcut(
  segments: Segment[],
  edit: TextEdit | null,
): { segments: Segment[]; caret: number } | null {
  if (edit?.deleteCount !== 0 || edit.insert.length !== 1) return null;
  const caret = edit.index + 1;
  const before = segmentsToPlainText(segments).slice(0, caret);
  for (const shortcut of INLINE_SHORTCUTS) {
    const match = shortcut.pattern.exec(before);
    const inner = match?.[1];
    if (!match || inner === undefined) continue;
    const closeStart = caret - shortcut.delimiter;
    const innerStart = closeStart - inner.length;
    const openStart = innerStart - shortcut.delimiter;
    // Remove the closing delimiter, then the opening one (offsets before it
    // are unaffected by the first removal).
    const [head, afterClose] = splitSegmentsAt(segments, caret);
    const [withoutClose] = splitSegmentsAt(head, closeStart);
    const joined = [...withoutClose, ...afterClose];
    const [beforeOpen, fromOpen] = splitSegmentsAt(joined, openStart);
    const [, afterOpen] = splitSegmentsAt(fromOpen, shortcut.delimiter);
    const stripped = [...beforeOpen, ...afterOpen];
    const marked = applyMarks(stripped, openStart, openStart + inner.length, {
      [shortcut.mark]: true,
    });
    return { segments: marked, caret: openStart + inner.length };
  }
  return null;
}

/** What an inline equation is, as a mention's `attributes.kind`. */
export const INLINE_EQUATION_KIND = 'equation';

/**
 * When `edit` typed the closing `$$` of `$$…$$`, the segments with it made an
 * inline equation — a mention under `indicator` whose attributes are
 * `{ kind: 'equation', latex }`, showing the LaTeX — and where the caret
 * goes. Null otherwise, and inside inline code or across a mention.
 */
export function applyInlineEquation(
  segments: Segment[],
  edit: TextEdit | null,
  indicator: string,
): { segments: Segment[]; caret: number } | null {
  if (edit?.deleteCount !== 0 || edit.insert !== '$') return null;
  const caret = edit.index + 1;
  const before = segmentsToPlainText(segments).slice(0, caret);
  const match = /(?:^|[^$])\$\$([^$\n]*[^$\s\n][^$\n]*)\$\$$/.exec(before);
  const latex = match?.[1];
  if (!match || latex === undefined) return null;
  const start = caret - latex.length - 4;
  const [head, rest] = splitSegmentsAt(segments, start);
  const [typed, tail] = splitSegmentsAt(rest, caret - start);
  if (typed.some((segment) => segment.code || segment.mention)) return null;
  const equation: Segment = {
    text: latex.trim(),
    mention: { indicator, attributes: { kind: INLINE_EQUATION_KIND, latex: latex.trim() } },
  };
  return {
    segments: [...head.filter((s) => s.text), equation, ...tail.filter((s) => s.text)],
    caret: start + equation.text.length,
  };
}
