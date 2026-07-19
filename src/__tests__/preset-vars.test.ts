import { APP_COLOR_NAMES } from '../theme/color-presets';
import { getPresetVars } from '../theme/preset-vars';
import { getResolvedTokens } from '../theme/token-registry';

const EXTENDED_KEYS = [
  '--card',
  '--card-foreground',
  '--chart-1',
  '--chart-2',
  '--chart-3',
  '--chart-4',
  '--chart-5',
  '--content-area',
  '--sidebar-foreground',
  '--sidebar-primary',
  '--sidebar-primary-foreground',
  '--sidebar-accent',
  '--sidebar-accent-foreground',
  '--sidebar-border',
  '--sidebar-ring',
] as const;

const BASE_KEYS = [
  '--background',
  '--foreground',
  '--surface',
  '--surface-foreground',
  '--popover',
  '--popover-foreground',
  '--primary',
  '--primary-foreground',
  '--secondary',
  '--secondary-foreground',
  '--muted',
  '--muted-foreground',
  '--accent',
  '--accent-foreground',
  '--destructive',
  '--border',
  '--input',
  '--ring',
  '--sidebar',
] as const;

describe('getPresetVars (engine-backed)', () => {
  it('emits every base + extended token as a full rgb() color for all presets and modes', () => {
    for (const name of APP_COLOR_NAMES) {
      for (const mode of ['light', 'dark'] as const) {
        const vars = getPresetVars(name, mode);
        for (const key of [...BASE_KEYS, ...EXTENDED_KEYS]) {
          expect(vars[key]).toBeDefined();
          // The engine emits `rgb(r g b)` directly — never a bare HSL triple.
          expect(vars[key]).toMatch(/^rgb\(\d+ \d+ \d+\)$/);
        }
      }
    }
  });

  it('drives sidebar-primary / ring from the engine primary role', () => {
    const vars = getPresetVars('blue', 'light');
    expect(vars['--sidebar-primary']).toBe(vars['--primary']);
    expect(vars['--ring']).toBe(vars['--primary']);
    expect(vars['--chart-1']).toBe(vars['--primary']);
  });

  it('makes secondary a real contrast color, not a mirror of primary (the fix)', () => {
    for (const name of APP_COLOR_NAMES) {
      for (const mode of ['light', 'dark'] as const) {
        const vars = getPresetVars(name, mode);
        expect(vars['--secondary']).not.toBe(vars['--primary']);
      }
    }
  });

  it('makes card the lightest surface in light mode, darkest in dark (the fix)', () => {
    const channels = (rgb: string): number[] =>
      (rgb.match(/\d+/g) ?? []).map(Number);
    const sum = (rgb: string): number => channels(rgb).reduce((a, b) => a + b, 0);

    for (const name of APP_COLOR_NAMES) {
      const light = getPresetVars(name, 'light');
      // card (surfaceContainerLowest) must be lighter than background in light.
      expect(sum(light['--card'] ?? '')).toBeGreaterThan(sum(light['--background'] ?? ''));

      const dark = getPresetVars(name, 'dark');
      // card must be darker than (or equal to) background in dark — correct inversion.
      expect(sum(dark['--card'] ?? '')).toBeLessThanOrEqual(sum(dark['--background'] ?? ''));
    }
  });

  it('carries no legacy resolved-color companion universe', () => {
    const vars = getPresetVars('green', 'dark');
    const legacyPrefix = `--${'color'}-`;
    expect(Object.keys(vars).some((k) => k.startsWith(legacyPrefix))).toBe(false);
  });
});

describe('getResolvedTokens (single canonical rgb pipeline)', () => {
  it('passes the engine rgb() values through unchanged', () => {
    const resolved = getResolvedTokens('green', 'dark');
    const raw = getPresetVars('green', 'dark');
    // The engine already emits rgb(); getResolvedTokens must not re-touch it.
    expect(resolved['--primary']).toBe(raw['--primary']);
    expect(resolved['--card']).toBe(raw['--card']);
    expect(resolved['--primary']).toMatch(/^rgb\(\d+ \d+ \d+\)$/);
    expect(resolved['--card']).toMatch(/^rgb\(\d+ \d+ \d+\)$/);
    const legacyPrefix = `--${'color'}-`;
    expect(Object.keys(resolved).some((k) => k.startsWith(legacyPrefix))).toBe(false);
  });

  it('produces a full CSS color for every base preset token of every preset/mode', () => {
    for (const name of APP_COLOR_NAMES) {
      for (const mode of ['light', 'dark'] as const) {
        const resolved = getResolvedTokens(name, mode);
        for (const key of BASE_KEYS) {
          const value = resolved[key] ?? '';
          // A bare triple (`185 50% 5%`) is INVALID CSS — the incident. Every
          // base token must come out as a complete color the browser parses.
          expect(value.startsWith('rgb(') || value.startsWith('hsl(') || value.startsWith('#')).toBe(
            true,
          );
          // Never a bare HSL triple.
          expect(/^-?\d[\d.]*\s+[\d.]+%/.test(value)).toBe(false);
        }
      }
    }
  });
});
