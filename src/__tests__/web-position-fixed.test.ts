import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { WEB_POSITION_FIXED } from '../styles/web-view-style';

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

  it('keeps the only cast inside styles/web-view-style.ts', () => {
    const module = readFileSync(join(SRC, 'styles/web-view-style.ts'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '');
    expect(module.match(/ as /g)).toHaveLength(1);
  });

  it('is imported by every fork that positions something fixed', () => {
    const importers = files.filter((file) =>
      readFileSync(file, 'utf8').includes('WEB_POSITION_FIXED'),
    );
    // The 10 consumers plus the module that defines it.
    expect(importers.length).toBeGreaterThanOrEqual(11);
  });
});
