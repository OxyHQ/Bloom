/**
 * Web: where stretches of the input's text are drawn, measured from the
 * editing surface's own text nodes.
 *
 * Offsets are the input's plain-text offsets (the ones `onSelectionChange`
 * reports): the characters of each paragraph, and one `\n` between two
 * paragraphs. The surface's DOM is read in that same model — a paragraph is a
 * text block element, its text the text nodes inside it — and is measured
 * only when it spells the value exactly, so a box is never drawn over text it
 * does not belong to (the surface may be a step behind a value just given).
 */
import type { TextRect, TextSelection } from './types';

/** The elements that hold a paragraph's text in the editing surface. */
const TEXT_BLOCKS = 'p, h1, h2, h3, h4, h5, h6, pre';

interface Leaf {
  node: Text;
  /** The plain-text offset of the node's first character. */
  start: number;
}

interface Line {
  element: Element;
  start: number;
  end: number;
  leaves: Leaf[];
}

/** The editing surface's text, as the input counts it, and the nodes that hold it. */
export interface SurfaceText {
  text: string;
  lines: Line[];
}

export function readSurfaceText(surface: Element): SurfaceText {
  const doc = surface.ownerDocument;
  const blocks = Array.from(surface.querySelectorAll(TEXT_BLOCKS)).filter(
    // An outer block's text is its inner blocks'.
    (element) => element.querySelector(TEXT_BLOCKS) === null,
  );
  const lines: Line[] = [];
  let text = '';
  for (const element of blocks.length > 0 ? blocks : [surface]) {
    if (lines.length > 0) text += '\n';
    const line: Line = { element, start: text.length, end: text.length, leaves: [] };
    const walker = doc.createTreeWalker(element, 4 /* NodeFilter.SHOW_TEXT */);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const data = (node as Text).data;
      if (data.length === 0) continue;
      line.leaves.push({ node: node as Text, start: text.length });
      text += data;
    }
    line.end = text.length;
    lines.push(line);
  }
  return { text, lines };
}

/** The line an offset is on: `\n` belongs to the end of the line before it. */
function lineAt(layout: SurfaceText, offset: number): Line | undefined {
  return layout.lines.find((line) => offset >= line.start && offset <= line.end);
}

function toRect(rect: DOMRect | DOMRectReadOnly, origin: DOMRect): TextRect {
  return {
    x: rect.left - origin.left,
    y: rect.top - origin.top,
    width: rect.width,
    height: rect.height,
  };
}

/** Where a caret at `offset` is drawn: a box of no width, as tall as the text there. */
function caretRect(layout: SurfaceText, offset: number, origin: DOMRect): TextRect | null {
  const line = lineAt(layout, offset);
  if (!line) return null;
  const leaf =
    line.leaves.find((l) => offset >= l.start && offset < l.start + l.node.data.length) ??
    line.leaves.find((l) => offset === l.start + l.node.data.length);
  if (!leaf) {
    // An empty paragraph: the caret is at the start of its line.
    const box = line.element.getBoundingClientRect();
    return box.height > 0 ? { ...toRect(box, origin), width: 0 } : null;
  }
  const range = line.element.ownerDocument.createRange();
  range.setStart(leaf.node, offset - leaf.start);
  range.collapse(true);
  const rect = range.getClientRects()[0] ?? range.getBoundingClientRect();
  return rect.height > 0 ? { ...toRect(rect, origin), width: 0 } : null;
}

/** The boxes the text from `start` to `end` occupies, a box per line it is drawn on. */
function spanRects(layout: SurfaceText, start: number, end: number, origin: DOMRect): TextRect[] {
  const rects: TextRect[] = [];
  for (const line of layout.lines) {
    if (line.end <= start || line.start >= end) continue;
    for (const leaf of line.leaves) {
      const from = Math.max(start, leaf.start);
      const to = Math.min(end, leaf.start + leaf.node.data.length);
      if (from >= to) continue;
      const range = line.element.ownerDocument.createRange();
      range.setStart(leaf.node, from - leaf.start);
      range.setEnd(leaf.node, to - leaf.start);
      for (const rect of Array.from(range.getClientRects())) {
        if (rect.width > 0 && rect.height > 0) rects.push(toRect(rect, origin));
      }
    }
  }
  return rects;
}

/**
 * The boxes each range occupies, relative to `container`'s top-left corner: a
 * box per line for a range, one box of no width where a collapsed range (a
 * caret) is. Null when the surface does not show `expected`.
 */
export function measureSurfaceRanges(
  surface: Element,
  container: Element,
  expected: string,
  ranges: readonly TextSelection[],
): TextRect[][] | null {
  const layout = readSurfaceText(surface);
  if (layout.text !== expected) return null;
  const origin = container.getBoundingClientRect();
  return ranges.map(({ start, end }) => {
    const from = Math.max(0, Math.min(start, end, layout.text.length));
    const to = Math.max(0, Math.min(Math.max(start, end), layout.text.length));
    if (from === to) {
      const caret = caretRect(layout, from, origin);
      return caret ? [caret] : [];
    }
    return spanRects(layout, from, to, origin);
  });
}

/** The input's ranges, measured on its editing surface inside `wrapper`. */
export function measureRanges(
  wrapper: unknown,
  expected: string,
  ranges: readonly TextSelection[],
): TextRect[][] | null {
  const node = wrapper as Element | null;
  const surface = node?.querySelector?.('[contenteditable]');
  if (!node || !surface) return null;
  return measureSurfaceRanges(surface, node, expected, ranges);
}
