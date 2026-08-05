import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

import {
  bloomTailwindPreset,
  bloomThemeCss,
  bloomThemeBlock,
  getPresetVars,
  buildSeedScopeVars,
  FILL_ROLES,
  TEXT_ROLES,
  BORDER_ROLES,
  SPACING,
  RADIUS,
  BORDER_WIDTH,
  TYPOGRAPHY,
  FONT_FAMILY_VARS,
  SHADOW_BOX,
  bloomShadowStyle,
} from '../design-tokens';
import { APP_COLOR_PRESETS } from '../theme/color-presets';
import { buildScopeVars } from '../theme/color-scope/style-builder';
import { CANONICAL_TOKENS } from '../theme/token-registry';

describe('design-tokens color roles', () => {
  const allRoles = { ...FILL_ROLES, ...TEXT_ROLES, ...BORDER_ROLES };

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

describe('design-tokens Tailwind preset', () => {
  const ext = bloomTailwindPreset.theme.extend;

  it('only extends theme (additive, no top-level theme override)', () => {
    expect(Object.keys(bloomTailwindPreset)).toEqual(['theme']);
    expect(Object.keys(bloomTailwindPreset.theme)).toEqual(['extend']);
  });

  it('color roles reach background/text/border buckets', () => {
    expect(ext.backgroundColor['fill']).toBe('var(--card)');
    expect(ext.textColor['text-tertiary']).toBe('var(--muted-foreground)');
    expect(ext.borderColor['border-input-active']).toBe('var(--ring)');
  });

  it('spacing/radius are emitted in px', () => {
    expect(ext.spacing['space-8']).toBe('8px');
    expect(ext.spacing['screen-margin']).toBe('20px');
    expect(ext.borderRadius['radius-20']).toBe('20px');
    expect(ext.borderWidth['hairline']).toBe('0.5px');
  });

  it('fontSize entries are [size, { lineHeight }] tuples', () => {
    expect(ext.fontSize['body']).toEqual(['15px', { lineHeight: '22px' }]);
    expect(ext.fontSize['headerBold']).toEqual(['28px', { lineHeight: '34px' }]);
  });

  it('fontFamily entries are [family, { fontWeight }] tuples', () => {
    expect(ext.fontFamily['body']).toEqual([
      'var(--bloom-font-sans)',
      { fontWeight: '400' },
    ]);
    expect(ext.fontFamily['headerBold']).toEqual([
      'var(--bloom-font-display)',
      { fontWeight: '700' },
    ]);
  });

  it('registers shadow-s and shadow-m box shadows', () => {
    expect(ext.boxShadow['s']).toBe(SHADOW_BOX.s);
    expect(ext.boxShadow['m']).toBe(SHADOW_BOX.m);
  });

  it('is frozen so consumer config merges cannot mutate it', () => {
    expect(Object.isFrozen(bloomTailwindPreset)).toBe(true);
  });
});

describe('design-tokens v4 @theme css', () => {
  const css = bloomThemeCss();

  it('emits --color-<role> aliases as direct var(--x) (never hsl-wrapped)', () => {
    expect(css).toContain('--color-fill: var(--card);');
    expect(css).toContain('--color-text-tertiary: var(--muted-foreground);');
    expect(css).not.toContain('hsl(var(');
  });

  it('emits spacing, radius, typography and shadow vars', () => {
    expect(css).toContain('--spacing-space-8: 8px;');
    expect(css).toContain('--radius-radius-20: 20px;');
    expect(css).toContain('--text-body: 15px;');
    expect(css).toContain('--text-body--line-height: 22px;');
    expect(css).toContain('--font-body: var(--bloom-font-sans);');
    expect(css).toContain('--shadow-s:');
  });

  it('wraps the body in a @theme block', () => {
    expect(bloomThemeBlock()).toMatch(/^@theme \{[\s\S]*\}$/);
  });
});

describe('design-tokens shipped theme.css', () => {
  // The static artifact consumers `@import`. Generated by
  // scripts/generate-theme-css.ts from the SAME source as bloomThemeCss(),
  // so this guards against JS/CSS drift.
  const themeCss = readFileSync(
    join(__dirname, '..', 'design-tokens', 'theme.css'),
    'utf8',
  );

  it('the @theme block equals bloomThemeBlock() (no drift)', () => {
    const block = themeCss.slice(themeCss.indexOf('@theme')).trimEnd();
    expect(block).toBe(bloomThemeBlock());
  });

  it('carries the auto-generated / do-not-edit header', () => {
    expect(themeCss).toContain('AUTO-GENERATED');
    expect(themeCss).toContain('bun run generate:theme-css');
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

  it('buildSeedScopeVars also emits the --color-x aliases a scope needs', () => {
    const vars = buildSeedScopeVars({ seed: '#7c5aed', mode: 'dark' });
    // Every canonical token gets a same-named alias. The role vocabulary
    // (`--color-fill` → `--card`) is checked against theme.css further down,
    // where the mapping comes from rather than being restated here.
    const canonical = Object.keys(vars).filter((k) => !k.startsWith('--color-'));
    expect(canonical.length).toBeGreaterThan(0);
    for (const token of canonical) {
      expect(vars[`--color-${token.slice(2)}`]).toBe(vars[token]);
    }
  });

  it("a preset's own seed reproduces that preset exactly", () => {
    // What lets a consumer theme a brand scope and the document root through one
    // code path: the seed form is not an approximation of the preset form.
    const preset = APP_COLOR_PRESETS.oxy;
    for (const mode of ['light', 'dark'] as const) {
      const fromPreset = getPresetVars('oxy', mode);
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

describe('a scope re-declares every alias theme.css points at a token', () => {
  /* The failure this guards is silent and mode-dependent: a scope overrides
   * `--foreground`, but `--color-text: var(--foreground)` was computed at the
   * document root, so `text-text` inside the scope keeps painting the app-wide
   * colour. It looks correct in whichever mode the root happens to match.
   *
   * The list is read out of `bloomThemeCss()` rather than written here, so an
   * alias added there is covered the day it lands. */
  const rootAliases = bloomThemeCss()
    .split('\n')
    .map((line) => /^\s*--color-([a-z0-9-]+):\s*var\(--([a-z0-9-]+)\);\s*$/.exec(line))
    .filter((match): match is RegExpExecArray => match !== null)
    .map((match) => ({ alias: match[1] as string, canonical: match[2] as string }))

  it('covers a meaningful number of aliases', () => {
    // A regex that stopped matching would otherwise leave every case below
    // passing over an empty list.
    expect(rootAliases.length).toBeGreaterThan(20)
  })

  for (const [label, scope] of [
    ['seed', buildSeedScopeVars({ seed: '#7c5aed', mode: 'dark' })],
    ['preset', buildScopeVars('faircoin', 'dark')],
  ] as const) {
    it(`resolves them against the scope's own tokens (${label})`, () => {
      const wrong = rootAliases
        .filter(({ canonical }) => scope[`--${canonical}`] !== undefined)
        .filter(({ alias, canonical }) => scope[`--color-${alias}`] !== scope[`--${canonical}`])
        .map(({ alias, canonical }) => `--color-${alias} != --${canonical}`)
      expect(wrong).toEqual([])
    })
  }
})

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
      if (specifier === 'react' || specifier === 'react-native' || specifier.startsWith('react-native/')) {
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
