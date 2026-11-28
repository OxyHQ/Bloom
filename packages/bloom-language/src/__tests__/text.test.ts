/**
 * Strings in user-perceived characters: the segmenter Hermes uses (UAX #29 over the generated
 * break table) gives the boundaries `Intl.Segmenter` gives, on emoji ZWJ sequences, skin tones,
 * flags, combining marks, Hangul and CR LF; and the table is what this Node's Unicode data says.
 */
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

import { GRAPHEME_UNICODE } from '../generated/graphemes.generated';
import {
  characterBoundaries,
  characterCount,
  characterOffset,
  characterSlice,
  characters,
  fallbackCharacterBoundaries,
  utf16Offset,
} from '../text';

// Node's (the package's TS lib predates `Intl.Segmenter`).
const { Segmenter } = Intl as unknown as {
  Segmenter: new (
    locale?: string,
    options?: { granularity: string },
  ) => { segment(s: string): Iterable<{ index: number }> };
};
const intl = new Segmenter(undefined, { granularity: 'grapheme' });
const reference = (s: string) => [...Array.from(intl.segment(s), (x) => x.index), s.length];

const SAMPLES = [
  '',
  'abc',
  'a\r\nb\rc\n',
  'café',
  'café naïve',
  'ẹ́̂x',
  '👍🏽👍',
  '👨‍👩‍👧‍👦 family',
  '🏳️‍🌈 flag',
  '🇪🇸🇫🇷🇯',
  '🇪🇸🇫',
  'a‍b',
  '❤️‍🔥',
  '한국어 각',
  'กำไทย',
  'नमस्ते',
  '؀123',
  '😀x😀',
  'x\u{e0067}\u{e0062}',
  '🏴\u{e0067}\u{e0062}\u{e0073}\u{e0063}\u{e0074}\u{e007f}',
  'tab\there\u0000end',
];

// Indic conjuncts (GB9c): a consonant, a virama and a consonant are one character.
const CONJUNCTS = [
  'नमस्ते',
  'क्षत्रिय',
  'स्त्री',
  'क्‍ष',
  'क््क',
  'ক্ষ বাংলা',
  'ક્ષ',
  'କ୍ଷ',
  'క్ష',
  'ക്ഷ',
  'क्a',
  'a्क',
  'क़्क',
  'क्ष्म्य',
];

it('segments as Intl.Segmenter does without it (Hermes)', () => {
  for (const s of [...SAMPLES, ...CONJUNCTS]) {
    expect([s, fallbackCharacterBoundaries(s)]).toEqual([s, reference(s)]);
  }
  expect(fallbackCharacterBoundaries('नमस्ते').length - 1).toBe(3);
});

it('agrees with Intl.Segmenter on every pair of a sample of code points', () => {
  const points = [
    0x41, 0x0d, 0x0a, 0x7f, 0xad, 0x300, 0x903, 0x600, 0x1100, 0x1161, 0x11a8, 0xac00, 0xac01,
    0x200c, 0x200d, 0x1f1e6, 0x1f600, 0x1f3fb, 0x2764, 0xfe0f, 0xe0020, 0x0e33, 0x915, 0x94d, 0x93c,
    0x995,
  ];
  for (const a of points)
    for (const b of points)
      for (const c of points) {
        const s = String.fromCodePoint(a, b, c);
        expect([s, fallbackCharacterBoundaries(s)]).toEqual([s, reference(s)]);
      }
});

it('counts, slices and converts offsets in characters', () => {
  expect(characterCount('👍🏽')).toBe(1);
  expect('👍🏽'.length).toBe(4);
  expect(characterCount('👨‍👩‍👧‍👦 family')).toBe(8);
  expect(characterCount('a\r\nb')).toBe(3);
  expect(characterCount('café')).toBe(4);
  expect(characters('a👍🏽é')).toEqual(['a', '👍🏽', 'é']);
  expect(characterSlice('a👍🏽bc', 1, 3)).toBe('👍🏽b');
  expect(characterSlice('a👍🏽bc', -2)).toBe('bc');
  expect(characterSlice('a👍🏽bc', 3, 1)).toBe('');
  expect(characterSlice('abc', 1)).toBe('bc');
  expect(utf16Offset('a👍🏽b', 2)).toBe(5);
  expect(utf16Offset('a👍🏽b', 9)).toBe(6);
  expect(characterOffset('a👍🏽b', 5)).toBe(2);
  // Inside a character, the prefix's part of it counts as one.
  expect(characterOffset('a👍🏽b', 3)).toBe(2);
  expect(characterBoundaries('a\r\n')).toEqual([0, 1, 3]);
});

// The table is of the Unicode version of the Node that wrote it: another Node may differ.
const sameUnicode = process.versions.unicode === GRAPHEME_UNICODE;

(sameUnicode ? it : it.skip)('has the break table this Node writes', () => {
  const script = join(__dirname, '../../scripts/generate-graphemes.mjs');
  expect(() =>
    execFileSync(process.execPath, [script, '--check'], { stdio: 'pipe' }),
  ).not.toThrow();
});
