import { useLayoutEffect, useRef, type RefObject } from 'react';
import type { TextInput } from 'react-native';

/**
 * The web half of a composer's autosize: how tall its draft is, measured from
 * the `<textarea>` react-native-web renders. Native reads
 * `onContentSizeChange` and never calls this.
 *
 * `scrollHeight` never falls below the height already applied, so it reports
 * growth exactly but cannot report shrinking. The old measurement collapsed the
 * live field to `0px` before EVERY read and restored it after — and a
 * collapsed field is a different page: each keystroke paid for laying the
 * whole document out three times (collapse, read, restore), 23–27 ms a key
 * beside a 1,000-message conversation, against 6–8 ms without the collapse.
 *
 * So the field is collapsed only when the draft could have got SHORTER:
 *
 *   - an edit that only INSERTED characters (typing, pasting, an IME
 *     committing) cannot remove a line, so `scrollHeight` is read as it
 *     stands: one layout, the same one the frame was going to do anyway.
 *   - a field already at its floor cannot shrink, so it is never collapsed.
 *   - anything else — a deletion, a replacement, a programmatic `value` such as
 *     the clear after send, a change of floor — collapses, reads and restores
 *     in the same task, so nothing is painted in between.
 *
 * The one thing insertion cannot promise is soft-wrap: inserting a character
 * could in principle reflow a wrapped word onto fewer lines. The field then
 * keeps one line too many until the next edit that deletes, which is the
 * failure the old measurement would have fixed a keystroke earlier — not a
 * clipped draft.
 */
export interface TextareaAutosizeOptions {
  /** Measure at all — `IS_WEB`. Native measures through `onContentSizeChange`. */
  enabled: boolean;
  /** The height the field has now, as last applied by the caller. */
  height: number;
  /** The smallest height the field is drawn at; a field there cannot shrink. */
  minHeight: number;
  /** Receives the draft's content height, in px, whenever it is measured. */
  onMeasure: (contentHeight: number) => void;
}

/** The DOM surface this reads and writes — `HTMLTextAreaElement`, narrowed. */
export interface AutosizeNode {
  style: { height: string };
  scrollHeight: number;
}

/**
 * Whether `next` is `previous` with characters only INSERTED — at one place,
 * nothing removed or replaced. A common prefix plus a common suffix that
 * together cover all of `previous` means every old character survived.
 */
export function isPureInsertion(previous: string, next: string): boolean {
  const length = previous.length;
  if (next.length < length) return false;
  let prefix = 0;
  while (prefix < length && previous.charCodeAt(prefix) === next.charCodeAt(prefix)) prefix++;
  if (prefix === length) return true;
  let suffix = 0;
  while (
    suffix < length - prefix &&
    previous.charCodeAt(length - 1 - suffix) === next.charCodeAt(next.length - 1 - suffix)
  ) {
    suffix++;
  }
  return prefix + suffix >= length;
}

/**
 * The content height of `node`. With `collapse` it zeroes the height first so
 * `scrollHeight` can report LESS than the field's current height, and puts the
 * height back before returning.
 */
export function measureTextarea(node: AutosizeNode, collapse: boolean): number {
  if (!collapse) return node.scrollHeight;
  const previous = node.style.height;
  node.style.height = '0px';
  const measured = node.scrollHeight;
  node.style.height = previous;
  return measured;
}

export function useTextareaAutosize(
  ref: RefObject<TextInput | null>,
  text: string,
  { enabled, height, minHeight, onMeasure }: TextareaAutosizeOptions,
): void {
  // What the field held at the last measurement, and the floor it was held to.
  const last = useRef<{ text: string; minHeight: number } | null>(null);
  const latest = useRef({ height, onMeasure });
  latest.current = { height, onMeasure };

  useLayoutEffect(() => {
    if (!enabled) return;
    const node = ref.current as unknown as AutosizeNode | null;
    if (!node?.style || typeof node.scrollHeight !== 'number') return;
    const previous = last.current;
    last.current = { text, minHeight };
    const onlyGrew =
      previous !== null && previous.minHeight === minHeight && isPureInsertion(previous.text, text);
    const collapse = !onlyGrew && latest.current.height > minHeight;
    const measured = measureTextarea(node, collapse);
    if (measured > 0) latest.current.onMeasure(measured);
  }, [enabled, ref, text, minHeight]);
}
