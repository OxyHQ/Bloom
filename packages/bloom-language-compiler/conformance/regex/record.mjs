// Records what the TypeScript runtime (`stdlib/Bloom/runtime.ts`: `RegExp`, ECMAScript's
// regular expressions) answers for every case of cases.json, into expected.json: the reference
// the native runtimes' regex conformance tests compare against.
//
//   node --no-warnings conformance/regex/record.mjs
//
// A match's `start` is a UTF-16 offset, as JS counts; `startGraphemes` is the same offset in
// user-perceived characters (`Intl.Segmenter`), which is what Bloom's strings count. A lone
// surrogate (JS's `.` without `u` on an emoji) is recorded as U+FFFD: Swift's strings are
// well-formed, and JSON readers refuse one.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const rt = await import(pathToFileURL(join(here, '../../stdlib/Bloom/runtime.ts')).href);
const { cases, replacement } = JSON.parse(readFileSync(join(here, 'cases.json'), 'utf8'));
const graphemes = (s) =>
  [...new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(s)].length;

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
  const matches = rt.regexMatches(pattern, flags, text, 0).map((m) => ({
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
