/**
 * `x ?? (c ? a : b)` with no `none` branch is the branches' type, as Swift's `T? ?? T` is `T`: it
 * compares and returns as a number (it was `Float?`, B0201).
 */

// A module, so its names are its own (tsc checks the tests together).
export {};

// Required, not imported: see bloom.cost.test.tsx.
const m = require('./bloom/coalesce-ternary.bloom') as {
  below: (s: string) => boolean;
  parsed: (s: string) => number;
  maybe: (s: string, c: boolean) => number | undefined;
};

it('falls back to a ternary’s value', () => {
  expect(m.below('0.5')).toBe(true);
  expect(m.below('')).toBe(true);
  expect(m.below('x')).toBe(false);
  expect(m.parsed('2.5')).toBe(2.5);
  expect(m.parsed('')).toBe(0);
  expect(m.parsed('x')).toBe(1);
  expect(m.maybe('x', false)).toBeUndefined();
  expect(m.maybe('x', true)).toBe(2);
});
