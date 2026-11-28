/**
 * A JS global from "js" (`Number`, `String`) is called as the function it is, never as a TS
 * component: `Number(capacity) > 1000000` is JS's conversion (`""` is 0, garbage NaN).
 */

// Required, not imported: see bloom.cost.test.tsx.
const m = require('./bloom/js-number-call.bloom') as {
  tooBig: (capacity: string) => boolean;
  counted: (n: number) => string;
};

it("calls JS's Number and String as functions", () => {
  expect(m.tooBig('2000000')).toBe(true);
  expect(m.tooBig('12')).toBe(false);
  expect(m.tooBig('')).toBe(false);
  expect(m.tooBig('lots')).toBe(false);
  expect(m.counted(1.5)).toBe('1.5');
});
