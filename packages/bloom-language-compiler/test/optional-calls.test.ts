/**
 * Swift's optional chaining over methods lowered to functions of their receiver (an
 * extension's, the standard library's `Date`, a protocol witness): with a `none` receiver the
 * call does not run and the chain is `none`, never the method run on `undefined`.
 */

// Required, not imported: see bloom.cost.test.tsx.
interface Pair {
  n: number;
  next?: Pair;
  xs?: number[];
  f?: (k: number) => number;
}
const o = require('./packages/format-app/Sources/App/OptionalCalls.bloom') as {
  twice: (p?: Pair) => number;
  chained: (p?: Pair) => number | undefined;
  throughField: (p?: Pair) => number | undefined;
  getter: (p?: Pair) => number | undefined;
  stored: (p?: Pair) => number | undefined;
  subscripted: (p?: Pair) => number | undefined;
  calledSubscript: (p?: Pair) => number | undefined;
  tagName: (t?: { text: string }) => string | undefined;
  since: (d?: Date) => number;
  shown: (s: string) => string;
  orNaN: (x?: number) => number;
  orZero: (x?: number) => number;
  secondsOrNaN: (d?: Date) => number;
};

const pair = (n: number, next?: Pair): Pair => ({ n, next, xs: [n, n + 1], f: (k) => n + k });

it('runs an optional extension call only on a value', () => {
  expect(o.twice(undefined)).toBe(0);
  expect(o.twice(pair(4))).toBe(8);
});

it('carries none through a chain of calls, fields and getters', () => {
  expect(o.chained(undefined)).toBeUndefined();
  expect(o.chained(pair(1))).toBeUndefined();
  expect(o.chained(pair(1, pair(2)))).toBe(6);
  expect(o.throughField(undefined)).toBeUndefined();
  expect(o.throughField(pair(1))).toBeUndefined();
  expect(o.throughField(pair(1, pair(3)))).toBe(15);
  expect(o.getter(undefined)).toBeUndefined();
  expect(o.getter(pair(1, pair(9)))).toBe(4);
});

it('guards stored closures and subscripts in a chain', () => {
  expect(o.stored(undefined)).toBeUndefined();
  expect(o.stored({ n: 1 })).toBeUndefined();
  expect(o.stored(pair(5))).toBe(7);
  expect(o.subscripted(undefined)).toBeUndefined();
  expect(o.subscripted(pair(5))).toBe(5);
  expect(o.calledSubscript(undefined)).toBeUndefined();
  expect(o.calledSubscript(pair(6))).toBe(6);
});

it('guards a protocol witness call', () => {
  expect(o.tagName(undefined)).toBeUndefined();
  expect(o.tagName({ text: 'bloom' })).toBe('bloom');
});

it("guards the standard library's Date methods", () => {
  expect(o.since(undefined)).toBe(-1);
  expect(o.since(new Date(5000))).toBe(5);
  expect(o.shown('not a date')).toBe('Invalid Date');
  expect(o.shown('2026-11-26T18:30:00Z')).toBe(
    new Date('2026-11-26T18:30:00Z').toLocaleDateString('en', {
      dateStyle: 'short',
      timeZone: 'UTC',
    }),
  );
});

it("reads an implicit member after ?? from the left side's type", () => {
  expect(o.orNaN(undefined)).toBeNaN();
  expect(o.orNaN(2.5)).toBe(2.5);
  expect(o.orZero(undefined)).toBe(0);
  expect(o.orZero(3)).toBe(3);
  expect(o.secondsOrNaN(undefined)).toBeNaN();
  expect(o.secondsOrNaN(new Date(2000))).toBe(2);
});
