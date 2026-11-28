/**
 * Swift's numeric initializers: `Int(x)` of a `Double` truncates toward zero, `Double(n)` of an
 * `Int` is the number (so `/` divides exactly), and `Int(s)` of a string is its number or `none`.
 */

// A module, so its names are its own (tsc checks the tests together).
export {};

// Required, not imported: see bloom.cost.test.tsx.
const m = require('./packages/format-app/Sources/App/NumberConversions.bloom') as {
  truncatedWhole: (x: number) => number;
  percentOf: (a: number, b: number) => number;
  halfOf: (n: number) => number;
  parsedWhole: (s: string) => number;
};

it('converts numbers as Swift does', () => {
  expect([3.7, -3.7, 0.2].map(m.truncatedWhole)).toEqual([3, -3, 0]);
  expect(m.percentOf(1, 3)).toBe(33);
  expect(m.halfOf(5)).toBe(2.5);
});

it('parses strings, none when they are not numbers', () => {
  expect(['42', ' 7 ', 'x', '1.5'].map(m.parsedWhole)).toEqual([42, 7, -1, -1]);
});
