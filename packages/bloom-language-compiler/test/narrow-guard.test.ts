/**
 * A guard narrows a name in its own scope (`if amount == none { return none }`): the narrowing is
 * the same declaration, so the file compiles (it was B0217, "declared twice") and runs.
 */

// A module, so its names are its own (tsc checks the tests together).
export {};

// Required, not imported: see bloom.cost.test.tsx.
const m = require('./bloom/narrow-guard.bloom') as {
  label: (a: number | undefined) => string | undefined;
  total: (values: number[] | undefined) => number;
};

it('reads a name narrowed by a guard', () => {
  expect(m.label(3)).toBe('x3!');
  expect(m.label(undefined)).toBeUndefined();
  expect(m.total([1, 2, 3])).toBe(6);
  expect(m.total(undefined)).toBe(-1);
});
