import { APP_COLOR_NAMES, APP_COLOR_PRESETS } from '../color-presets';
import { getResolvedTokens } from '../token-registry';
import { isColourlessSeed } from '../color-policy';
import { parseRgba } from '../color-utils';
import { Hct } from '../color-engine/hct';
import { argbFromRgb } from '../color-engine/color-utils';
import { contrastRatio } from '../../styles/color-contrast';

function hct(value: string) {
  const c = parseRgba(value)!;
  return Hct.fromInt(argbFromRgb(c.r, c.g, c.b));
}

it('keeps every surface label readable and every declared ladder neighbour separated', () => {
  for (const preset of APP_COLOR_NAMES) for (const mode of ['light', 'dark'] as const) {
    const t = getResolvedTokens(preset, mode);
    const ladder = mode === 'light'
      ? ['card', 'background', 'surface', 'popover', 'muted']
      : ['background', 'surface', 'popover', 'muted', 'card'];
    for (let i = 1; i < ladder.length; i++) {
      const gap = Math.abs(hct(t[`--${ladder[i]}`]!).tone - hct(t[`--${ladder[i - 1]}`]!).tone);
      // Quantized 8-bit tones can differ by ~0.3 from the authored four-tone gap.
      expect(gap).toBeGreaterThan(3.5);
    }
    // Content-area is intentionally intermediate, but must not collapse onto
    // either of its own neighbours while the main ladder stays separated.
    for (const neighbour of mode === 'light' ? ['card', 'background'] : ['background', 'surface']) {
      expect(Math.abs(hct(t['--content-area']!).tone - hct(t[`--${neighbour}`]!).tone)).toBeGreaterThan(1.5);
    }
    for (const surface of [...ladder, 'content-area']) {
      for (const foreground of ['foreground', 'muted-foreground']) {
        expect(contrastRatio(t[`--${surface}`]!, t[`--${foreground}`]!)).toBeGreaterThanOrEqual(4.5);
      }
    }
    if (!isColourlessSeed(APP_COLOR_PRESETS[preset].hex)) {
      expect(hct(t['--surface']!).chroma).toBeGreaterThan(8);
      expect(t['--card']).not.toBe('rgb(255 255 255)');
    }
    expect(t['--sidebar']).toBe(t['--surface']);
    expect(t['--input']).toBe(t['--border']);
  }
});
