/** `{ ..base, k: v }` copies base and changes `k`, leaving base as it was. */

// Required, not imported: see bloom.cost.test.tsx.
const { searched, paged } = require('./bloom/record-spread.bloom') as {
  searched: (draft: { q: string; cursor?: string }, text: string) => { q: string; cursor?: string };
  paged: (draft: { q: string; cursor?: string }, cursor: string) => { q: string; cursor?: string };
};

it('replaces the written fields and keeps the rest', () => {
  const draft = { q: 'old', cursor: 'c1' };
  expect(searched(draft, 'new')).toEqual({ q: 'new' });
  expect(paged(draft, 'c2')).toEqual({ q: 'old', cursor: 'c2' });
  expect(draft).toEqual({ q: 'old', cursor: 'c1' });
});
