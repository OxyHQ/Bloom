import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

/**
 * Every reanimated mapper in the tab bar must pass a NON-EMPTY dependency array.
 *
 * On web WITHOUT the react-native-worklets babel plugin — the production reality
 * for every Oxy RN-Web app — reanimated cannot auto-detect which shared values a
 * worklet reads, so it drives the mapper off its deps array instead. A missing or
 * empty array means the mapper runs ONCE and freezes at the first frame: the
 * shared values keep animating underneath, the DOM never updates. For this
 * component that means a bar that never minimizes, a highlight that never moves
 * and a scroll handler bound to the first render's state — with no error
 * anywhere. Native (plugin present) auto-tracks and ignores the extra deps, so
 * listing them is correct on both platforms.
 *
 * This is deliberately STRICTER than the repo-wide `animated-style-deps` guard,
 * which only checks that the values a mapper reads appear in the deps it
 * declares. Here every mapper must carry a real deps array whether or not the
 * regex can see a `.value` read inside it, and `useAnimatedScrollHandler` — which
 * the repo-wide guard does not scan at all — is included, because
 * `useMinimizeOnScroll` is the single entry point through which every screen
 * drives the bar.
 *
 * Jest cannot catch this class at all: the reanimated mock resolves mappers
 * synchronously, so a frozen mapper and a working one render identically. Source
 * analysis is the only automatable check; the real behaviour is verified in a
 * foregrounded browser tab.
 */

const SRC = join(__dirname, '..');
const ROOTS = ['tab-bar', 'progressive-blur'] as const;
const MAPPERS = [
  'useAnimatedStyle',
  'useAnimatedScrollHandler',
  'useDerivedValue',
  'useAnimatedProps',
] as const;

/**
 * Floors for the self-check, not exact counts — a new mapper or module must not
 * fail this suite, but a walk that silently stops finding things must.
 */
const MIN_FILES = 16;
const MIN_MAPPERS = 7;

type Offender = { location: string; mapper: string; problem: string };

/** Comments legitimately discuss mappers and show them in examples. */
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

function analyse(): { offenders: Offender[]; files: number; calls: number } {
  const offenders: Offender[] = [];
  const scanned = ROOTS.flatMap((root) => sourceFiles(join(SRC, root)));
  let calls = 0;

  for (const file of scanned) {
    const source = stripComments(readFileSync(file, 'utf8'));

    for (const mapper of MAPPERS) {
      // `\b` before the name so `useAnimatedStyleX` can never match.
      for (const call of source.matchAll(new RegExp(`\\b${mapper}\\s*\\(`, 'g'))) {
        if (call.index === undefined) continue;
        calls += 1;

        const text = callText(source, call.index);
        const line = source.slice(0, call.index).split('\n').length;
        const location = `${relative(SRC, file)}:${line}`;

        // Trailing comma after the deps array is idiomatic and must parse.
        const deps = [...text.matchAll(/,\s*(\[[\s\S]*?\])\s*,?\s*$/g)].pop();
        if (!deps) {
          offenders.push({ location, mapper, problem: 'no deps array' });
          continue;
        }
        if ((deps[1] ?? '').replace(/\s/g, '') === '[]') {
          offenders.push({ location, mapper, problem: 'empty deps array' });
        }
      }
    }
  }

  return { offenders, files: scanned.length, calls };
}

const { offenders, files, calls } = analyse();

describe('tab-bar reanimated mapper dependency arrays', () => {
  it('walked a plausible number of source files (guards against a broken walk)', () => {
    expect(files).toBeGreaterThanOrEqual(MIN_FILES);
  });

  it('found a plausible number of mapper call sites (guards against a vacuous pass)', () => {
    // Without this, a broken regex would make the real assertion below pass by
    // finding nothing at all.
    expect(calls).toBeGreaterThanOrEqual(MIN_MAPPERS);
  });

  it('has no mapper with a missing or empty deps array', () => {
    expect(offenders.map((o) => `${o.location} ${o.mapper} — ${o.problem}`)).toEqual([]);
  });
});
