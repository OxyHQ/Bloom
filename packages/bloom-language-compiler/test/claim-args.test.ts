/**
 * An optional only by a guard kept on a TS value TS types as present fits a TS parameter: the
 * value is TS's, read through the guard Bloom kept.
 */

// Required, not imported: see bloom.cost.test.tsx.
const { link } = require('./bloom/claim-args.bloom') as {
  link: (post: { id: string; user: { name: string } }) => string;
};

it("passes the TS value's member to the TS function", () => {
  expect(link({ id: 'p1', user: { name: 'n' } })).toBe('https://mention.earth/p/p1');
});
