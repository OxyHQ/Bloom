/**
 * `Regex` in Swift's shape, compared with JS's `RegExp`: `try Regex("…")` throws on an invalid
 * pattern; `wholeMatch(of:)`, `firstMatch(of:)`, `matches(of:)`, `contains(_:)`,
 * `replacing(_:with:)` and `split(separator:)` read as JS's; a group that did not take part in
 * the match is `none` (JS's `undefined`), never `""`.
 */

// A module, so its names are its own (tsc checks the tests together).
export {};

// Required, not imported: see bloom.cost.test.tsx.
const m = require('./packages/format-app/Sources/App/RegexSwift.bloom') as {
  isDigits: (s: string) => boolean;
  validPattern: (pattern: string) => string;
  firstHandle: (s: string) => string | undefined;
  handles: (s: string) => string[];
  hasNumber: (s: string) => boolean;
  squeezed: (s: string) => string;
  fields: (s: string) => string[];
  optionalGroups: (s: string) => (string | undefined)[];
};

it('throws on an invalid pattern', () => {
  expect(m.validPattern('a+')).toBe('valid');
  expect(m.validPattern('(')).toBe('invalid');
  expect(() => new RegExp('(')).toThrow();
});

it('matches the whole string, or not at all', () => {
  for (const s of ['123', '12a', '', 'a12']) {
    expect(m.isDigits(s)).toBe(/^(?:\d+)$/.test(s));
  }
});

it('finds, lists, tests, replaces and splits as RegExp does', () => {
  const text = 'hi @ada and @grace';
  expect(m.firstHandle(text)).toBe(/@(\w+)/.exec(text)?.[1]);
  expect(m.firstHandle('nobody')).toBeUndefined();
  expect(m.handles(text)).toEqual([...text.matchAll(/@(\w+)/g)].map((x) => x[1]));
  expect(m.hasNumber('room 7')).toBe(/[0-9]/.test('room 7'));
  expect(m.hasNumber('room')).toBe(false);
  expect(m.squeezed('a  b \t c')).toBe('a  b \t c'.replace(/\s+/g, ' '));
  expect(m.fields('a , b,c')).toEqual('a , b,c'.split(/\s*,\s*/));
});

it('gives none for a group that did not take part', () => {
  const js = /(a)|(b)/.exec('b');
  expect(js?.[1]).toBeUndefined();
  expect(m.optionalGroups('b')).toEqual(['b', undefined, 'b', undefined]);
  expect(m.optionalGroups('a')).toEqual(['a', 'a', undefined, undefined]);
});
