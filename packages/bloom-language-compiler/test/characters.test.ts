/**
 * Strings in user-perceived characters, Swift's model on every backend: `count`, `slice`,
 * `firstIndex(of:)`, padding and a regex match's `start` count characters (emoji with skin tones,
 * ZWJ families, flags, combining marks), and `s.utf16` is JS's UTF-16 units.
 */

// A module, so its names are its own (tsc checks the tests together).
export {};

// Required, not imported: see bloom.cost.test.tsx.
const m = require('./packages/format-app/Sources/App/Characters.bloom') as {
  charCount: (s: string) => number;
  utf16Count: (s: string) => number;
  charSlice: (s: string, a: number, b: number) => string;
  utf16Slice: (s: string, a: number, b: number) => string;
  charIndex: (s: string, sub: string) => number | undefined;
  charLastIndex: (s: string, sub: string) => number | undefined;
  utf16Index: (s: string, sub: string) => number | undefined;
  charPadded: (s: string, n: number) => string;
  utf16Padded: (s: string, n: number) => string;
  optionalCount: (s: string | undefined) => number | undefined;
  handleAt: (s: string) => string[];
};

const family = '👨‍👩‍👧‍👦';

it('counts characters, and UTF-16 units through utf16', () => {
  expect(m.charCount('👍🏽')).toBe(1);
  expect(m.utf16Count('👍🏽')).toBe(4);
  expect(m.charCount(`${family}🇪🇸é`)).toBe(3);
  expect(m.charCount('a\r\nb')).toBe(3);
  expect(m.charCount('plain ascii')).toBe(11);
  expect(m.optionalCount('👍🏽x')).toBe(2);
  expect(m.optionalCount(undefined)).toBeUndefined();
});

it('slices and indexes in characters', () => {
  const s = `a${family}b👍🏽c`;
  expect(m.charSlice(s, 1, 3)).toBe(`${family}b`);
  expect(m.utf16Slice('👍🏽x', 4, 5)).toBe('x');
  expect(m.charIndex(s, 'b')).toBe(2);
  expect(m.charLastIndex(`${s}b`, 'b')).toBe(5);
  expect(m.charIndex(s, 'z')).toBeUndefined();
  expect(m.utf16Index(s, 'b')).toBe(1 + family.length);
});

it('pads to a length in characters, or in units through utf16', () => {
  expect(m.charPadded('👍🏽', 3)).toBe('··👍🏽');
  expect(m.utf16Padded('👍🏽', 6)).toBe('👍🏽--');
});

it('starts a regex match at a character offset that slices the string', () => {
  expect(m.handleAt(`${family} é @nate!`)).toEqual(['4', '9', '@nate']);
});
