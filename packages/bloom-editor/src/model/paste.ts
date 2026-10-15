/**
 * Pasting lines into a text block, as Notion does: the first line continues
 * the block where it was pasted, every other line becomes a block after it,
 * and what followed the caret ends the last one. Markdown line prefixes make
 * the block they say — `#`/`##`/`###` headings, `-` `*` `+` bullets, `1.`
 * numbers, `[ ]`/`[x]` to-dos, `>` quotes, `---` dividers, and ``` fences a
 * code block of the lines between them. Lines pasted into a list without a
 * prefix continue the list. The pasted text's marks (a rich paste) are kept.
 * Blank lines separate blocks and make none.
 */
import {
  segmentsToPlainText,
  type Segment,
  splitSegmentsAt,
  type TextEdit,
} from '@oxy.so/bloom-text/model';
import type { CommandContext } from './commands';
import { type Block, getBlock, positionOf } from './document';
import type { BlockId } from './document';
import { applyOperation, type Operation, type Transaction } from './operations';
import { specOf } from './schema';

const LIST_TYPES = new Set(['bulleted_list_item', 'numbered_list_item', 'todo']);

const LINE_PREFIXES: readonly { pattern: RegExp; type: string; props?: Record<string, unknown> }[] =
  [
    { pattern: /^###\s+/, type: 'heading_3' },
    { pattern: /^##\s+/, type: 'heading_2' },
    { pattern: /^#\s+/, type: 'heading_1' },
    { pattern: /^\[\s?\]\s+/, type: 'todo', props: { checked: false } },
    { pattern: /^\[[xX]\]\s+/, type: 'todo', props: { checked: true } },
    { pattern: /^[-*+]\s+(?:\[\s?\]\s+)/, type: 'todo', props: { checked: false } },
    { pattern: /^[-*+]\s+(?:\[[xX]\]\s+)/, type: 'todo', props: { checked: true } },
    { pattern: /^[-*+]\s+/, type: 'bulleted_list_item' },
    { pattern: /^\d+[.)]\s+/, type: 'numbered_list_item' },
    { pattern: /^>\s?/, type: 'quote' },
  ];

interface Line {
  type: string;
  text: Segment[];
  props: Record<string, unknown>;
}

/** The segments between two offsets. */
function slice(segments: readonly Segment[], start: number, end: number): Segment[] {
  const [, from] = splitSegmentsAt(segments, start);
  return splitSegmentsAt(from, end - start)[0];
}

/** A pasted line as a block: its type from a Markdown prefix, the prefix dropped. */
function lineBlock(text: Segment[], fallback: string): Line | 'divider' {
  const plain = segmentsToPlainText(text);
  if (/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(plain)) return 'divider';
  for (const prefix of LINE_PREFIXES) {
    const match = prefix.pattern.exec(plain);
    if (match) {
      return {
        type: prefix.type,
        text: splitSegmentsAt(text, match[0].length)[1],
        props: { ...prefix.props },
      };
    }
  }
  return { type: fallback, text, props: {} };
}

/**
 * When `edit` pasted line breaks into the text block `id`, the transaction
 * that makes blocks of the lines; null when it inserted none, or `id` takes
 * line breaks itself (a code block).
 */
export function pasteIntoBlock(
  ctx: CommandContext,
  id: BlockId,
  textAfterPaste: readonly Segment[],
  edit: TextEdit,
): Transaction | null {
  const block = getBlock(ctx.doc, id);
  const spec = specOf(ctx.schema, block.type);
  if (!spec.hasText || spec.multiline || !edit.insert.includes('\n')) return null;

  // Cut at the pasted line breaks only.
  const cuts: number[] = [];
  for (let i = 0; i < edit.insert.length; i += 1) {
    if (edit.insert[i] === '\n') cuts.push(edit.index + i);
  }
  const total = segmentsToPlainText(textAfterPaste).length;
  const pieces: Segment[][] = [];
  let start = 0;
  for (const cut of cuts) {
    pieces.push(slice(textAfterPaste, start, cut));
    start = cut + 1;
  }
  pieces.push(slice(textAfterPaste, start, total));
  // What followed the caret ends the last line.
  const restLength = total - (edit.index + edit.insert.length);

  const wasEmpty =
    segmentsToPlainText(block.text ?? []).length === edit.deleteCount && block.type === 'paragraph';
  const fallback = LIST_TYPES.has(block.type) ? block.type : 'paragraph';

  // The lines as blocks, code fences gathered into one code block.
  const lines: (Line | 'divider')[] = [];
  let code: Segment[][] | null = null;
  for (const [i, piece] of pieces.entries()) {
    const plain = segmentsToPlainText(piece);
    if (/^\s*```/.test(plain)) {
      if (code) {
        lines.push({
          type: 'code',
          text: [{ text: code.map(segmentsToPlainText).join('\n') }],
          props: {},
        });
        code = null;
      } else {
        code = [];
      }
      continue;
    }
    if (code) {
      code.push(piece);
      continue;
    }
    if (i > 0 && plain.trim() === '' && i < pieces.length - 1) continue;
    lines.push(
      i === 0 && !wasEmpty
        ? { type: block.type, text: piece, props: {} }
        : lineBlock(piece, fallback),
    );
  }
  if (code)
    lines.push({
      type: 'code',
      text: [{ text: code.map(segmentsToPlainText).join('\n') }],
      props: {},
    });
  // A trailing empty line (the paste ended with a break, nothing after) makes no block.
  const last = lines[lines.length - 1];
  if (
    lines.length > 1 &&
    last !== 'divider' &&
    last &&
    segmentsToPlainText(last.text) === '' &&
    restLength === 0
  ) {
    lines.pop();
  }

  const ops: Operation[] = [];
  let doc = ctx.doc;
  const push = (op: Operation) => {
    doc = applyOperation(doc, op);
    ops.push(op);
  };

  // The first line stays in the block (made into what its prefix says when
  // the block was an empty paragraph).
  const first = lines[0] ?? { type: block.type, text: [], props: {} };
  if (first === 'divider') {
    push({
      kind: 'update',
      id,
      before: { type: block.type, text: block.text, props: block.props },
      after: {
        type: 'divider',
        text: undefined,
        props: { ...specOf(ctx.schema, 'divider').defaultProps },
      },
    });
  } else {
    const retype = first.type !== block.type;
    push({
      kind: 'update',
      id,
      before: { ...(retype && { type: block.type, props: block.props }), text: block.text },
      after: {
        ...(retype && {
          type: first.type,
          props: { ...specOf(ctx.schema, first.type).defaultProps, ...first.props },
        }),
        text: first.text,
      },
    });
  }

  const { parent } = positionOf(doc, id);
  let after: BlockId = id;
  let caret: { blockId: BlockId; offset: number } | null = null;
  for (const line of lines.slice(1)) {
    const next = ctx.newId();
    const type = line === 'divider' ? 'divider' : line.type;
    const lineSpec = specOf(ctx.schema, type);
    const inserted: Block = {
      id: next,
      type,
      parent,
      ...(lineSpec.hasText && line !== 'divider' && { text: line.text }),
      props: { ...lineSpec.defaultProps, ...(line === 'divider' ? {} : line.props) },
      children: [],
    };
    push({ kind: 'insert', parent, after, blocks: [inserted] });
    after = next;
    if (lineSpec.hasText && line !== 'divider') {
      caret = { blockId: next, offset: segmentsToPlainText(line.text).length };
    }
  }

  // The caret goes where the pasted text ends: before what followed it.
  const target = caret ?? {
    blockId: id,
    offset: first === 'divider' ? 0 : segmentsToPlainText(first.text).length,
  };
  const offset = Math.max(0, target.offset - restLength);
  return {
    ops,
    selectionBefore: null,
    selectionAfter: { kind: 'text', blockId: target.blockId, start: offset, end: offset },
  };
}
