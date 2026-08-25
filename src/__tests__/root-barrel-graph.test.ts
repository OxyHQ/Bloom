import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

/**
 * What the root barrel is allowed to LINK.
 *
 * Metro does not tree-shake, so `import { Button } from '@oxyhq/bloom'` links
 * every module this barrel can reach. A peer that only some apps install is
 * therefore a build failure for the rest — not a degradation, not a warning.
 * That is the whole reason `./tab-bar`, `./provider`,
 * `./zoomable-media-gallery` and `./media-flight` are subpath-only, and until
 * this gate existed the
 * reason was recorded nowhere: `src/index.ts` simply didn't mention them, which
 * reads identically to an oversight (and `image-resolver`, `scroll`, `overlay`
 * and four others WERE oversights).
 *
 * Only STATIC imports count. `theme/adaptive-colors.ts` names `expo-router`
 * inside a `require()` in a try block — Metro marks that dependency optional and
 * links nothing — so a scan that counted every specifier would report the
 * barrel as already linking expo-router and this gate would be unfalsifiable.
 */

const SRC = join(__dirname, '..');

/**
 * Packages that must stay OUT of the root barrel's static graph, each with the
 * subpath that owns it. Adding a family that reaches one of these to
 * `src/index.ts` is the mistake this catches.
 */
const FORBIDDEN: Record<string, string> = {
  'expo-glass-effect': '@oxyhq/bloom/tab-bar',
  'expo-symbols': '@oxyhq/bloom/tab-bar',
  'expo-router': '@oxyhq/bloom/provider (and ./scroll/expo-router)',
  // Reached from BOTH families: `media-flight/MediaSurface.tsx` is the one
  // renderer the gallery and the flight layer share, and it is what names
  // `expo-image`. Either subpath entering the root barrel re-links it.
  'expo-image': '@oxyhq/bloom/zoomable-media-gallery (and ./media-flight)',
  // The optional video peer. It is loaded through an optional `require`, which
  // this scan deliberately ignores — listed so the intent is recorded, and
  // caught here the day somebody turns it into a static import.
  'expo-video': '@oxyhq/bloom/media-flight',
};

/**
 * Positive control. If the walk breaks, "no forbidden package found" and "no
 * package found at all" are the same result — so a package the barrel
 * unambiguously DOES link must show up in the same measurement.
 */
const MUST_REACH = ['react-native-reanimated', 'react-native-svg', 'expo-blur'];

function resolveLocal(fromFile: string, spec: string): string | null {
  const base = resolve(dirname(fromFile), spec);
  for (const candidate of [
    base,
    `${base}.tsx`,
    `${base}.ts`,
    join(base, 'index.tsx'),
    join(base, 'index.ts'),
  ]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

/** Platform siblings Metro may select for a resolved file — all of them link. */
function platformSiblings(file: string): string[] {
  const match = file.match(/^(.*)\.tsx?$/);
  if (!match) return [file];
  const out = [file];
  for (const suffix of ['.native.ts', '.native.tsx', '.web.ts', '.web.tsx']) {
    const candidate = `${match[1]}${suffix}`;
    if (existsSync(candidate)) out.push(candidate);
  }
  return out;
}

/** STATIC specifiers only: `import … from 'x'` and `export … from 'x'`. */
function staticSpecifiers(text: string): string[] {
  const stripped = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const out: string[] = [];
  const re = /^\s*(?:import|export)\b[\s\S]*?from\s+['"]([^'"]+)['"]/gm;
  for (const match of stripped.matchAll(re)) {
    if (match[1] !== undefined) out.push(match[1]);
  }
  // Bare side-effect imports (`import 'x';`) link too.
  for (const match of stripped.matchAll(/^\s*import\s+['"]([^'"]+)['"]/gm)) {
    if (match[1] !== undefined) out.push(match[1]);
  }
  return out;
}

function walkFrom(entry: string): { files: Set<string>; packages: Map<string, string[]> } {
  const files = new Set<string>();
  const packages = new Map<string, string[]>();
  const queue = [entry];
  while (queue.length > 0) {
    const file = queue.pop() as string;
    if (files.has(file)) continue;
    files.add(file);
    let text: string;
    try {
      text = readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    for (const spec of staticSpecifiers(text)) {
      if (spec.startsWith('.')) {
        const resolved = resolveLocal(file, spec);
        if (resolved) queue.push(...platformSiblings(resolved));
        continue;
      }
      const segments = spec.split('/');
      const name = spec.startsWith('@') ? segments.slice(0, 2).join('/') : (segments[0] ?? spec);
      const via = packages.get(name) ?? [];
      via.push(relative(SRC, file));
      packages.set(name, via);
    }
  }
  return { files, packages };
}

const BARRELS = ['index.ts', 'index.web.ts'];

describe('root barrel module graph', () => {
  for (const barrel of BARRELS) {
    describe(`src/${barrel}`, () => {
      const { files, packages } = walkFrom(join(SRC, barrel));

      it('walks a real graph', () => {
        // Vacuity floors, in the same currency as the assertion below: a walk
        // that read nothing reports every forbidden package as absent.
        expect(files.size).toBeGreaterThanOrEqual(200);
        expect(packages.size).toBeGreaterThanOrEqual(5);
      });

      it('links the packages it unambiguously does link (positive control)', () => {
        const missing = MUST_REACH.filter((name) => !packages.has(name));
        expect(missing).toEqual([]);
      });

      it('does not statically link a subpath-only peer', () => {
        const offenders = Object.keys(FORBIDDEN)
          .filter((name) => packages.has(name))
          .map(
            (name) =>
              `${name} (owned by ${FORBIDDEN[name]}) reached via ${[...new Set(packages.get(name))].slice(0, 3).join(', ')}`,
          );
        expect(offenders).toEqual([]);
      });
    });
  }
});
