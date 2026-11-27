/**
 * A list literal where a TS `T[] | undefined` is expected takes `T`, a string literal union: the
 * fallback fits, and the value is the TS list or the fallback.
 */

// Required, not imported: see bloom.cost.test.tsx.
const { permission } = require('./bloom/union-list.bloom') as {
  permission: (post: { metadata?: { replyPermission?: string[] } }) => readonly string[];
};

it('falls back to the literal list, and keeps the TS one', () => {
  expect(permission({})).toEqual(['anyone']);
  expect(permission({ metadata: { replyPermission: ['nobody'] } })).toEqual(['nobody']);
});
