/**
 * The segment model: rich text as a flat `Segment[]`, each a run of text with
 * one set of marks. Pure functions, no platform code.
 */
import type { MentionMark, Segment, TextEdit, TextMarks } from './types';

const MARK_KEYS = [
  'bold',
  'italic',
  'underline',
  'strike',
  'code',
  'color',
  'background',
  'link',
] as const satisfies readonly (keyof TextMarks)[];

function mentionsEqual(a: MentionMark | undefined, b: MentionMark | undefined): boolean {
  if (a === b) return true;
  if (!a || !b || a.indicator !== b.indicator) return false;
  const ak = Object.keys(a.attributes);
  const bk = Object.keys(b.attributes);
  return ak.length === bk.length && ak.every((k) => a.attributes[k] === b.attributes[k]);
}

/** Whether two runs carry exactly the same marks. */
export function marksEqual(a: TextMarks, b: TextMarks): boolean {
  for (const key of MARK_KEYS) {
    if ((a[key] || undefined) !== (b[key] || undefined)) return false;
  }
  return mentionsEqual(a.mention, b.mention);
}

/** The marks of a segment, without its text. */
export function marksOf(segment: Segment): TextMarks {
  const { text: _text, ...marks } = segment;
  return marks;
}

/** Concatenated plain text. */
export function segmentsToPlainText(segments: readonly Segment[]): string {
  let out = '';
  for (const s of segments) out += s.text;
  return out;
}

/**
 * Merge neighbours with identical marks and drop empty runs. A mention is
 * atomic: two adjacent mentions never merge, even to the same target.
 */
export function coalesceSegments(segments: readonly Segment[]): Segment[] {
  const out: Segment[] = [];
  for (const seg of segments) {
    if (seg.text.length === 0) continue;
    const last = out[out.length - 1];
    if (last && !seg.mention && !last.mention && marksEqual(last, seg)) {
      out[out.length - 1] = { ...last, text: last.text + seg.text };
    } else {
      out.push({ ...seg });
    }
  }
  return out;
}

/** Split at a UTF-16 offset into `[left, right]`. */
export function splitSegmentsAt(
  segments: readonly Segment[],
  offset: number,
): [Segment[], Segment[]] {
  const left: Segment[] = [];
  const right: Segment[] = [];
  let consumed = 0;
  for (const seg of segments) {
    const len = seg.text.length;
    if (offset <= consumed) right.push({ ...seg });
    else if (offset >= consumed + len) left.push({ ...seg });
    else {
      const cut = offset - consumed;
      left.push({ ...seg, text: seg.text.slice(0, cut) });
      right.push({ ...seg, text: seg.text.slice(cut) });
    }
    consumed += len;
  }
  return [left, right];
}

function isHighSurrogate(code: number): boolean {
  return code >= 0xd800 && code <= 0xdbff;
}

function isLowSurrogate(code: number): boolean {
  return code >= 0xdc00 && code <= 0xdfff;
}

/**
 * The edit that turns `prev` into `next`, as the single span between their
 * longest common prefix and suffix. A text input changes one contiguous range
 * per event (typing, deleting, pasting over a selection, autocorrect), so this
 * is exact for input events. Never splits a surrogate pair. Null when equal.
 */
export function diffText(prev: string, next: string): TextEdit | null {
  if (prev === next) return null;
  const max = Math.min(prev.length, next.length);
  let prefix = 0;
  while (prefix < max && prev.charCodeAt(prefix) === next.charCodeAt(prefix)) prefix += 1;
  if (prefix > 0 && isHighSurrogate(prev.charCodeAt(prefix - 1))) prefix -= 1;

  let suffix = 0;
  while (
    suffix < max - prefix &&
    prev.charCodeAt(prev.length - 1 - suffix) === next.charCodeAt(next.length - 1 - suffix)
  ) {
    suffix += 1;
  }
  if (suffix > 0 && isLowSurrogate(prev.charCodeAt(prev.length - suffix))) suffix -= 1;

  return {
    index: prefix,
    deleteCount: prev.length - prefix - suffix,
    insert: next.slice(prefix, next.length - suffix),
  };
}

/**
 * Apply a `TextEdit`, keeping every mark outside it. Text typed over a
 * selection keeps the marks of the text it replaces; a plain insertion takes
 * its left neighbour's, falling back to the right one. Inserted text never
 * extends a mention (a mention is atomic).
 */
export function applyTextEdit(segments: readonly Segment[], edit: TextEdit): Segment[] {
  const [left, rest] = splitSegmentsAt(segments, edit.index);
  const [removed, right] = splitSegmentsAt(rest, edit.deleteCount);
  if (edit.insert.length === 0) return coalesceSegments([...left, ...right]);
  const source = removed[0] ?? left[left.length - 1] ?? right[0];
  const { mention: _mention, ...inherited } = source ? marksOf(source) : ({} as TextMarks);
  return coalesceSegments([...left, { ...inherited, text: edit.insert }, ...right]);
}

/** Apply a whole-string change against formatted segments. */
export function applyPlainTextChange(segments: readonly Segment[], nextText: string): Segment[] {
  const edit = diffText(segmentsToPlainText(segments), nextText);
  return edit ? applyTextEdit(segments, edit) : [...segments];
}

/** A falsy value or the colour name `default` clears the mark. */
function setOrClearMark<K extends keyof TextMarks>(
  target: TextMarks,
  key: K,
  value: TextMarks[K] | null | undefined,
): void {
  if (
    value === undefined ||
    value === null ||
    value === false ||
    value === '' ||
    value === 'default'
  ) {
    delete target[key];
  } else {
    target[key] = value;
  }
}

/** Set or clear marks on every run overlapping `[start, end)`; `null`/`false` clears. */
export function applyMarks(
  segments: readonly Segment[],
  start: number,
  end: number,
  patch: { [K in keyof TextMarks]?: TextMarks[K] | null },
): Segment[] {
  if (start >= end) return [...segments];
  const [head, rest] = splitSegmentsAt(segments, start);
  const [middle, tail] = splitSegmentsAt(rest, end - start);
  const patched = middle.map((seg) => {
    const out: Segment = { ...seg };
    for (const key of Object.keys(patch) as (keyof TextMarks)[])
      setOrClearMark(out, key, patch[key]);
    return out;
  });
  return coalesceSegments([...head, ...patched, ...tail]);
}

/** Whether every run inside `[start, end)` carries `mark`. */
export function rangeHasMark(
  segments: readonly Segment[],
  start: number,
  end: number,
  mark: keyof TextMarks,
): boolean {
  if (start >= end) return false;
  const [, rest] = splitSegmentsAt(segments, start);
  const [middle] = splitSegmentsAt(rest, end - start);
  return middle.length > 0 && middle.every((seg) => Boolean(seg[mark]));
}

/** Structural equality of two values. */
export function segmentsEqual(a: readonly Segment[], b: readonly Segment[]): boolean {
  if (a === b) return true;
  const ca = coalesceSegments(a);
  const cb = coalesceSegments(b);
  return (
    ca.length === cb.length &&
    ca.every((seg, i) => {
      const other = cb[i];
      return other !== undefined && seg.text === other.text && marksEqual(seg, other);
    })
  );
}
