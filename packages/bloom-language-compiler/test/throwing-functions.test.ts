/**
 * `() throws -> T` kept in function types (Swift's): a function value that throws is called with
 * `try` and its error reaches the `catch`; one that does not throw fits a throwing parameter; a
 * closure whose `try` nothing catches throws; `try xs.map(f)` rethrows `f`'s error.
 */

// A module, so its names are its own (tsc checks the tests together).
export {};

// Required, not imported: see bloom.cost.test.tsx.
const m = require('./packages/format-app/Sources/App/ThrowingFunctions.bloom') as {
  strictNumbers: (texts: string[]) => number[];
  appliedNumbers: (s: string) => number[];
};

it('rethrows from map', () => {
  expect(m.strictNumbers(['1', '2'])).toEqual([1, 2]);
  expect(m.strictNumbers(['1', 'x'])).toEqual([-1]);
});

it('calls throwing function values and catches their errors', () => {
  expect(m.appliedNumbers('4')).toEqual([4, 5, 40]);
  expect(m.appliedNumbers('x')).toEqual([-1]);
});
