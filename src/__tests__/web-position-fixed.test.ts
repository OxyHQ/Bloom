import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { WEB_POSITION_FIXED, WEB_POSITION_STICKY } from '../styles/web-view-style';

/**
 * `position: fixed` is web-only CSS that React Native's `ViewStyle` does not
 * model, so every web fork used to assert it inline. Thirteen sites spelled it
 * `position: 'fixed' as 'absolute'` — not a widening but an outright FALSE
 * assertion to the compiler (the value is not `'absolute'`), which would survive
 * a rename and reads as if the style were absolute. One more used
 * `as ViewStyle['position']`.
 *
 * They now all import `WEB_POSITION_FIXED`, whose single documented cast lives in
 * `styles/web-view-style.ts`. This guard stops the inline spellings coming back.
 *
 * `WEB_POSITION_STICKY` is the same gap for `'sticky'` (a surface that pins
 * itself within its own scroll container, e.g. `rail/Rail.tsx`, rather than to
 * the viewport). It lives in the same module for the same reason, so the "only
 * cast" count below is two now — one per constant — and stays an EQUALITY
 * rather than a widened threshold: a third inline cast anywhere else in `src/`
 * is still exactly what this file exists to catch.
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

const files = sourceFiles(SRC);

describe('web position: fixed', () => {
  it('resolves to the CSS value at runtime', () => {
    expect(WEB_POSITION_FIXED).toBe('fixed');
    expect(WEB_POSITION_STICKY).toBe('sticky');
  });

  it('finds source files to scan (guards against a broken walk)', () => {
    expect(files.length).toBeGreaterThan(100);
  });

  it.each([
    ["position: 'fixed' as 'absolute'", /position:\s*'fixed'\s+as\s+'absolute'/],
    ["position: 'fixed' as ViewStyle['position']", /position:\s*'fixed'\s+as\s+ViewStyle/],
    ['a bare position: fixed literal', /position:\s*'fixed'\s*,/],
  ])('has no %s left in src', (_label, pattern) => {
    const offenders = files.filter((file) => {
      const source = readFileSync(file, 'utf8')
        // Comments may still discuss the retired spelling.
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '');
      return pattern.test(source);
    });
    expect(offenders.map((f) => f.replace(`${SRC}/`, ''))).toEqual([]);
  });

  it('keeps only the documented casts inside styles/web-view-style.ts', () => {
    const module = readFileSync(join(SRC, 'styles/web-view-style.ts'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '');
    // One per crossing (`WEB_POSITION_FIXED`, `WEB_POSITION_STICKY`,
    // `WEB_VIEWPORT_HEIGHT`, `webViewportHeightMinus`, `WEB_OVERFLOW_CLIP`) — an
    // equality, not a floor, so one more inline cast anywhere is still caught.
    expect(module.match(/ as /g)).toHaveLength(5);
  });

  it('is imported by every fork that positions something fixed', () => {
    const importers = files.filter((file) =>
      readFileSync(file, 'utf8').includes('WEB_POSITION_FIXED'),
    );
    // The 9 consumers plus the module that defines it.
    //
    // This floor went from 11 to 10 when the four anchored families and the
    // select dropdown stopped positioning themselves and started rendering
    // `floating/FloatingPanel`. That is a CONSOLIDATION, not an erosion — one
    // importer now does the positioning that four used to — which is why the
    // decrement comes with the assertion below rather than on its own. A floor
    // that only ever ratchets down is a gate switching itself off.
    expect(importers.length).toBeGreaterThanOrEqual(10);
    expect(importers.map((f) => f.replace(`${SRC}/`, ''))).toContain(
      'floating/FloatingPanel.tsx',
    );
  });
});
