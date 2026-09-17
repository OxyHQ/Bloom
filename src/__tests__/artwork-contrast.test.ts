import { resolveButtonRamps } from '../button/shared';
import { resolveLyricsPalette } from '../lyrics/shared';
import { resolveCoverTint } from '../media-card/shared';
import { resolveArtworkTint } from '../media-player/shared';
import { browseTilePaint } from '../music-library/shared';
import {
  AAA_TEXT_CONTRAST,
  AA_LARGE_TEXT_CONTRAST,
  AA_TEXT_CONTRAST,
  contrastRatio,
  darken,
  darkenUntilContrast,
  readableOn,
} from '../styles/color-contrast';
import { buildTheme } from '../theme/build-theme';
import { parseRgba } from '../theme/color-utils';

/**
 * Four music surfaces paint an artwork colour and lay text on it. They had five
 * implementations of "darken this until the text clears", under four names for
 * the bar. This pins the shared behaviour and the floor each surface reaches
 * over the whole preset × mode × colour matrix.
 *
 * THE FLOORS ARE EQUALITIES, NOT THRESHOLDS. A floor that only has to stay
 * above its bar erodes one hundredth at a time; written as the measured value,
 * a change in EITHER direction has to be looked at. Improving one fails as
 * loudly as regressing it — re-measure and update the number with the reason.
 */

const PRESETS = ['blue', 'teal', 'oxy'] as const;
const MODES = ['light', 'dark'] as const;
const COLORS = [
  '#7c3aed', '#e0a800', '#0e7490', '#6d28d9', '#bae6fd', '#f5e9a8', '#2f7d6d',
  '#be185d', '#1db98a', '#f4d35e', '#f7f3ea', '#101820', '#ffffff', '#000000',
  '#3A6EA5', '#F4E3A1', '#8B3A62', '#777777', '#1d2b53', '#c2302f',
];

const round2 = (n: number) => Math.round(n * 100) / 100;
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

describe('the four artwork surfaces hold their text', () => {
  it('the LYRICS pane keeps white at AAA — floor 7.00 over 120 combinations', () => {
    let floor = Infinity;
    const failures: string[] = [];
    for (const preset of PRESETS) {
      for (const mode of MODES) {
        const theme = buildTheme(preset, mode);
        for (const color of COLORS) {
          const p = resolveLyricsPalette(theme, color);
          const active = contrastRatio(p.background, p.active);
          const upcoming = contrastRatio(p.background, p.upcoming);
          const past = contrastRatio(p.background, p.past);
          if (active < AAA_TEXT_CONTRAST) failures.push(`${preset}/${mode}/${color} active ${active}`);
          if (upcoming < AA_TEXT_CONTRAST) failures.push(`${preset}/${mode}/${color} upcoming ${upcoming}`);
          if (past < AA_LARGE_TEXT_CONTRAST) failures.push(`${preset}/${mode}/${color} past ${past}`);
          floor = Math.min(floor, active);
        }
      }
    }
    expect(failures).toEqual([]);
    expect(round2(floor)).toBe(7);
  });

  /**
   * BOTH foregrounds, over both stops. The previous implementation checked only
   * the title, and painted the muted line at 4.18:1 — under AA — over the palest
   * artwork colours. The title's floor rose from 4.69 to 5.07 in the same change.
   */
  it('a GENERATED COVER keeps BOTH foregrounds at AA over both stops — floor 4.52', () => {
    let floor = Infinity;
    const failures: string[] = [];
    for (const preset of PRESETS) {
      for (const mode of MODES) {
        const theme = buildTheme(preset, mode);
        for (const color of COLORS) {
          const tint = resolveCoverTint(theme, color);
          for (const [name, surface] of [['top', tint.top], ['bottom', tint.bottom]] as const) {
            for (const [fg, ink] of [['text', tint.text], ['muted', tint.textMuted]] as const) {
              const ratio = contrastRatio(surface, ink);
              if (ratio < AA_TEXT_CONTRAST) {
                failures.push(`${preset}/${mode}/${color}/${name}/${fg} ${ratio}`);
              }
              floor = Math.min(floor, ratio);
            }
          }
        }
      }
    }
    expect(failures).toEqual([]);
    expect(round2(floor)).toBe(4.52);
  });

  it('the IMMERSIVE player tint keeps both foregrounds at AA — floor 4.52', () => {
    let floor = Infinity;
    for (const preset of PRESETS) {
      for (const mode of MODES) {
        const theme = buildTheme(preset, mode);
        const { neutral } = resolveButtonRamps(theme);
        const text = neutral[50];
        const muted = neutral[300];
        for (const color of COLORS) {
          const tint = resolveArtworkTint(color, text, muted);
          const bg = tint.background as string;
          floor = Math.min(floor, contrastRatio(bg, text), contrastRatio(bg, muted));
        }
      }
    }
    expect(round2(floor)).toBe(4.52);
  });

  it('a BROWSE TILE keeps its title at AA — floor 4.88', () => {
    let floor = Infinity;
    const fallback = { background: '#eeeeee', text: '#111111' };
    for (const color of COLORS) {
      const paint = browseTilePaint(color, fallback);
      floor = Math.min(floor, contrastRatio(paint.background, paint.text));
    }
    expect(round2(floor)).toBe(4.88);
  });

  it('every surface falls back rather than painting a colour it could not read', () => {
    const theme = buildTheme('blue', 'light');
    expect(resolveLyricsPalette(theme, 'not-a-colour').fromArtwork).toBe(false);
    expect(resolveCoverTint(theme, 'not-a-colour')).toEqual(resolveCoverTint(theme));
    expect(resolveArtworkTint('not-a-colour', '#fff', '#aaa').background).toBeNull();
    expect(browseTilePaint('not-a-colour', { background: '#eee', text: '#111' })).toEqual({
      background: '#eee',
      text: '#111',
    });
  });
});
