/** A value `||` with a present last side gives the first present value, or the last. */

// Required, not imported: see bloom.cost.test.tsx.
const { name } = require('./bloom/or-default.bloom') as {
  name: (user: { displayName?: string }) => string;
};

it('falls back through the parenthesised side to the literal', () => {
  expect(name({ displayName: 'Ada' })).toBe('Ada');
  expect(name({})).toBe('user');
});
