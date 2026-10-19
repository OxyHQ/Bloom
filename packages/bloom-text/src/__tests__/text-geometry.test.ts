/**
 * @jest-environment jsdom
 */
import { measureRanges, readSurfaceText } from '../text-geometry.web';

// jsdom lays nothing out: every character is drawn 10px wide on its
// paragraph's 24px line, and ranges report the boxes that layout gives.
const CHAR = 10;
const LINE = 24;
const ORIGIN = { left: 100, top: 50 };

function box(left: number, top: number, width: number, height: number): DOMRect {
  return {
    left,
    top,
    width,
    height,
    x: left,
    y: top,
    right: left + width,
    bottom: top + height,
    toJSON: () => ({}),
  } as DOMRect;
}

function mount(html: string) {
  document.body.innerHTML = `<div id="wrapper"><div contenteditable="true">${html}</div></div>`;
  const wrapper = document.getElementById('wrapper') as HTMLElement;
  const surface = wrapper.firstElementChild as HTMLElement;
  // Each text node's place: its paragraph's line, and its x within it.
  const places = new Map<Node, { x: number; y: number }>();
  const lineOf = new Map<Element, number>();
  Array.from(surface.querySelectorAll('p')).forEach((p, line) => {
    lineOf.set(p, line);
    let x = 0;
    const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      places.set(node, { x, y: line * LINE });
      x += (node as Text).data.length * CHAR;
    }
  });
  wrapper.getBoundingClientRect = () => box(ORIGIN.left, ORIGIN.top, 600, 200);
  for (const [p, line] of lineOf) {
    (p as HTMLElement).getBoundingClientRect = () =>
      box(ORIGIN.left, ORIGIN.top + line * LINE, 600, LINE);
  }
  const measured: string[] = [];
  Range.prototype.getClientRects = function getClientRects(this: Range) {
    const place = places.get(this.startContainer);
    if (!place) return [] as unknown as DOMRectList;
    measured.push(`${(this.startContainer as Text).data}:${this.startOffset}-${this.endOffset}`);
    const width = (this.endOffset - this.startOffset) * CHAR;
    return [
      box(ORIGIN.left + place.x + this.startOffset * CHAR, ORIGIN.top + place.y + 4, width, 16),
    ] as unknown as DOMRectList;
  };
  return { wrapper, surface, measured };
}

describe('measureRanges (web)', () => {
  it('reads the surface as the input counts it: a line break between paragraphs', () => {
    const { surface } = mount(
      '<p>Hello <strong>big</strong> <mention indicator="@" text="Ana">@Ana</mention></p><p><br></p><p>end</p>',
    );
    expect(readSurfaceText(surface).text).toBe('Hello big @Ana\n\nend');
  });

  it('gives each range its boxes, one per text node, relative to the input', () => {
    const { wrapper, measured } = mount('<p>Hello <strong>big</strong> world</p><p>next</p>');
    const rects = measureRanges(wrapper, 'Hello big world\nnext', [{ start: 3, end: 8 }]);
    // "lo " in the first node, "bi" in the bold one.
    expect(measured).toEqual(['Hello :3-6', 'big:0-2']);
    expect(rects).toEqual([
      [
        { x: 30, y: 4, width: 30, height: 16 },
        { x: 60, y: 4, width: 20, height: 16 },
      ],
    ]);
  });

  it('spans paragraphs without measuring the line break between them', () => {
    const { wrapper } = mount('<p>ab</p><p>cd</p>');
    const rects = measureRanges(wrapper, 'ab\ncd', [{ start: 1, end: 4 }]);
    expect(rects).toEqual([
      [
        { x: 10, y: 4, width: 10, height: 16 },
        { x: 0, y: LINE + 4, width: 10, height: 16 },
      ],
    ]);
  });

  it('puts a caret where its offset is, on the right line, with no width', () => {
    const { wrapper } = mount('<p>ab</p><p>cd</p>');
    const rects = measureRanges(wrapper, 'ab\ncd', [
      { start: 0, end: 0 },
      { start: 2, end: 2 },
      { start: 3, end: 3 },
      { start: 5, end: 5 },
    ]);
    expect(rects?.map((r) => r.map(({ x, y, width }) => [x, y, width]))).toEqual([
      [[0, 4, 0]],
      // The end of the first line, not the start of the next.
      [[20, 4, 0]],
      [[0, LINE + 4, 0]],
      [[20, LINE + 4, 0]],
    ]);
  });

  it('puts a caret in an empty paragraph at the start of its line', () => {
    const { wrapper } = mount('<p>ab</p><p><br></p>');
    expect(measureRanges(wrapper, 'ab\n', [{ start: 3, end: 3 }])).toEqual([
      [{ x: 0, y: LINE, width: 0, height: LINE }],
    ]);
  });

  it('clamps ranges to the text and orders their ends', () => {
    const { wrapper } = mount('<p>abc</p>');
    expect(measureRanges(wrapper, 'abc', [{ start: 9, end: 1 }])).toEqual([
      [{ x: 10, y: 4, width: 20, height: 16 }],
    ]);
  });

  it('measures nothing when the surface does not show the value', () => {
    const { wrapper, measured } = mount('<p>abc</p>');
    expect(measureRanges(wrapper, 'abcd', [{ start: 0, end: 2 }])).toBeNull();
    expect(measured).toEqual([]);
  });

  it('measures nothing without an editing surface', () => {
    document.body.innerHTML = '<div id="wrapper"></div>';
    expect(measureRanges(document.getElementById('wrapper'), '', [])).toBeNull();
    expect(measureRanges(null, '', [])).toBeNull();
  });
});
