/**
 * What a label on a GLASS surface is actually legible against.
 *
 * `accent-colors.test.ts` already walks every tone x fill x preset x mode and
 * composites the `*Subtle` tint over the PAGE. That is the right measurement for
 * a chip sitting on the page, and it is the wrong one here, for two reasons that
 * only apply to glass:
 *
 *  1. **There is an extra layer.** `expo-blur` cannot be asked for a blur radius
 *     without also painting a tint of its own — the same `intensity` drives
 *     both — so a glass surface is `label / sheen / accent tint / expo-blur
 *     material / whatever is behind`, five layers rather than two.
 *  2. **"Whatever is behind" is not the page.** A glass surface floats OVER
 *     content by definition. So the page background is the optimistic case, and
 *     the honest measurement is the worst of the three backdrops a real surface
 *     meets: the page, pure white, and pure black.
 *
 * A ratio that only holds over the page would read as a comfortable pass here
 * and fail on the first photograph.
 */
import { readFileSync } from 'node:fs';

import { APP_COLOR_PRESETS, type AppColorName } from '../color-presets';
import { buildTheme } from '../build-theme';
import {
  GLASS_BLUR_INTENSITY,
  GLASS_SHEEN,
  resolveGlassColors,
  type GlassTone,
} from '../glass-colors';
import type { ThemeColors } from '../types';

interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

function parse(value: string): Rgba {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value.trim());
  if (hex?.[1] !== undefined) {
    const h = hex[1].length === 3 ? hex[1].replace(/./g, (c) => c + c) : hex[1];
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      a: 1,
    };
  }
  const fn = /^rgba?\(([^)]*)\)$/.exec(value.trim());
  if (!fn?.[1]) throw new Error(`unparseable colour: ${JSON.stringify(value)}`);
  const parts = fn[1].split(/[\s,/]+/).filter(Boolean).map(Number);
  if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) {
    throw new Error(`unparseable colour: ${JSON.stringify(value)}`);
  }
  return { r: parts[0] ?? 0, g: parts[1] ?? 0, b: parts[2] ?? 0, a: parts[3] ?? 1 };
}

/** Flatten a translucent colour onto an opaque one. */
function over(top: Rgba, bottom: Rgba): Rgba {
  return {
    r: top.r * top.a + bottom.r * (1 - top.a),
    g: top.g * top.a + bottom.g * (1 - top.a),
    b: top.b * top.a + bottom.b * (1 - top.a),
    a: 1,
  };
}

function luminance({ r, g, b }: Rgba): number {
  const channel = (v: number): number => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a: Rgba, b: Rgba): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * `expo-blur`'s OWN tint, reproduced from its `getBackgroundColor` — the layer a
 * caller cannot decline because `intensity` drives the blur radius and this
 * together.
 *
 * Copied deliberately rather than imported: importing it would make this gate
 * agree with expo-blur by construction, so a version bump that changed the
 * material would move the measurement and the expectation together and the suite
 * would stay green through a real regression. The version it was read from is
 * pinned in `package.json`; `blurTintMatchesInstalledExpoBlur` below is the
 * control that says so.
 */
function blurTint(isDark: boolean): Rgba {
  const opacity = GLASS_BLUR_INTENSITY / 100;
  return isDark
    ? { r: 25, g: 25, b: 25, a: opacity * 0.78 }
    : { r: 249, g: 249, b: 249, a: opacity * 0.78 };
}

/** The three backdrops a floating surface actually meets. */
function backdrops(colors: ThemeColors): Array<[string, Rgba]> {
  return [
    ['page', parse(colors.background)],
    ['white', { r: 255, g: 255, b: 255, a: 1 }],
    ['black', { r: 0, g: 0, b: 0, a: 1 }],
  ];
}

/**
 * The ratio a user sees: the label over the whole stack, composited bottom-up.
 *
 * The sheen is included at its darkest point — the bottom stop, black at 2% —
 * because that is where a light label has the least to work with, and a
 * measurement taken at the surface's midpoint would miss it.
 */
function measure(colors: ThemeColors, tone: GlassTone, isDark: boolean, backdrop: Rgba): number {
  const glass = resolveGlassColors(colors, tone);
  const material = over(blurTint(isDark), backdrop);
  const tinted = over(parse(glass.fill), material);
  const surface = over(parse(GLASS_SHEEN.bottom), tinted);
  return contrast(surface, over(parse(glass.fillForeground), surface));
}

const PRESETS = Object.keys(APP_COLOR_PRESETS) as AppColorName[];
const MODES = ['light', 'dark'] as const;
const TONES: GlassTone[] = ['default', 'primary', 'success', 'warning', 'error', 'info'];

/** WCAG AA for normal-size text. A button label is not large text. */
const AA = 4.5;

describe('glass surface legibility', () => {
  it('reads a real matrix', () => {
    // Vacuity floor: an empty walk reports no failures either.
    expect(PRESETS.length).toBeGreaterThanOrEqual(15);
    expect(TONES).toHaveLength(6);
  });

  it('reproduces the installed expo-blur material, so the numbers mean something', () => {
    // Positive control on the COPIED constant. If expo-blur changes its tint
    // maths, this fails and the ratios below are known to be stale — rather than
    // both moving together and reporting a comfortable pass.
    //
    // Read as SOURCE rather than imported: expo-blur ships ESM and is not in
    // this project's jest transform whitelist, and adding it there to run one
    // assertion would change what every other suite loads. The shipped artefact
    // is the thing being checked either way.
    const shipped = readFileSync(
      require.resolve('expo-blur/build/getBackgroundColor.js'),
      'utf8',
    );
    expect(shipped).toContain('`rgba(25,25,25,${opacity * 0.78})`');
    expect(shipped).toContain('`rgba(249,249,249,${opacity * 0.78})`');
    expect(shipped).toContain('const opacity = intensity / 100;');
    // …and the copy above agrees with them.
    expect(blurTint(true)).toEqual({ r: 25, g: 25, b: 25, a: (GLASS_BLUR_INTENSITY / 100) * 0.78 });
    expect(blurTint(false)).toEqual({
      r: 249,
      g: 249,
      b: 249,
      a: (GLASS_BLUR_INTENSITY / 100) * 0.78,
    });
  });

  /**
   * Every combination, with its worst backdrop, reported as a numbered list so a
   * failure names the tone rather than just the count.
   */
  const rows = PRESETS.flatMap((preset) =>
    MODES.flatMap((mode) => {
      const colors = buildTheme(preset, mode).colors;
      return TONES.flatMap((tone) =>
        backdrops(colors).map(([backdropName, backdrop]) => ({
          name: `${preset}/${mode}/${tone} over ${backdropName}`,
          ratio: measure(colors, tone, mode === 'dark', backdrop),
        })),
      );
    }),
  );

  it('walked every preset x mode x tone x backdrop', () => {
    expect(rows).toHaveLength(PRESETS.length * 2 * 6 * 3);
  });

  it('clears AA for a label on glass over THE PAGE, every tone and mode', () => {
    // The context a glass BUTTON is actually in — an inline control on the app's
    // own background, or on a card. Measured worst: 4.85 (light) / 7.03 (dark).
    const failures = rows
      .filter((row) => row.name.endsWith('over page') && row.ratio < AA)
      .map((row) => `${row.name}: ${row.ratio.toFixed(2)}`)
      .sort();
    expect(failures).toEqual([]);
  });

  /**
   * KNOWN LIMIT, recorded as a measurement rather than left as a silent pass.
   *
   * Over the backdrop OPPOSITE to the scheme — a light-mode surface on black
   * content, a dark-mode surface on white — the label does not clear AA, and it
   * is nowhere close: 1.04 and 1.49 at worst.
   *
   * The important part is WHY, because the obvious fix does not work. It is not
   * that the fill is too transparent: at alpha 1.0, light-mode `primary` over
   * black still measures 1.96, because `*SubtleForeground` is a mid-tone brand
   * colour calibrated to be legible on the tint AS COMPOSITED OVER THE PAGE. The
   * `*Subtle`/`*SubtleForeground` pair is not self-contained — it assumes the
   * page is behind it, which is exactly the assumption a floating surface breaks.
   *
   * So this asserts the limitation EXISTS. If someone changes the material or
   * the pair and glass becomes safe over arbitrary content, this test fails and
   * forces the claim to be re-measured and the docs updated, instead of a
   * limitation quietly outliving the thing that caused it.
   */
  it('does NOT clear AA over the opposite-scheme backdrop — a recorded limit', () => {
    const opposite = rows.filter(
      (row) =>
        (row.name.includes('/light/') && row.name.endsWith('over black')) ||
        (row.name.includes('/dark/') && row.name.endsWith('over white')),
    );
    expect(opposite.length).toBeGreaterThan(0);
    const worst = Math.min(...opposite.map((row) => row.ratio));
    expect(worst).toBeLessThan(AA);
    // Pinned, so an improvement cannot pass unnoticed as "still broken".
    expect(worst).toBeGreaterThan(1);
    expect(worst).toBeLessThan(2);
  });

  it('and a known-bad pairing still fails, so the threshold is doing work', () => {
    // White on a light-mode glass surface — the pairing `accent-colors.ts`
    // documents as one of the three defects it exists to prevent. It exercises
    // the same `parse` → `over` → `contrast` path as every row above, so a
    // broken helper cannot leave the assertions green.
    const colors = buildTheme('oxy', 'light').colors;
    const glass = resolveGlassColors(colors, 'primary');
    const surface = over(parse(glass.fill), over(blurTint(false), parse(colors.background)));
    expect(contrast(surface, { r: 255, g: 255, b: 255, a: 1 })).toBeLessThan(AA);
  });
});
