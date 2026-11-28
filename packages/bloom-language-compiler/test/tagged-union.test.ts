/**
 * A `match` (or an `if`) on a TS discriminated union's tag reads the member it names, as TS
 * narrows it: a member's list is a Bloom list (`count` is its length).
 */

// Required, not imported: see bloom.cost.test.tsx.
const { count, hasSources, domain, ownMedia, showAll } = require('./bloom/tagged-union.bloom') as {
  count: (rows: unknown) => number;
  hasSources: (rows: unknown) => boolean;
  domain: (block: unknown) => string;
  ownMedia: (item: unknown) => readonly string[] | undefined;
  showAll: () => Record<string, string>;
};

it('reads each member in its own arm', () => {
  expect(count({ kind: 'sources', sources: [{ url: 'a' }, { url: 'b' }] })).toBe(2);
  expect(count({ kind: 'replySettings', postId: 'abc' })).toBe(3);
  expect(count({ kind: 'lane', laneId: 'l1' })).toBe(2);
  expect(count({ kind: 'lane', laneId: 'l1', label: 'Long' })).toBe(4);
});

it('narrows on the tag in a condition', () => {
  expect(hasSources({ kind: 'sources', sources: [{ url: 'a' }] })).toBe(true);
  expect(hasSources({ kind: 'lane', laneId: 'l1' })).toBe(false);
});

it("reads a field every member has, a narrowed member chain, and writes a TS object's element", () => {
  expect(domain({ source: 'operational', domain: 'x.social' })).toBe('x.social');
  expect(ownMedia({ media: { mode: 'override', media: ['m1'] } })).toEqual(['m1']);
  expect(ownMedia({ media: { mode: 'inherit', alt: {} } })).toBeUndefined();
  expect(showAll()).toEqual({ video: 'show', audio: 'show' });
});
