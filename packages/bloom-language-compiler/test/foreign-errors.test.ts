/**
 * `x as? JSError` on a TS value Bloom does not type (a `.catch` callback's error, a `JSONValue`):
 * the error's message when it is a JS `Error`, else the fallback, as Swift's `Any as? Error`.
 */

// A module, so its names are its own (tsc checks the tests together).
export {};

// Required, not imported: see bloom.cost.test.tsx.
const m = require('./packages/format-app/Sources/App/ForeignErrors.bloom') as {
  foreignErrorMessage: (error: unknown) => string;
  jsonErrorMessage: (error: unknown) => string;
};

it('casts a TS value to a JS error at run time', () => {
  expect(m.foreignErrorMessage(new TypeError('Network request failed'))).toBe(
    'Network request failed',
  );
  expect(m.jsonErrorMessage(new RangeError('out of range'))).toBe('out of range');
  expect(m.foreignErrorMessage('boom')).toBe('fallback');
  expect(m.jsonErrorMessage({ message: 'not an Error' })).toBe('fallback');
  expect(m.foreignErrorMessage(undefined)).toBe('fallback');
});
