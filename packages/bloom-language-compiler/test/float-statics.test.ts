/**
 * `Float.nan`, `Float.infinity` and `.nan`/`.infinity` where a `Float` is expected: Double's own
 * (`Float` is `Double`, JS's number).
 */

// A module, so its names are its own (tsc checks the tests together).
export {};

// Required, not imported: see bloom.cost.test.tsx.
const m = require('./packages/format-app/Sources/App/FloatStatics.bloom') as {
  ratio: (a: number | undefined, b: number) => number;
  floatNaN: () => number;
  floatOrNaN: (x: number | undefined) => number;
  bounded: (xs: number[]) => number;
};

it('reads Float.nan and Float.infinity', () => {
  expect(m.ratio(1, 0)).toBe(Number.POSITIVE_INFINITY);
  expect(m.ratio(undefined, 2)).toBeNaN();
  expect(m.ratio(3, 2)).toBe(1.5);
  expect(m.floatNaN()).toBeNaN();
  expect(m.floatOrNaN(undefined)).toBeNaN();
  expect(m.floatOrNaN(2)).toBe(2);
  expect(m.bounded([])).toBe(Number.POSITIVE_INFINITY);
  expect(m.bounded([3, 1, 2])).toBe(1);
});
