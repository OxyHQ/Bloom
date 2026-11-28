/**
 * A closure called at once gives what is expected: each return's records are the expected
 * struct's (a defaulted field left out), and Swift's `{ () -> T in … }` writes it by hand.
 */

// Required, not imported: see bloom.cost.test.tsx.
const { items, rows, sectionRows } = require('./bloom/iife.bloom') as {
  items: (
    names: string[] | undefined,
    uris: string[],
  ) => { id: string; uri?: string; name?: string }[];
  rows: (ids: string[]) => number;
  sectionRows: (sections: { title: string; data: string[] }[]) => number;
};

it('builds each branch as the expected struct', () => {
  expect(items(['a'], [])).toEqual([{ id: 'a', name: 'a' }]);
  expect(items(undefined, ['u'])).toEqual([{ id: 'u', uri: 'u' }]);
});

it('runs a closure with its written signature', () => {
  expect(rows(['x', 'y'])).toBe(4);
});

it("types a list literal's spread map without its siblings", () => {
  expect(
    sectionRows([
      { title: 'A', data: ['x', 'y'] },
      { title: 'B', data: [] },
    ]),
  ).toBe(4);
});
