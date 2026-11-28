/**
 * Copy-on-write: a `var`'s array or dictionary is written in place (`xs[i] = v`, `xs.append(v)`,
 * `table[k] = v`), copied only where it is shared, so a write is never seen through another name
 * and n writes take O(n) time.
 */

// A module, so its names are its own (tsc checks the tests together).
export {};

// Required, not imported: see bloom.cost.test.tsx.
const m = require('./packages/format-app/Sources/App/InPlace.bloom') as {
  cube: (n: number) => number[];
  histogram: (words: string[]) => Record<string, number>;
  aliasing: (ys: number[]) => [number[], number[], number[]];
  members: () => number[][];
  dictionary: () => [Record<string, number>, number | undefined, number | undefined];
  grid: () => [number[][], number[]];
  doubled: (ys: number[]) => number[];
  captured: () => [number, number[]];
  nested: (b: { items: number[] }) => [{ items: number[] }, { items: number[] }];
};

it('writes 35,937 elements in milliseconds', () => {
  const start = performance.now();
  const xs = m.cube(33);
  const elapsed = performance.now() - start;
  expect(xs.length).toBe(35937);
  expect(xs[35936]).toBe(35936 * 2 + 1);
  expect(elapsed).toBeLessThan(200);
});

it('counts in place', () => {
  expect(m.histogram(['a', 'b', 'a'])).toEqual({ a: 2, b: 1 });
});

it('never changes another name', () => {
  const ys = [1, 2, 3];
  const [same, before, xs] = m.aliasing(ys);
  expect(ys).toEqual([1, 2, 3]);
  expect(same).toEqual([1, 2, 3]);
  expect(before).toEqual([1, 2, 3]);
  expect(xs).toEqual([8, 99, 2, 3]);
});

it("has Swift's mutating members", () => {
  expect(m.members()).toEqual([
    [5, 3, 8, 1, 9, 2],
    [8, 1, 3],
    [1, 2, 3, 4, 6],
    [6, 4, 3, 2, 1],
    [6, 2, 3, 4, 1],
    [3, 1],
    [1],
    [1, 2, 1, 2],
  ]);
  expect(m.dictionary()).toEqual([{ a: 5, c: 3 }, 1, 2]);
});

it('keeps a row read out before', () => {
  expect(m.grid()).toEqual([
    [
      [0, 5],
      [0, 0],
      [0, 0],
    ],
    [0, 0],
  ]);
});

it('walks the array as it was', () => {
  expect(m.doubled([1, 2])).toEqual([1, 2, 10, 20]);
});

it('shares a captured var with its closure', () => {
  expect(m.captured()).toEqual([2, [0, 1, 2]]);
});

it('writes a field and an element back', () => {
  const b = { items: [3, 1] };
  const [c, second] = m.nested(b);
  expect(b.items).toEqual([3, 1]);
  expect(c.items).toEqual([3, 4]);
  expect(second.items).toEqual([3, 4, 1]);
});

it('writes inout places back', () => {
  const inouts = (
    require('./packages/format-app/Sources/App/InPlace.bloom') as {
      inouts: () => [number[], number, number, number, number[], number[]];
    }
  ).inouts;
  expect(inouts()).toEqual([[7, 7, 7], 7, 3, 21, [9, 9], [4, 0, 4, 0, 1]]);
});
