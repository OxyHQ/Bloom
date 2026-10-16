/**
 * A block's rich text as a `Y.Text`: each segment's marks are the attributes
 * of its run. A mention is stored as JSON, because Yjs compares attribute
 * values shallowly and a mention carries nested data.
 */
import {
  coalesceSegments,
  type MentionMark,
  type Segment,
  type TextMarks,
} from '@oxy.so/bloom-text/model';
import type * as Y from 'yjs';

type Attributes = Record<string, unknown>;

const MARK_KEYS = [
  'bold',
  'italic',
  'underline',
  'strike',
  'code',
  'color',
  'background',
  'link',
  'mention',
] as const satisfies readonly (keyof TextMarks)[];

/** A segment's marks as `Y.Text` attributes (every mark it lacks left out). */
export function marksToAttributes(segment: TextMarks): Attributes {
  const attributes: Attributes = {};
  for (const key of MARK_KEYS) {
    const value = segment[key];
    if (value === undefined || value === false) continue;
    attributes[key] = key === 'mention' ? JSON.stringify(value) : value;
  }
  return attributes;
}

function attributesToMarks(attributes: Attributes | undefined): TextMarks {
  const marks: TextMarks = {};
  if (!attributes) return marks;
  for (const key of MARK_KEYS) {
    const value = attributes[key];
    if (value === undefined || value === null) continue;
    if (key === 'mention') {
      if (typeof value !== 'string') continue;
      try {
        marks.mention = JSON.parse(value) as MentionMark;
      } catch {
        // A malformed mention is dropped, never shown as something else.
      }
    } else if (key === 'color' || key === 'background' || key === 'link') {
      if (typeof value === 'string') marks[key] = value;
    } else if (value === true) {
      marks[key] = true;
    }
  }
  return marks;
}

/** The text of a `Y.Text`, as segments. */
export function readSegments(text: Y.Text): Segment[] {
  const segments: Segment[] = [];
  for (const run of text.toDelta() as { insert?: unknown; attributes?: Attributes }[]) {
    if (typeof run.insert !== 'string' || run.insert.length === 0) continue;
    segments.push({ text: run.insert, ...attributesToMarks(run.attributes) });
  }
  return coalesceSegments(segments);
}

/** Write segments into an empty `Y.Text`. */
export function writeSegments(text: Y.Text, segments: readonly Segment[]): void {
  let at = text.length;
  for (const segment of segments) {
    if (segment.text.length === 0) continue;
    text.insert(at, segment.text, marksToAttributes(segment));
    at += segment.text.length;
  }
}

/** One UTF-16 code unit with the key of its marks. */
interface Unit {
  char: string;
  marks: string;
  attributes: Attributes;
}

function units(segments: readonly Segment[]): Unit[] {
  const out: Unit[] = [];
  for (const segment of segments) {
    const attributes = marksToAttributes(segment);
    const marks = JSON.stringify(attributes, Object.keys(attributes).sort());
    for (let i = 0; i < segment.text.length; i += 1) {
      out.push({ char: segment.text[i] as string, marks, attributes });
    }
  }
  return out;
}

/** Consecutive units with the same marks, as runs. */
function runs(list: readonly Unit[]): { text: string; attributes: Attributes }[] {
  const out: { text: string; attributes: Attributes; marks: string }[] = [];
  for (const unit of list) {
    const last = out[out.length - 1];
    if (last && last.marks === unit.marks) last.text += unit.char;
    else out.push({ text: unit.char, attributes: unit.attributes, marks: unit.marks });
  }
  return out;
}

/**
 * Change a `Y.Text` into `next` with the smallest edit: what both share at
 * the start and the end stays, and where only marks differ they are
 * reformatted rather than the text rewritten, so a collaborator typing in the
 * same stretch keeps their words.
 */
export function updateSegments(text: Y.Text, next: readonly Segment[]): void {
  const before = units(readSegments(text));
  const after = units(next);
  const same = (a: Unit | undefined, b: Unit | undefined) =>
    a !== undefined && b !== undefined && a.char === b.char && a.marks === b.marks;
  let start = 0;
  while (start < before.length && start < after.length && same(before[start], after[start])) {
    start += 1;
  }
  let end = 0;
  while (
    end < before.length - start &&
    end < after.length - start &&
    same(before[before.length - 1 - end], after[after.length - 1 - end])
  ) {
    end += 1;
  }
  const removed = before.slice(start, before.length - end);
  const added = after.slice(start, after.length - end);
  if (removed.length === 0 && added.length === 0) return;

  const sameText =
    removed.length === added.length && removed.every((unit, i) => unit.char === added[i]?.char);
  if (sameText) {
    // Only marks changed: format each run, clearing what the old marks had.
    let at = start;
    for (const run of runs(added)) {
      const cleared: Attributes = {};
      for (const unit of removed.slice(at - start, at - start + run.text.length)) {
        for (const key of Object.keys(unit.attributes)) cleared[key] = null;
      }
      text.format(at, run.text.length, { ...cleared, ...run.attributes });
      at += run.text.length;
    }
    return;
  }
  if (removed.length > 0) text.delete(start, removed.length);
  let at = start;
  for (const run of runs(added)) {
    // An attributes object, even empty: Yjs then clears the marks of the text
    // around the insertion instead of extending them over it.
    text.insert(at, run.text, run.attributes);
    at += run.text.length;
  }
}
