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

  // `--ring` follows the TEXT accent, not the fill. A focus ring is drawn on the
  // page next to a control, so it needs the tone that is legible there — which is
  // the job `--primary-text` exists for. Equating it with `--primary` was the same
  // conflation that made the fill go pastel to stay readable as text.
  it('drives sidebar-primary / ring from the legible brand accent', () => {
    const vars = getPresetVars('blue', 'light');
    expect(vars['--ring']).toBe(vars['--primary-text']);
    expect(vars['--sidebar-primary']).toBe(vars['--primary-text']);
  });

  // The chart ramp is no longer drawn from the primary/secondary/tertiary trio,
  // which spans ~35 degrees of hue and left adjacent series indistinguishable
  // (minimum ΔE 6.2 across the presets). Five hues, evenly spread, one tone.
  it('spreads the chart ramp across distinct hues', () => {
    const vars = getPresetVars('blue', 'light');
    const series = [1, 2, 3, 4, 5].map((i) => vars[`--chart-${i}`]);
    expect(new Set(series).size).toBe(series.length);
  });

  it('makes secondary a real contrast color, not a mirror of primary (the fix)', () => {
    for (const name of APP_COLOR_NAMES) {
      for (const mode of ['light', 'dark'] as const) {
        const vars = getPresetVars(name, mode);
        expect(vars['--secondary']).not.toBe(vars['--primary']);
      }
    }
  });

  // Deliberately inverted from what this asserted before: M3's
  // `surfaceContainerLowest` is the RECESSED step, so in dark a card SANK into
  // the page rather than lifting off it — on all thirteen presets, which is what
  // made it a mapping problem and not a seed one.
  it('makes card lift off the background in BOTH modes', () => {
    const sum = (rgb: string): number =>
      (rgb.match(/\d+/g) ?? []).map(Number).reduce((a, b) => a + b, 0);

    for (const name of APP_COLOR_NAMES) {
      for (const mode of ['light', 'dark'] as const) {
        const vars = getPresetVars(name, mode);
        expect(sum(vars['--card'] ?? '')).toBeGreaterThan(sum(vars['--background'] ?? ''));
      }
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
