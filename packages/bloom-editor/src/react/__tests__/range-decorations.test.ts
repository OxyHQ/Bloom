import { decorateRuns, rangeMarks } from '../range-decorations';
import type { TextRun } from '../text-runs';

const runs: TextRun[] = [
  { text: 'Hello ', style: {} },
  { text: 'bold', style: { fontWeight: '700' } },
  { text: ' world', style: {} },
];

/** The decorated runs as a compact string: `[text|bg]` pieces and `^name` carets. */
function show(items: ReturnType<typeof decorateRuns>): string {
  return items
    .map((item) =>
      item.kind === 'caret'
        ? `^${item.label ?? item.color}`
        : `[${item.text}${item.style.backgroundColor ? `|${item.style.backgroundColor}` : ''}${
            item.style.fontWeight ? '|b' : ''
          }]`,
    )
    .join('');
}

describe('decorateRuns', () => {
  it('leaves runs as they are without decorations', () => {
    expect(show(decorateRuns(runs, undefined))).toBe('[Hello ][bold|b][ world]');
    expect(show(decorateRuns(runs, []))).toBe('[Hello ][bold|b][ world]');
  });

  it('puts a highlight behind what it covers, across runs, keeping their styles', () => {
    expect(show(decorateRuns(runs, [{ start: 3, end: 8, background: 'y' }]))).toBe(
      '[Hel][lo |y][bo|y|b][ld|b][ world]',
    );
  });

  it('puts a caret at its offset, between the characters there', () => {
    expect(
      show(decorateRuns(runs, [{ start: 8, end: 8, caret: { color: 'red', label: 'Ana' } }])),
    ).toBe('[Hello ][bo|b]^Ana[ld|b][ world]');
  });

  it('draws a range and its caret at its end, which may come first', () => {
    expect(
      show(
        decorateRuns(runs, [
          { start: 13, end: 6, background: 'y', caret: { color: 'blue', label: 'Ben' } },
        ]),
      ),
    ).toBe('[Hello ]^Ben[bold|y|b][ wo|y][rld]');
  });

  it('lets the last range win where two overlap, over the text’s own highlight', () => {
    const marked: TextRun[] = [{ text: 'abcdef', style: { backgroundColor: 'own' } }];
    expect(
      show(
        decorateRuns(marked, [
          { start: 0, end: 4, background: 'first' },
          { start: 2, end: 6, background: 'second' },
        ]),
      ),
    ).toBe('[ab|first][cd|second][ef|second]');
  });

  it('keeps carets at one offset in the order given, and one at the end after the text', () => {
    expect(
      show(
        decorateRuns(runs, [
          { start: 16, end: 16, caret: { color: 'c', label: 'Cy' } },
          { start: 0, end: 0, caret: { color: 'a', label: 'Al' } },
          { start: 0, end: 0, caret: { color: 'b' } },
        ]),
      ),
    ).toBe('^Al^b[Hello ][bold|b][ world]^Cy');
  });

  it('draws a caret in an empty text', () => {
    expect(show(decorateRuns([], [{ start: 0, end: 0, caret: { color: 'c', label: 'Al' } }]))).toBe(
      '^Al',
    );
  });

  it('clamps offsets to the text and ignores ranges that are not numbers', () => {
    expect(
      show(
        decorateRuns(
          [{ text: 'abc', style: {} }],
          [
            { start: -5, end: 1, background: 'y' },
            { start: 2, end: 99, caret: { color: 'c', label: 'End' } },
            { start: Number.NaN, end: 1, background: 'z' },
          ],
        ),
      ),
    ).toBe('[a|y][bc]^End');
  });

  it('spells the text exactly, whatever is laid in', () => {
    const items = decorateRuns(runs, [
      { start: 1, end: 14, background: 'y', caret: { color: 'c' } },
      { start: 5, end: 7, background: 'z' },
      { start: 9, end: 9, caret: { color: 'd' } },
    ]);
    const text = items.map((item) => (item.kind === 'text' ? item.text : '')).join('');
    expect(text).toBe('Hello bold world');
  });
});

describe('rangeMarks', () => {
  it('lists highlights first, then carets at each range’s end', () => {
    expect(
      rangeMarks(
        [
          { start: 4, end: 1, background: 'y', caret: { color: 'c', label: 'Al' } },
          { start: 2, end: 2, background: 'ignored-empty' },
          { start: 9, end: 9, caret: { color: 'd' } },
        ],
        5,
      ),
    ).toEqual([
      { kind: 'highlight', start: 1, end: 4, color: 'y' },
      { kind: 'caret', start: 1, end: 1, color: 'c', label: 'Al' },
      { kind: 'caret', start: 5, end: 5, color: 'd' },
    ]);
  });
});
