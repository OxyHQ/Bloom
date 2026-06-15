import { APP_COLOR_NAMES, APP_COLOR_PRESETS } from '../theme/color-presets';
import { getPresetVars, hslTripletToRgb } from '../theme/preset-vars';

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

  it('does not emit resolved --color-* vars by default', () => {
    const vars = getPresetVars('green', 'dark');
    expect(vars['--color-primary']).toBeUndefined();
  });

  it('emits resolved --color-* vars as rgb() when requested', () => {
    const vars = getPresetVars('green', 'dark', { includeResolvedColorVars: true });
    const primaryTriple = APP_COLOR_PRESETS.green.dark['--primary'] ?? '';
    expect(vars['--color-primary']).toBe(hslTripletToRgb(primaryTriple));
    expect(vars['--color-primary']).toMatch(/^rgb\(\d+ \d+ \d+\)$/);
    expect(vars['--color-card']).toBe(hslTripletToRgb(vars['--card'] ?? ''));
  });

  it('resolves --color-primary to rgb for the blue preset (matches web reference)', () => {
    // `blue` preset light `--primary` is `205 87% 53%` → rgb(31 153 239).
    const vars = getPresetVars('blue', 'light', { includeResolvedColorVars: true });
    expect(vars['--color-primary']).toBe('rgb(31 153 239)');
  });
});

describe('hslTripletToRgb', () => {
  it('converts a plain HSL triple to a space-separated rgb() string', () => {
    expect(hslTripletToRgb('205 87% 53%')).toBe('rgb(31 153 239)');
  });

  it('converts the achromatic extremes', () => {
    expect(hslTripletToRgb('0 0% 0%')).toBe('rgb(0 0 0)');
    expect(hslTripletToRgb('0 0% 100%')).toBe('rgb(255 255 255)');
    expect(hslTripletToRgb('0 0% 12%')).toBe('rgb(31 31 31)');
  });

  it('converts a saturated triple within ±1 per channel of the reference', () => {
    // teal `185 100% 20%` ≈ rgb(0 94 102).
    const match = /^rgb\((\d+) (\d+) (\d+)\)$/.exec(hslTripletToRgb('185 100% 20%'));
    expect(match).not.toBeNull();
    const r = Number(match?.[1] ?? NaN);
    const g = Number(match?.[2] ?? NaN);
    const b = Number(match?.[3] ?? NaN);
    expect(Math.abs(r - 0)).toBeLessThanOrEqual(1);
    expect(Math.abs(g - 94)).toBeLessThanOrEqual(1);
    expect(Math.abs(b - 102)).toBeLessThanOrEqual(1);
  });

  it('tolerates a deg suffix on the hue', () => {
    expect(hslTripletToRgb('205deg 87% 53%')).toBe('rgb(31 153 239)');
  });

  it('emits rgb(r g b / a) for an alpha tail (decimal or percentage)', () => {
    expect(hslTripletToRgb('205 87% 53% / 0.5')).toBe('rgb(31 153 239 / 0.5)');
    expect(hslTripletToRgb('205 87% 53% / 50%')).toBe('rgb(31 153 239 / 0.5)');
  });
});
