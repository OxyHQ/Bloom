/**
 * The TS runtime against the regex conformance corpus (`conformance/regex/`, recorded from Node's
 * `RegExp` by `record.mjs`): every match, group, whole match, replacement and split as ECMAScript
 * gives them, and each match's `start` in characters (`startGraphemes`), the unit of
 * `String.count` on every backend. A case it cannot match is listed, with why, in
 * `known-differences.ts.json` beside the corpus.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  regexError,
  regexMatches,
  regexReplace,
  regexSplit,
  regexWhole,
} from '../stdlib/Bloom/runtime';

type Case = { pattern: string; flags: string; text: string };
type Expected = Case & {
  error: boolean;
  matches?: { text: string; startGraphemes: number; groups: (string | null)[]; named: object }[];
  whole?: string | null;
  replaced?: string;
  split?: (string | null)[];
};

const dir = join(__dirname, '../conformance/regex');
const { replacement, results } = JSON.parse(readFileSync(join(dir, 'expected.json'), 'utf8')) as {
  replacement: string;
  results: Expected[];
};
const knownFile = join(dir, 'known-differences.ts.json');
const known: Case[] = existsSync(knownFile)
  ? JSON.parse(readFileSync(knownFile, 'utf8')).cases
  : [];
const same = (a: Case, b: Case) =>
  a.pattern === b.pattern && a.flags === b.flags && a.text === b.text;

const wellFormed = (value: unknown): unknown =>
  typeof value === 'string'
    ? (value as string & { toWellFormed(): string }).toWellFormed()
    : Array.isArray(value)
      ? value.map(wellFormed)
      : value && typeof value === 'object'
        ? Object.fromEntries(Object.entries(value).map(([k, v]) => [k, wellFormed(v)]))
        : value;

/** What the TS runtime answers for `c`, in expected.json's shape. */
function answer(c: Expected): unknown {
  const { pattern, flags, text } = c;
  if (regexError(pattern, flags) !== undefined) return { error: true };
  return wellFormed({
    error: false,
    matches: regexMatches(pattern, flags, text, 0).map((m) => ({
      text: m.text,
      startGraphemes: m.start,
      groups: m.groups.map((g) => g ?? null),
      named: m.named,
    })),
    whole: regexWhole(pattern, flags, text)?.text ?? null,
    replaced: regexReplace(pattern, flags, text, replacement),
    split: regexSplit(pattern, flags, text).map((s) => s ?? null),
  });
}

/** expected.json's case, without what the TS runtime does not answer (UTF-16 `start`). */
function reference(c: Expected): unknown {
  if (c.error) return { error: true };
  return {
    error: false,
    matches: (c.matches ?? []).map(({ text, startGraphemes, groups, named }) => ({
      text,
      startGraphemes,
      groups,
      named,
    })),
    whole: c.whole ?? null,
    replaced: c.replaced,
    split: c.split,
  };
}

it('answers every case of the corpus as recorded, offsets in characters', () => {
  const mismatched: string[] = [];
  for (const c of results) {
    const listed = known.some((k) => same(k, c));
    const matches = JSON.stringify(answer(c)) === JSON.stringify(reference(c));
    if (matches === listed)
      mismatched.push(
        `${listed ? 'listed but matches' : 'differs'}: ${JSON.stringify(c.pattern)} /${c.flags} on ${JSON.stringify(c.text)}`,
      );
  }
  expect(mismatched).toEqual([]);
  expect(results.length).toBeGreaterThan(50);
});

it('measures a match after emoji and combining marks in characters', () => {
  const [m] = regexMatches('@(\\w+)', '', '👍🏽 é @nate', 0);
  expect(m?.start).toBe(4);
  expect(m?.text).toBe('@nate');
});
