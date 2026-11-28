/**
 * Bloom's strings count user-perceived characters (extended grapheme clusters), as Swift's do:
 * `String.count`, `slice`, `firstIndex(of:)`, padding and a regex match's `start` are in
 * characters on every backend. `"👍🏽".count` is 1, where JS's `length` is 4 (`s.utf16.count`).
 *
 * Where the engine has `Intl.Segmenter` (V8, JavaScriptCore) it splits the string; elsewhere
 * (Hermes) UAX #29's rules run over the break classes of `generated/graphemes.generated.ts`
 * (GB3 to GB13; the Indic conjunct rule GB9c is not applied). A string of code units below
 * U+0300 with no CR LF is one character per unit, read without segmenting.
 */
import { GRAPHEME_BREAKS } from './generated/graphemes.generated';

type Segmenter = { segment(s: string): Iterable<{ segment: string; index: number }> };
const IntlWithSegmenter = Intl as unknown as {
  Segmenter?: new (locale?: string, options?: { granularity: string }) => Segmenter;
};
let segmenter: Segmenter | null | undefined;

function intlSegmenter(): Segmenter | null {
  if (segmenter === undefined) {
    segmenter = IntlWithSegmenter.Segmenter
      ? new IntlWithSegmenter.Segmenter(undefined, { granularity: 'grapheme' })
      : null;
  }
  return segmenter;
}

// Break classes (scripts/generate-graphemes.mjs).
const CR = 1;
const LF = 2;
const CONTROL = 3;
const EXTEND = 4;
const ZWJ = 5;
const RI = 6;
const PREPEND = 7;
const SPACING_MARK = 8;
const L = 9;
const V = 10;
const T = 11;
const LV = 12;
const LVT = 13;
const PICTOGRAPHIC = 14;

/** The break class of `cp` (0: Other), by binary search over the table's ranges. */
function classOf(cp: number): number {
  if (cp < 0x20) return cp === 0x0d ? CR : cp === 0x0a ? LF : CONTROL;
  if (cp < 0x7f) return 0;
  const table = GRAPHEME_BREAKS;
  let lo = 0;
  let hi = table.length / 3 - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const start = table[mid * 3] as number;
    if (cp < start) hi = mid - 1;
    else if (cp >= start + (table[mid * 3 + 1] as number)) lo = mid + 1;
    else return table[mid * 3 + 2] as number;
  }
  return 0;
}

/** The UTF-16 offsets where `s`'s characters start, then `s.length` (UAX #29, GB3 to GB13). */
function fallbackBoundaries(s: string): number[] {
  const out: number[] = [];
  let previous = -1;
  // GB11: an Extended_Pictographic, then Extend*, then the ZWJ just read.
  let pictographic = false;
  let zwjAfterPictographic = false;
  // GB12/13: how many Regional_Indicators run up to here.
  let indicators = 0;
  for (let i = 0; i < s.length; ) {
    const cp = s.codePointAt(i) as number;
    const c = classOf(cp);
    let joins = false;
    if (previous !== -1) {
      const p = previous;
      if (p === CR && c === LF) joins = true;
      else if (p === CR || p === LF || p === CONTROL || c === CR || c === LF || c === CONTROL)
        joins = false;
      else if (p === L && (c === L || c === V || c === LV || c === LVT)) joins = true;
      else if ((p === LV || p === V) && (c === V || c === T)) joins = true;
      else if ((p === LVT || p === T) && c === T) joins = true;
      else if (c === EXTEND || c === ZWJ || c === SPACING_MARK || p === PREPEND) joins = true;
      else if (c === PICTOGRAPHIC && zwjAfterPictographic) joins = true;
      else if (p === RI && c === RI) joins = indicators % 2 === 1;
    }
    if (!joins) out.push(i);
    zwjAfterPictographic = c === ZWJ && pictographic;
    if (c === PICTOGRAPHIC) pictographic = true;
    else if (c !== EXTEND && c !== ZWJ) pictographic = false;
    indicators = c === RI ? indicators + 1 : 0;
    previous = c;
    i += cp > 0xffff ? 2 : 1;
  }
  out.push(s.length);
  return out;
}

/** Whether `s` is one character per UTF-16 unit but for its CR LFs (nothing at or past U+0300). */
function simple(s: string): boolean {
  for (let i = 0; i < s.length; i++) if (s.charCodeAt(i) >= 0x300) return false;
  return true;
}

/** The UTF-16 offsets where `s`'s characters start, then `s.length`. */
export function characterBoundaries(s: string): number[] {
  if (simple(s)) {
    const out: number[] = [];
    for (let i = 0; i < s.length; i++) {
      if (!(i > 0 && s.charCodeAt(i) === 0x0a && s.charCodeAt(i - 1) === 0x0d)) out.push(i);
    }
    out.push(s.length);
    return out;
  }
  const intl = intlSegmenter();
  if (!intl) return fallbackBoundaries(s);
  const out = Array.from(intl.segment(s), (x) => x.index);
  out.push(s.length);
  return out;
}

/** `s`'s boundaries by UAX #29's rules alone (what Hermes uses): for tests. */
export function fallbackCharacterBoundaries(s: string): number[] {
  return fallbackBoundaries(s);
}

/** The user-perceived characters of `s`. */
export function characters(s: string): string[] {
  const at = characterBoundaries(s);
  const out: string[] = [];
  for (let i = 0; i + 1 < at.length; i++) out.push(s.slice(at[i], at[i + 1]));
  return out;
}

/** How many user-perceived characters `s` has (Swift's `String.count`). */
export function characterCount(s: string): number {
  if (simple(s)) {
    let pairs = 0;
    for (let i = s.indexOf('\r\n'); i !== -1; i = s.indexOf('\r\n', i + 2)) pairs++;
    return s.length - pairs;
  }
  return characterBoundaries(s).length - 1;
}

/** Character offset `n` of `s` as a UTF-16 offset (clamped to the ends). */
export function utf16Offset(s: string, n: number): number {
  if (n <= 0) return 0;
  if (simple(s) && !s.includes('\r\n')) return Math.min(n, s.length);
  const at = characterBoundaries(s);
  return at[Math.min(n, at.length - 1)] as number;
}

/** UTF-16 offset `u` of `s` as a character offset: the characters of `s.slice(0, u)`. */
export function characterOffset(s: string, u: number): number {
  if (u <= 0) return 0;
  if (simple(s) && !s.includes('\r\n')) return Math.min(u, s.length);
  const at = characterBoundaries(s);
  // A boundary is the index of the character it starts; inside a character, the prefix ends in
  // a part of it, which counts as one more.
  let lo = 0;
  let hi = at.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if ((at[mid] as number) <= u) lo = mid;
    else hi = mid - 1;
  }
  return at[lo] === u ? lo : characterCount(s.slice(0, u));
}

/** The characters of `s` from `start` up to `end` (JS's `slice`, in characters: a negative
 * offset counts from the end). */
export function characterSlice(s: string, start: number, end?: number): string {
  if (simple(s) && !s.includes('\r\n')) return s.slice(start, end);
  const at = characterBoundaries(s);
  const count = at.length - 1;
  const clamp = (n: number) => (n < 0 ? Math.max(count + n, 0) : Math.min(n, count));
  const from = clamp(start);
  const to = end === undefined ? count : clamp(end);
  return from >= to ? '' : s.slice(at[from], at[to]);
}
