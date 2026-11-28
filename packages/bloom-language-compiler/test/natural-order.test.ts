/**
 * `sorted()`, `min()` and `max()` with no order given: a `Comparable` element's natural order
 * (numbers, strings, dates), as Swift's; `max(by:)` still takes one.
 */

// A module, so its names are its own (tsc checks the tests together).
export {};

// Required, not imported: see bloom.cost.test.tsx.
const m = require('./packages/format-app/Sources/App/NaturalOrder.bloom') as {
  ascendingInts: (xs: number[]) => number[];
  ascendingNames: (xs: string[]) => string[];
  leastInt: (xs: number[]) => number | undefined;
  greatestFloat: (xs: number[]) => number | undefined;
  latest: (xs: Date[]) => Date | undefined;
  longestName: (xs: string[]) => string | undefined;
};

it('orders and picks by the natural order', () => {
  expect(m.ascendingInts([10, 2, 33, 1])).toEqual([1, 2, 10, 33]);
  expect(m.ascendingNames(['b', 'a', 'B'])).toEqual(['B', 'a', 'b']);
  expect(m.leastInt([3, -1, 2])).toBe(-1);
  expect(m.leastInt([])).toBeUndefined();
  expect(m.greatestFloat([0.5, 2.5, 1])).toBe(2.5);
  const a = new Date(0);
  const b = new Date(1000);
  expect(m.latest([b, a])).toBe(b);
  expect(m.longestName(['ab', 'abc', 'a'])).toBe('abc');
});
