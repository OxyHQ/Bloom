import { APP_COLOR_NAMES } from '../color-presets';
import { getPresetVars } from '../preset-vars';

/** `rgb(r g b)` to relative luminance. */
function luminance(rgb: string): number {
  const [r, g, b] = (rgb.match(/\d+/g) ?? []).slice(0, 3).map((value) => {
    const c = Number(value) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

describe('vivid: the brand as a system tint', () => {
  it('is the same colour in light and dark', () => {
    for (const name of APP_COLOR_NAMES) {
      const light = getPresetVars(name, 'light');
      // A monochrome seed has no colour to show: its tint is its fill, which flips with the mode.
      if (light['--vivid'] === light['--primary']) continue;
      expect(light['--vivid']).toBe(getPresetVars(name, 'dark')['--vivid']);
    }
  });

  it('carries a label that reads on it, in every preset and mode', () => {
    for (const name of APP_COLOR_NAMES) {
      for (const mode of ['light', 'dark'] as const) {
        const vars = getPresetVars(name, mode);
        expect(
          contrast(vars['--vivid'] as string, vars['--vivid-foreground'] as string),
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('keeps a seed at its own strength where the fill is pulled down for a white label', () => {
    // Yellow's fill is deepened so white text reads on it; its system tint is the yellow itself.
    const vars = getPresetVars('yellow', 'light');
    expect(vars['--vivid']).toBe('rgb(254 212 0)');
    expect(vars['--vivid-foreground']).toBe('rgb(0 0 0)');
    expect(vars['--primary']).not.toBe(vars['--vivid']);
  });
});
