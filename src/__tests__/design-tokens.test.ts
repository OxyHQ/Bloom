import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

import {
  getPresetVars,
  buildSeedScopeVars,
  FILL_ROLES,
  TEXT_ROLES,
  ACCENT_TEXT_ROLES,
  BORDER_ROLES,
  SPACING,
  RADIUS,
  BORDER_WIDTH,
  TYPOGRAPHY,
  FONT_FAMILY_VARS,
  SHADOW_BOX,
  bloomShadowStyle,
} from '../design-tokens';
import { borderRadius, space } from '../styles/tokens';
import { APP_COLOR_PRESETS } from '../theme/color-presets';
import { buildScopeVars } from '../theme/color-scope/style-builder';
import { CANONICAL_TOKENS } from '../theme/token-registry';

describe('design-tokens color roles', () => {
  const allRoles = { ...FILL_ROLES, ...TEXT_ROLES, ...ACCENT_TEXT_ROLES, ...BORDER_ROLES };

  it('every color role is a var(--canonical) reference (no hardcoded color)', () => {
    for (const [role, value] of Object.entries(allRoles)) {
      expect(value).toMatch(/^var\(--[a-z-]+\)$/);
      // Never wrap a base token in hsl() — bloom base tokens are full rgb colors.
      expect(value).not.toContain('hsl(');
    }
  });

  it('every color role aliases an existing canonical theme token', () => {
    for (const value of Object.values(allRoles)) {
      const token = value.replace(/^var\(--/, '').replace(/\)$/, '');
      expect(CANONICAL_TOKENS).toContain(token as never);
    }
  });

  it('keeps decorative accent text separate from semantic status text', () => {
    expect(ACCENT_TEXT_ROLES).toEqual({
      'accent-primary': 'var(--primary-text)',
      'accent-secondary': 'var(--secondary-text)',
      'accent-tertiary': 'var(--tertiary-text)',
    });
    expect(Object.keys(ACCENT_TEXT_ROLES)).not.toContain('success-text');
    expect(Object.keys(ACCENT_TEXT_ROLES)).not.toContain('warning-text');
  });
});

describe('design-tokens numeric scales', () => {
  it('exposes the spec spacing scale + screen-margin', () => {
    expect(SPACING).toMatchObject({
      'space-2': 2,
      'space-4': 4,
      'space-8': 8,
      'space-12': 12,
      'space-16': 16,
      'space-20': 20,
      'space-24': 24,
      'space-32': 32,
      'screen-margin': 20,
    });
  });

  it('exposes the spec radius scale', () => {
    expect(RADIUS).toMatchObject({
      'radius-8': 8,
      'radius-12': 12,
      'radius-20': 20,
      'radius-28': 28,
      'radius-max': 9999,
    });
  });

  it('exposes the 0.5px hairline border width', () => {
    expect(BORDER_WIDTH.hairline).toBe(0.5);
  });

  // The two vocabularies USED to be two declarations of the same physical scale,
  // and they disagreed: `borderRadius.full` was 999 against `radius-max` 9999,
  // `borderRadius` carried a 16 rung `RADIUS` did not and `RADIUS` a 28 rung
  // `borderRadius` did not. Nothing could see it — each rung is individually
  // valid, and a component reading the wrong spelling just draws a slightly
  // different corner. `styles/tokens.ts` now reads these by reference, so this
  // fails the moment somebody writes a number down a second time or adds a rung
  // in one spelling only.
  //
  // Compared as VALUE SETS rather than key-by-key on purpose: the two key
  // vocabularies are deliberately different (`space-12` vs `md`), and `SPACING`
  // carries `screen-margin` as a second name for the 20 rung, so a key-wise
  // comparison would have to encode the mapping it is trying to check.
  it('the t-shirt view covers exactly the authority scale, with no second copy of a number', () => {
    const values = (o: Record<string, number>): number[] =>
      [...new Set(Object.values(o))].sort((a, b) => a - b);

    expect(values(space)).toEqual(values(SPACING));
    expect(values(borderRadius)).toEqual(values(RADIUS));

    // Vacuity floor: two empty scales also compare equal.
    expect(values(SPACING).length).toBeGreaterThanOrEqual(10);
    expect(values(RADIUS).length).toBeGreaterThanOrEqual(9);
  });
});

describe('design-tokens typography', () => {
  it('covers every spec type role', () => {
    const names = Object.keys(TYPOGRAPHY).sort();
    expect(names).toEqual(
      [
        'body',
        'bodySmall',
        'bodyTitleSmall',
        'buttonLarge',
        'caption',
        'headerBold',
        'sectionTitle',
        'subtitle',
      ].sort(),
    );
  });

  it('each role has a valid size/lineHeight/weight/family', () => {
    for (const role of Object.values(TYPOGRAPHY)) {
      expect(role.size).toBeGreaterThan(0);
      expect(role.lineHeight).toBeGreaterThanOrEqual(role.size);
      expect(['400', '500', '600', '700']).toContain(role.weight);
      expect(FONT_FAMILY_VARS[role.family]).toBeDefined();
    }
  });
});

describe('design-tokens shadow style (web default)', () => {
  it('returns a boxShadow style on the web/default fork', () => {
    const style = bloomShadowStyle('m');
    expect(style).toHaveProperty('boxShadow', SHADOW_BOX.m);
  });
});

describe('design-tokens resolved token values', () => {
  it('getPresetVars resolves a preset to canonical tokens only', () => {
    const vars = getPresetVars('oxy', 'dark');
    expect(vars['--background']).toMatch(/^rgb/);
    // A document root needs the canonical tokens alone — the `--color-x` alias
    // layer comes from theme.css / bloomThemeCss().
    expect(Object.keys(vars).some((k) => k.startsWith('--color-'))).toBe(false);
  });

  it("a preset's own seed reproduces that preset exactly", () => {
    // What lets a consumer theme a brand scope and the document root through one
    // code path: the seed form is not an approximation of the preset form.
    // A derived preset: `oxy` carries a drawn brand scheme instead.
    const preset = APP_COLOR_PRESETS.purple;
    for (const mode of ['light', 'dark'] as const) {
      const fromPreset = getPresetVars('purple', mode);
      const fromSeed = buildSeedScopeVars({
        seed: preset.hex,
        mode,
        variant: preset.variant,
      });
      for (const [token, value] of Object.entries(fromPreset)) {
        expect(fromSeed[token]).toBe(value);
      }
    }
  });
});

describe('design-tokens entry stays free of react / react-native', () => {
  /* Build scripts import this entry from plain node/bun to emit a static theme
   * stylesheet (see the export's doc comment). A `react-native` import anywhere
   * in its transitive graph makes that throw at import time — in the CONSUMER's
   * build, with a parse error inside node_modules and nothing pointing back
   * here. Jest cannot catch it by importing the module: this suite runs in the
   * RN preset, where both packages resolve. So walk the graph statically. */
  const SOURCE_ROOT = join(__dirname, '..');
  /* Captures the clause of every `import`/`export … from '…'`, so a type-only
   * one can be told apart from a value one. `import { type ViewStyle } from
   * 'react-native'` is erased by the compiler and is FINE here; a value import
   * of the same module is not. A scanner blind to the difference reports the
   * shipped `shadows.ts` as a violation. */
  const IMPORT_RE = /(?:import|export)\s+([\s\S]*?)\s*from\s*['"]([^'"]+)['"]/g;

  function isValueImport(clause: string): boolean {
    const trimmed = clause.trim();
    if (trimmed.startsWith('type ') || trimmed === 'type') return false;
    const named = /^\{([\s\S]*)\}$/.exec(trimmed)?.[1];
    if (named === undefined) return true; // default or namespace import — always a value
    return named
      .split(',')
      .map((specifier) => specifier.trim())
      .filter(Boolean)
      .some((specifier) => !specifier.startsWith('type '));
  }

  function resolve(specifier: string, fromFile: string): string | null {
    const base = join(dirname(fromFile), specifier);
    for (const candidate of [
      base,
      `${base}.ts`,
      `${base}.tsx`,
      join(base, 'index.ts'),
      join(base, 'index.tsx'),
    ]) {
      if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
    }
    return null;
  }

  const entry = join(SOURCE_ROOT, 'design-tokens', 'index.ts');
  const visited = new Set<string>();
  const offenders: string[] = [];
  const queue = [entry];

  for (let file = queue.pop(); file !== undefined; file = queue.pop()) {
    if (visited.has(file)) continue;
    visited.add(file);
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(IMPORT_RE)) {
      const [, clause = '', specifier = ''] = match;
      if (!isValueImport(clause)) continue;
      if (
        specifier === 'react' ||
        specifier === 'react-native' ||
        specifier.startsWith('react-native/')
      ) {
        offenders.push(`${relative(SOURCE_ROOT, file)} imports ${specifier}`);
        continue;
      }
      if (!specifier.startsWith('.')) continue;
      const resolved = resolve(specifier, file);
      if (resolved) queue.push(resolved);
    }
  }

  it('imports neither react nor react-native anywhere in its graph', () => {
    expect(offenders).toEqual([]);
  });

  it('actually walked the graph', () => {
    // Without a floor, a resolver that silently returns null for everything
    // would report a clean graph of one file.
    expect(visited.size).toBeGreaterThan(8);
  });
});
