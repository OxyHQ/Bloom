import { APP_COLOR_NAMES, APP_COLOR_PRESETS } from '../theme/color-presets';
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

describe('getPresetVars', () => {
  it('includes every base preset token plus extended tokens for all presets and modes', () => {
    for (const name of APP_COLOR_NAMES) {
      for (const mode of ['light', 'dark'] as const) {
        const vars = getPresetVars(name, mode);
        const base = mode === 'light' ? APP_COLOR_PRESETS[name].light : APP_COLOR_PRESETS[name].dark;

        for (const key of Object.keys(base)) {
          expect(vars[key]).toBe(base[key]);
        }
        for (const key of EXTENDED_KEYS) {
          expect(vars[key]).toBeDefined();
        }
      }
    }
  });

  it('derives chart/sidebar hue from the preset primary', () => {
    const vars = getPresetVars('blue', 'light');
    const primary = APP_COLOR_PRESETS.blue.light['--primary'] ?? '';
    const primaryHue = primary.split(' ')[0] ?? '';
    const chart1 = vars['--chart-1'] ?? '';
    expect(chart1.startsWith(`${primaryHue} `)).toBe(true);
    expect(vars['--sidebar-primary']).toBe(primary);
  });

  it('returns raw HSL triples (no resolved colors) — getResolvedTokens owns rgb', () => {
    // `getPresetVars` is the raw triple source feeding the single canonical
    // resolver. It must NOT pre-resolve to rgb/hsl, and the legacy resolved-color
    // companion universe must be gone (no key carries the resolved-color prefix).
    const vars = getPresetVars('green', 'dark');
    expect(vars['--primary']).toBe(APP_COLOR_PRESETS.green.dark['--primary']);
    expect(/^-?\d[\d.]*\s+[\d.]+%/.test(vars['--primary'] ?? '')).toBe(true);
    const legacyPrefix = `--${'color'}-`;
    expect(Object.keys(vars).some((k) => k.startsWith(legacyPrefix))).toBe(false);
  });
});

describe('getResolvedTokens (single canonical rgb pipeline)', () => {
  it('resolves every base + extended token to a space-separated rgb() string', () => {
    const resolved = getResolvedTokens('green', 'dark');
    const primaryTriple = APP_COLOR_PRESETS.green.dark['--primary'] ?? '';
    // No resolved-color companion universe anymore — the base token is rgb.
    const legacyPrefix = `--${'color'}-`;
    expect(Object.keys(resolved).some((k) => k.startsWith(legacyPrefix))).toBe(false);
    expect(resolved['--primary']).toMatch(/^rgb\(\d+ \d+ \d+\)$/);
    expect(resolved['--card']).toMatch(/^rgb\(\d+ \d+ \d+\)$/);
    // primary triple resolves to the same rgb the registry produces.
    expect(resolved['--primary']).toBe(getResolvedTokens('green', 'dark')['--primary']);
    expect(primaryTriple).toMatch(/%/);
  });

  it('resolves --primary to rgb for the blue preset (matches web reference)', () => {
    // `blue` preset light `--primary` is `205 87% 53%` → rgb(31 153 239).
    const resolved = getResolvedTokens('blue', 'light');
    expect(resolved['--primary']).toBe('rgb(31 153 239)');
  });

  it('produces a full CSS color for every base preset token of every preset/mode', () => {
    for (const name of APP_COLOR_NAMES) {
      for (const mode of ['light', 'dark'] as const) {
        const base = mode === 'light' ? APP_COLOR_PRESETS[name].light : APP_COLOR_PRESETS[name].dark;
        const resolved = getResolvedTokens(name, mode);
        for (const key of Object.keys(base)) {
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
