import {
  AAA_TEXT_CONTRAST,
  AA_TEXT_CONTRAST,
  contrastRatio,
  darken,
  darkenUntilContrast,
  readableOn,
} from '../styles/color-contrast';
import { parseRgba } from '../theme/color-utils';

/**
 * Surfaces that paint an artwork colour and lay text on it had five
 * implementations of "darken this until the text clears", under four names for
 * the bar. This pins the one shared behaviour.
 */

const rgb = (c: string) => parseRgba(c)!;

describe('darkenUntilContrast', () => {
  it('returns the colour untouched when it already clears the bar', () => {
    const shade = darkenUntilContrast('#101820', '#ffffff', AAA_TEXT_CONTRAST)!;
    expect(shade.amount).toBe(0);
    expect(rgb(shade.color)).toEqual(rgb('#101820'));
  });

  /**
   * The defect this replaced. `colorRamp` re-derives each stop's lightness and
   * chroma from the hue, so a near-black came back a MID-SLATE and a vivid
   * colour had a channel zeroed. Scaling keeps the channels' ratio.
   */
  it('keeps the channels in ratio, so a darkened teal is still teal', () => {
    const before = rgb('#1db98a');
    const after = rgb(darkenUntilContrast('#1db98a', '#ffffff', AAA_TEXT_CONTRAST)!.color);
    expect(after.g).toBeGreaterThan(after.b);
    expect(after.b).toBeGreaterThan(after.r);
    // Same ratio, within the rounding of one byte per channel.
    expect(after.g / after.r).toBeCloseTo(before.g / before.r, 0);
  });

  it('stops at the first shade that clears, and the one before it does not', () => {
    const shade = darkenUntilContrast('#f4d35e', '#ffffff', AAA_TEXT_CONTRAST)!;
    expect(contrastRatio(shade.color, '#ffffff')).toBeGreaterThanOrEqual(AAA_TEXT_CONTRAST);
    const lighter = darken('#f4d35e', shade.amount - 0.05) as string;
    expect(contrastRatio(lighter, '#ffffff')).toBeLessThan(AAA_TEXT_CONTRAST);
  });

  it('clears EVERY foreground it is given, not just the first', () => {
    const shade = darkenUntilContrast('#bae6fd', ['#ffffff', '#a3a3a3'], AA_TEXT_CONTRAST)!;
    expect(contrastRatio(shade.color, '#ffffff')).toBeGreaterThanOrEqual(AA_TEXT_CONTRAST);
    expect(contrastRatio(shade.color, '#a3a3a3')).toBeGreaterThanOrEqual(AA_TEXT_CONTRAST);
  });

  it('answers null for a colour it cannot parse, so the caller keeps its own surface', () => {
    expect(darkenUntilContrast('not-a-colour', '#ffffff')).toBeNull();
  });

  it('lands on black when nothing lighter clears', () => {
    const shade = darkenUntilContrast('#ffffff', '#ffffff', AAA_TEXT_CONTRAST)!;
    expect(contrastRatio(shade.color, '#ffffff')).toBeGreaterThanOrEqual(AAA_TEXT_CONTRAST);
  });
});

describe('readableOn', () => {
  it('picks the candidate whose WORST contrast over every surface is highest', () => {
    expect(readableOn(['#ffffff', '#eeeeee'], ['#ffffff', '#111111'])).toBe('#111111');
    expect(readableOn(['#101010', '#303030'], ['#111111', '#ffffff'])).toBe('#ffffff');
    expect(readableOn(['#ffffff', '#555555'], ['#000000', '#ffffff'])).toBe('#000000');
  });

  it('takes one surface as well as a list', () => {
    expect(readableOn('#000000', ['#111111', '#ffffff'])).toBe('#ffffff');
  });
});
