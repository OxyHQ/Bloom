import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Sibling of `web-position-fixed.test.ts`, guarding the OTHER half of the RN/RNW
 * type gap.
 *
 * Eleven sites across seven files carried an inline `{ … } as ViewStyle` to smuggle
 * web-only CSS (`animation`, `transition*`, `backdrop-filter`, `mask-image`,
 * `scrollbar-*`, `user-select`) past React Native's `ViewStyle`. That is not a
 * widening, it is SILENCING: `as` only requires the two types to be COMPARABLE, so
 * `{ animatoin: '…' } as ViewStyle` compiles and the typo ships as a style key
 * react-native-web drops on the floor.
 *
 * They now annotate with `WebCssStyle`, which restores excess-property checking
 * AND erases completely — unlike a widening helper function, an annotation emits
 * nothing, so the compiled output is the same as the cast's. Two of the eleven
 * needed no widening at all once checked against RN 0.83, which models
 * `boxShadow` and `cursor` on `ViewStyle` directly.
 *
 * This guard stops an inline cast coming back. It pins the FULL remaining set —
 * per file and per count — rather than an allowlist of filenames, so a new cast
 * inside an already-listed file fails too.
 */

const SRC = join(__dirname, '..');

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      return entry === '__tests__' ? [] : sourceFiles(full);
    }
    return /\.tsx?$/.test(entry) ? [full] : [];
  });
}

/** Source with comments stripped — they legitimately discuss the retired spelling. */
const codeOf = (file: string) =>
  readFileSync(file, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

const files = sourceFiles(SRC);

/**
 * The only `as ViewStyle` occurrences left in `src/`, and why each one is NOT a
 * web-CSS cast. Anything else is a regression.
 */
const ALLOWED: Record<string, { count: number; reason: string }> = {
  'styles/web-view-style.ts': {
    count: 1,
    reason:
      "`WEB_POSITION_FIXED` — a VALUE-level cast on a key RN does model, just with a narrower union. It is the one documented crossing point and cannot be an annotation, because `position: 'fixed'` has to be writable inside an ordinary style object.",
  },
  'skeleton/Skeleton.tsx': {
    count: 1,
    reason:
      '`(flattened as ViewStyle)?.width` narrows a `StyleSheet.flatten` result, which is legitimately `ViewStyle | TextStyle | ImageStyle`. Not a web-CSS cast.',
  },
};

describe('web-only CSS styles', () => {
  it('finds source files to scan (guards against a broken walk)', () => {
    expect(files.length).toBeGreaterThan(100);
  });

  it('has no inline `as ViewStyle` outside the two documented exceptions', () => {
    const found: Record<string, number> = {};
    for (const file of files) {
      const hits = codeOf(file).match(/\bas ViewStyle\b/g);
      if (hits) {
        found[file.replace(`${SRC}/`, '')] = hits.length;
      }
    }
    const expected = Object.fromEntries(
      Object.entries(ALLOWED).map(([file, { count }]) => [file, count]),
    );
    expect(found).toEqual(expected);
  });

  /**
   * The properties `WebCssStyle` exists for. If one of these shows up in source
   * next to a cast again, the test above catches it; this one catches the subtler
   * regression of re-declaring the same widening locally instead of importing it.
   */
  it('declares every web-only property in one place', () => {
    const module = codeOf(join(SRC, 'styles/web-view-style.ts'));
    for (const property of [
      'animation',
      'animationDelay',
      'transitionProperty',
      'transitionDuration',
      'transitionTimingFunction',
      'backdropFilter',
      'WebkitBackdropFilter',
      'maskImage',
      'WebkitMaskImage',
      'backgroundImage',
      'scrollbarWidth',
      'scrollbarColor',
      'userSelect',
    ]) {
      expect(module).toContain(`${property}?:`);
    }
  });

  it('is a type-only import everywhere it is used, so nothing is emitted', () => {
    const importers = files.filter(
      (file) =>
        file !== join(SRC, 'styles/web-view-style.ts') &&
        codeOf(file).includes('WebCssStyle'),
    );
    // The seven forks the sweep converted.
    expect(importers.length).toBeGreaterThanOrEqual(7);
    for (const file of importers) {
      const source = codeOf(file);
      // Either `import type { WebCssStyle }` or an inline `type` specifier.
      expect({
        file: file.replace(`${SRC}/`, ''),
        typeOnly:
          /import type \{[^}]*\bWebCssStyle\b/.test(source) ||
          /\btype WebCssStyle\b/.test(source),
      }).toEqual({ file: file.replace(`${SRC}/`, ''), typeOnly: true });
    }
  });

  /**
   * RN 0.83 models these on `ViewStyle` itself, so widening them would be cargo
   * cult. Pinned because getting it wrong is invisible: the cast compiles either
   * way and only the reader is misled.
   */
  it('does not widen properties React Native already models', () => {
    const module = codeOf(join(SRC, 'styles/web-view-style.ts'));
    for (const property of ['cursor', 'boxShadow', 'filter', 'pointerEvents']) {
      expect(module).not.toContain(`${property}?:`);
    }
  });
});
