// Records ECMAScript's answers (Node's `RegExp`, which the TypeScript runtime's regex functions
// in `stdlib/Bloom/runtime.ts` wrap) for every case of cases.json, into expected.json: the
// reference every runtime's regex conformance test compares against (the TS runtime's is
// `test/regex-conformance.test.ts`).
//
//   node --no-warnings conformance/regex/record.mjs
//
// A match's `start` is a UTF-16 offset, as JS counts; `startGraphemes` is the same offset in
// user-perceived characters (`Intl.Segmenter`), which is what Bloom's strings count and what
// `RegexMatch.start` is on every backend. A lone surrogate (JS's `.` without `u` on an emoji) is
// recorded as U+FFFD: Swift's strings are well-formed, and JSON readers refuse one.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const { cases, replacement } = JSON.parse(readFileSync(join(here, 'cases.json'), 'utf8'));
const graphemes = (s) =>
  [...new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(s)].length;

// What the runtime's `regexError`, `regexMatches`, `regexWhole`, `regexReplace` and `regexSplit`
// do, over UTF-16 offsets.
const rt = {
  regexError(pattern, flags) {
    try {
      new RegExp(pattern, flags);
      return undefined;
    } catch (error) {
      return String(error);
    }
  },
  global: (pattern, flags) => new RegExp(pattern, flags.includes('g') ? flags : `${flags}g`),
  matchOf(m) {
    const named = {};
    for (const [name, value] of Object.entries(m.groups ?? {}))
      if (value !== undefined) named[name] = value;
    return { text: m[0], start: m.index ?? 0, groups: m.slice(1), named };
  },
  regexMatches(pattern, flags, s) {
    return [...s.matchAll(rt.global(pattern, flags))].map(rt.matchOf);
  },
  regexWhole(pattern, flags, s) {
    const m = new RegExp(`^(?:${pattern})$`, flags.replace(/[gmy]/g, '')).exec(s);
    return m ? rt.matchOf(m) : undefined;
  },
  regexReplace: (pattern, flags, s, replacement) =>
    s.replace(rt.global(pattern, flags), replacement),
  regexSplit: (pattern, flags, s) => s.split(new RegExp(pattern, flags.replace('g', ''))),
};

const wellFormed = (value) =>
  typeof value === 'string'
    ? value.toWellFormed()
    : Array.isArray(value)
      ? value.map(wellFormed)
      : value && typeof value === 'object'
        ? Object.fromEntries(Object.entries(value).map(([k, v]) => [k, wellFormed(v)]))
        : value;

const results = cases.map(({ pattern, flags, text }) => {
  const error = rt.regexError(pattern, flags) ?? null;
  if (error !== null) return { pattern, flags, text, error: true };
  const matches = rt.regexMatches(pattern, flags, text).map((m) => ({
    text: m.text,
    start: m.start,
    startGraphemes: graphemes(text.slice(0, m.start)),
    groups: m.groups.map((g) => g ?? null),
    named: m.named,
  }));
  const whole = rt.regexWhole(pattern, flags, text);
  return {
    pattern,
    flags,
    text,
    error: false,
    matches,
    whole: whole ? whole.text : null,
    replaced: rt.regexReplace(pattern, flags, text, replacement),
    split: rt.regexSplit(pattern, flags, text),
  };
});
writeFileSync(
  join(here, 'expected.json'),
  `${JSON.stringify({ node: process.versions.node, v8: process.versions.v8, replacement, results: wellFormed(results) }, null, 2)}\n`,
);
console.log(`record.mjs: ${results.length} cases`);
