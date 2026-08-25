import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

/**
 * Every shared value a Reanimated mapper READS must appear in that mapper's
 * dependency array.
 *
 * On web WITHOUT the react-native-worklets babel plugin — the production reality
 * for every Oxy RN-Web app — reanimated cannot auto-detect which shared values a
 * worklet reads, so it drives the mapper off its deps array instead. With a
 * missing or incomplete array the mapper runs ONCE and freezes at the first frame:
 * the shared value keeps animating underneath, the DOM never updates. Native (with
 * the plugin) auto-tracks and ignores the extra deps, so listing them is correct on
 * both platforms.
 *
 * This has bitten Bloom three times — `BottomSheetBase` (fixed), `ConnectionDots` /
 * `AnimatedCheck` (fixed), and `ZoomableMediaGallery` (fixed in 0.51.0, found by
 * static analysis because it had no story). Hence a guard rather than vigilance.
 *
 * jest cannot catch this class at all: the reanimated test mock resolves animations
 * synchronously, so a frozen mapper and a working one look identical. Source
 * analysis is the only automatable check; the real behaviour is verified in a
 * foregrounded browser.
 */

const SRC = join(__dirname, '..');
const MAPPERS = ['useAnimatedStyle', 'useDerivedValue', 'useAnimatedProps'] as const;

/**
 * Mappers that legitimately omit a read from their deps.
 *
 * Keyed by FILE, not line, so an unrelated edit above them doesn't invalidate the
 * entry — and with an exact count, so a NEW offender in the same file still fails.
 */
const ALLOWED: Array<{ file: string; count: number; reason: string }> = [
  {
    file: 'dialog/Dialog.tsx',
    count: 1,
    reason:
      'Native-only fork: web resolves Dialog.web.tsx (see dialog/index.web.ts), ' +
      'and on native the worklets plugin auto-tracks reads, so the deps array is ' +
      'not what drives these mappers. Harmless where this file actually runs.',
  },
];

type Offender = {
  location: string;
  mapper: string;
  problem: 'no deps array' | 'incomplete deps';
  values: string[];
};

/** Comments may legitimately discuss a mapper or show one in an example. */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (block) => '\n'.repeat((block.match(/\n/g) ?? []).length))
    .replace(/^[ \t]*\/\/.*$/gm, '');
}

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      return entry === '__tests__' ? [] : sourceFiles(full);
    }
    return /\.tsx?$/.test(entry) ? [full] : [];
  });
}

/**
 * A mapper's deps array: the LAST bracket group in the call text, matched by
 * depth from its closing `]`.
 *
 * Deliberately not a regex. The obvious `/,\s*(\[[\s\S]*?\])\s*,?\s*$/` anchors
 * on the FIRST comma followed by a bracket, which in any mapper carrying an
 * inline range — `interpolate(progress.value, [0, 1], [a, b])`, i.e. most of
 * them — is the range and not the deps. That swallows the rest of the call into
 * the "declared" text (so every name in the body counts as declared) and cuts
 * the reads after it out of the scanned body, leaving the check vacuous exactly
 * where mappers are most complex. It matched `[]` in a mapper's own deps as
 * `[0, 1], …, []` too, so even an empty array read as declared.
 */
function trailingDeps(text: string): { index: number; text: string } | null {
  const trimmed = text.replace(/[\s,]+$/, '');
  if (!trimmed.endsWith(']')) return null;
  let depth = 0;
  for (let i = trimmed.length - 1; i >= 0; i -= 1) {
    if (trimmed[i] === ']') depth += 1;
    else if (trimmed[i] === '[') {
      depth -= 1;
      if (depth === 0) return { index: i, text: trimmed.slice(i) };
    }
  }
  return null;
}

/** Text between the parens of the call starting at `start`, paren-balanced. */
function callText(source: string, start: number): string {
  const open = source.indexOf('(', start);
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === '(') depth += 1;
    else if (source[i] === ')') {
      depth -= 1;
      if (depth === 0) return source.slice(open + 1, i);
    }
  }
  return source.slice(open + 1);
}

function analyse(): { offenders: Offender[]; scanned: number } {
  const offenders: Offender[] = [];
  let scanned = 0;

  for (const file of sourceFiles(SRC)) {
    const source = stripComments(readFileSync(file, 'utf8'));

    for (const mapper of MAPPERS) {
      const calls = source.matchAll(new RegExp(`${mapper}\\s*\\(`, 'g'));
      for (const call of calls) {
        if (call.index === undefined) continue;
        scanned += 1;

        const text = callText(source, call.index);
        const line = source.slice(0, call.index).split('\n').length;
        const location = `${relative(SRC, file)}:${line}`;

        // A trailing comma after the deps array is idiomatic and must parse.
        const deps = trailingDeps(text);
        const body = deps ? text.slice(0, deps.index) : text;
        const reads = [
          ...new Set([...body.matchAll(/\b([A-Za-z_$][\w$]*)\.value\b/g)].map((m) => m[1] ?? '')),
        ].filter(Boolean);

        if (reads.length === 0) continue;

        if (!deps) {
          offenders.push({ location, mapper, problem: 'no deps array', values: reads });
          continue;
        }
        const missing = reads.filter((read) => !new RegExp(`\\b${read}\\b`).test(deps.text));
        if (missing.length > 0) {
          offenders.push({ location, mapper, problem: 'incomplete deps', values: missing });
        }
      }
    }
  }
  return { offenders, scanned };
}

const { offenders, scanned } = analyse();

describe('reanimated mapper dependency arrays', () => {
  it('scanned a plausible number of mappers (guards against a broken walk)', () => {
    // If the traversal or the regex breaks, this fails instead of passing vacuously.
    expect(scanned).toBeGreaterThanOrEqual(15);
  });

  it('has no mapper reading a shared value that is absent from its deps', () => {
    const unexpected = offenders.filter(
      (o) => !ALLOWED.some((entry) => o.location.startsWith(`${entry.file}:`)),
    );
    expect(
      unexpected.map((o) => `${o.location} ${o.mapper} — ${o.problem}: ${o.values.join(', ')}`),
    ).toEqual([]);
  });

  it.each(ALLOWED)('allowlisted $file has exactly $count known mapper(s)', ({ file, count }) => {
    // A NEW offender in an allowlisted file must still fail.
    expect(offenders.filter((o) => o.location.startsWith(`${file}:`))).toHaveLength(count);
  });

  it('keeps the allowlist small enough to be reviewable', () => {
    // If this grows, that is a finding about the repo — not something to encode.
    expect(ALLOWED.length).toBeLessThanOrEqual(3);
    for (const entry of ALLOWED) {
      expect(entry.reason.length).toBeGreaterThan(40);
    }
  });
});
