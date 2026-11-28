/**
 * Swift's `prefix(_:)`, `suffix(_:)`, `dropFirst(_:)` and `dropLast(_:)` on lists and strings:
 * past either end they give what there is (never JS `slice`'s negative-index reading), a count
 * below zero takes or drops none, and strings count user-perceived characters.
 */

// A module, so its names are its own (tsc checks the tests together).
export {};

// Required, not imported: see bloom.cost.test.tsx.
const m = require('./packages/format-app/Sources/App/Slices.bloom') as {
  listPrefix: (xs: number[], n: number) => number[];
  listSuffix: (xs: number[], n: number) => number[];
  listDropFirst: (xs: number[], n: number) => number[];
  listDropLast: (xs: number[], n: number) => number[];
  listDropOne: (xs: number[]) => number[][];
  textPrefix: (s: string, n: number) => string;
  textSuffix: (s: string, n: number) => string;
  textDropFirst: (s: string, n: number) => string;
  textDropLast: (s: string, n: number) => string;
  textDropOne: (s: string) => string[];
};

const xs = [1, 2, 3, 4, 5];

it('slices lists as Swift does', () => {
  expect(m.listPrefix(xs, 2)).toEqual([1, 2]);
  expect(m.listPrefix(xs, 9)).toEqual(xs);
  expect(m.listSuffix(xs, 2)).toEqual([4, 5]);
  expect(m.listSuffix(xs, 9)).toEqual(xs);
  expect(m.listSuffix(xs, 0)).toEqual([]);
  expect(m.listDropFirst(xs, 2)).toEqual([3, 4, 5]);
  expect(m.listDropFirst(xs, 9)).toEqual([]);
  expect(m.listDropFirst(xs, -1)).toEqual(xs);
  expect(m.listDropLast(xs, 2)).toEqual([1, 2, 3]);
  expect(m.listDropLast(xs, 9)).toEqual([]);
  expect(m.listDropLast(xs, -1)).toEqual(xs);
  expect(m.listDropOne(xs)).toEqual([
    [2, 3, 4, 5],
    [1, 2, 3, 4],
  ]);
  // What JS's `slice(-n)` reads (`[3, 4, 5]`) is not the suffix's count: `suffix(3)` agrees here.
  expect(m.listSuffix(xs, 3)).toEqual(xs.slice(-3));
});

it('slices strings by user-perceived characters', () => {
  const s = 'a👍🏽b🇪🇸c';
  expect(m.textPrefix(s, 2)).toBe('a👍🏽');
  expect(m.textSuffix(s, 2)).toBe('🇪🇸c');
  expect(m.textDropFirst(s, 2)).toBe('b🇪🇸c');
  expect(m.textDropLast(s, 2)).toBe('a👍🏽b');
  expect(m.textDropOne(s)).toEqual(['👍🏽b🇪🇸c', 'a👍🏽b🇪🇸']);
  expect(m.textSuffix(s, 9)).toBe(s);
  expect(m.textDropLast(s, 9)).toBe('');
});
