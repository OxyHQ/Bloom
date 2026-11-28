/**
 * A struct's `static let` is the type's, never a field: `Note(id:)` takes no `empty`, and derived
 * Codable neither writes nor reads an `"empty"` key. A class's and an enum's statics alike.
 */

// Required, not imported: see bloom.cost.test.tsx.
const m = require('./packages/format-app/Sources/App/StaticMembers.bloom') as {
  encoded: (note: { id: string; pinned: boolean }) => string;
  decoded: (text: string) => { id: string; pinned: boolean } | undefined;
  statics: () => number[];
  sampleID: () => string;
};

it('round-trips a Codable struct without its statics', () => {
  const text = m.encoded({ id: 'n1', pinned: true });
  expect(JSON.parse(text)).toEqual({ id: 'n1', pinned: true });
  expect(m.decoded(text)).toEqual({ id: 'n1', pinned: true });
  expect(m.decoded('{"id":"n2"}')).toEqual({ id: 'n2', pinned: false });
});

it('reads the statics of a struct, a class and an enum', () => {
  expect(m.statics()).toEqual([0, 2, 0]);
  expect(m.sampleID()).toBe('sample');
});
