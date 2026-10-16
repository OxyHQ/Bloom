/**
 * Merging what the native input reports back into the value.
 *
 * The input renders and edits only the marks it knows (`INPUT_MARKS`). The
 * value can carry more (`color`, `background`). Taking the input's HTML as
 * the whole truth would erase those marks on every keystroke, so the next
 * value is rebuilt from the previous one: apply the input's text edit (which
 * keeps every mark outside the edited span), then take the input's word on
 * the marks it knows, run by run.
 */
import {
  applyTextEdit,
  coalesceSegments,
  diffText,
  segmentsToPlainText,
  splitSegmentsAt,
} from './segments';
import type { Segment, TextEdit, TextMarks } from './model-types';

/** Marks the native input renders and edits. */
export const INPUT_MARKS = [
  'bold',
  'italic',
  'underline',
  'strike',
  'code',
  'link',
  'mention',
] as const satisfies readonly (keyof TextMarks)[];

/** Marks only the value carries; the input neither shows nor edits them. */
export const VALUE_ONLY_MARKS = [
  'color',
  'background',
] as const satisfies readonly (keyof TextMarks)[];

function copyMark<K extends keyof TextMarks>(
  target: TextMarks,
  source: TextMarks | undefined,
  key: K,
): void {
  const value = source?.[key];
  if (value) target[key] = value;
}

function boundaries(segments: readonly Segment[]): number[] {
  const out: number[] = [];
  let offset = 0;
  for (const seg of segments) {
    offset += seg.text.length;
    out.push(offset);
  }
  return out;
}

function sliceAt(segments: readonly Segment[], start: number, end: number): Segment | undefined {
  const [, rest] = splitSegmentsAt(segments, start);
  const [middle] = splitSegmentsAt(rest, end - start);
  return middle[0];
}

/**
 * The next value after the input reported `input`.
 * `edit` is the text edit between the two, or null when only marks changed.
 */
export function reconcileInputValue(
  previous: readonly Segment[],
  input: readonly Segment[],
): { segments: Segment[]; edit: TextEdit | null } {
  const inputText = segmentsToPlainText(input);
  const edit = diffText(segmentsToPlainText(previous), inputText);
  const base = edit ? applyTextEdit(previous, edit) : [...previous];

  const cuts = [...new Set([...boundaries(base), ...boundaries(input)])].sort((a, b) => a - b);
  const merged: Segment[] = [];
  let start = 0;
  for (const end of cuts) {
    if (end <= start) continue;
    const fromBase = sliceAt(base, start, end);
    const fromInput = sliceAt(input, start, end);
    const seg: Segment = { text: inputText.slice(start, end) };
    for (const key of VALUE_ONLY_MARKS) copyMark(seg, fromBase, key);
    for (const key of INPUT_MARKS) copyMark(seg, fromInput, key);
    merged.push(seg);
    start = end;
  }
  return { segments: coalesceSegments(merged), edit };
}
