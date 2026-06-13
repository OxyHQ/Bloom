import { APP_COLOR_NAMES, APP_COLOR_PRESETS } from '../theme/color-presets';
import { getPresetVars } from '../theme/preset-vars';

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

  it('emits resolved --color-* vars wrapped in hsl() when requested', () => {
    const vars = getPresetVars('green', 'dark', { includeResolvedColorVars: true });
    expect(vars['--color-primary']).toBe(`hsl(${APP_COLOR_PRESETS.green.dark['--primary']})`);
    expect(vars['--color-card']).toBe(`hsl(${vars['--card']})`);
  });
});
