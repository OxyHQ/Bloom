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
import { resolveAccentColors } from '../accent-colors';
import {
  GLASS_BLUR_INTENSITY,
  GLASS_SCRIM_ALPHA,
  GLASS_SHEEN,
  glassScrim,
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

const WHITE: Rgba = { r: 255, g: 255, b: 255, a: 1 };
const BLACK: Rgba = { r: 0, g: 0, b: 0, a: 1 };

/** The three backdrops a floating surface actually meets. */
function backdrops(colors: ThemeColors): Array<[string, Rgba]> {
  return [
    ['page', parse(colors.background)],
    ['white', WHITE],
    ['black', BLACK],
  ];
}

/**
 * The ratio a user sees: the label over the whole stack, composited bottom-up.
 *
 * The sheen is included at its darkest point — the bottom stop, black at 2% —
 * because that is where a light label has the least to work with, and a
 * measurement taken at the surface's midpoint would miss it.
 */
function surfaceOver(colors: ThemeColors, tone: GlassTone, isDark: boolean, backdrop: Rgba): Rgba {
  const glass = resolveGlassColors(colors, tone);
  const material = over(blurTint(isDark), backdrop);
  const scrimmed = over(parse(glassScrim(isDark)), material);
  const tinted = over(parse(glass.fill), scrimmed);
  return over(parse(GLASS_SHEEN.bottom), tinted);
}

function measure(colors: ThemeColors, tone: GlassTone, isDark: boolean, backdrop: Rgba): number {
  const surface = surfaceOver(colors, tone, isDark, backdrop);
  return contrast(surface, over(parse(resolveGlassColors(colors, tone).foreground), surface));
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

  it('clears AA on EVERY backdrop a floating surface meets, not just the page', () => {
    // The whole point of the calibration. The page used to be the only backdrop
    // this held for; a surface that floats over content meets the extremes.
    const failures = rows
      .filter((row) => row.ratio < AA)
      .map((row) => `${row.name}: ${row.ratio.toFixed(2)}`)
      .sort();
    expect(failures).toEqual([]);
  });

  /**
   * The POSITIVE CONTROL for the calibration above, and it used to be the
   * recorded limit.
   *
   * Before the foreground moved to `colors.text`, the label was the tone's
   * `*SubtleForeground` and this pairing measured 1.04 (light over black) and
   * 1.49 (dark over white). Keeping it as a control is what makes the pass above
   * mean something: it exercises the identical five-layer composite and the
   * identical helpers, so if `over`, `contrast` or the stack ever degraded to
   * something that returns comfortable numbers, this would go green and say so.
   *
   * It also pins WHY the old pairing could not be rescued by opacity. The
   * `*Subtle`/`*SubtleForeground` pair is calibrated for a tint composited over
   * THE PAGE; it is not self-contained, and over arbitrary content it needs the
   * material at 0.98 (light) / 0.90 (dark) — a surface that is no longer glass.
   */
  it('beats the OLD tone-derived foreground on the identical stack', () => {
    // The POSITIVE CONTROL for the pass above, stated as the before/after it
    // actually is rather than as a claim needing an exclusion list. Both
    // foregrounds are measured through the SAME five-layer composite and the
    // same helpers, so if `over`, `contrast` or the stack ever degraded to
    // something that returns comfortable numbers, the old column would go green
    // and say so.
    //
    // No filtering: some pairings are legitimately fine under the old
    // foreground — the `default` tone's is `textSecondary`, a neutral already
    // sitting where `colors.text` sits, and a monochrome preset has no hue to
    // begin with. Excluding those by name would be a list that stops being true;
    // counting them is the measurement.
    let oldFailures = 0;
    let newFailures = 0;
    let total = 0;
    let worstNew = Infinity;
    for (const preset of PRESETS) {
      for (const mode of MODES) {
        const colors = buildTheme(preset, mode).colors;
        for (const tone of TONES) {
          const opposite = mode === 'light' ? BLACK : WHITE;
          const surface = surfaceOver(colors, tone, mode === 'dark', opposite);
          const oldRatio = contrast(
            surface,
            over(parse(resolveAccentColors(colors, tone, 'subtle').foreground), surface),
          );
          const newRatio = contrast(
            surface,
            over(parse(resolveGlassColors(colors, tone).foreground), surface),
          );
          total++;
          if (oldRatio < AA) oldFailures++;
          if (newRatio < AA) newFailures++;
          worstNew = Math.min(worstNew, newRatio);
        }
      }
    }

    // Vacuity floor first: a loop that walked nothing reports zero of everything.
    expect(total).toBe(PRESETS.length * 2 * 6);
    // The old foreground fails on the majority of the matrix…
    expect(oldFailures).toBeGreaterThan(total / 2);
    // …and the new one on none of it.
    expect(newFailures).toBe(0);

    // The new foreground is not uniformly higher, and pretending otherwise
    // would be a false claim: on `mono`, whose `primary` is achromatic, the old
    // `*SubtleForeground` was MORE extreme than `colors.text` and scored better
    // (10.11 → 8.29 light, 6.50 → 5.02 dark). Both still clear AA with room, so
    // what matters is the floor, not the direction — pinned here so the margin
    // cannot erode quietly.
    expect(worstNew).toBeGreaterThan(AA);
    expect(worstNew).toBeLessThan(6);
  });

  it('composes the blur and the scrim to the opacity the calibration needs', () => {
    // The scrim is DERIVED from the target, so this is the arithmetic that keeps
    // the two in step: whatever expo-blur's own tint contributes, the scrim
    // closes the rest of the gap to 0.76 — the alpha at which `colors.text`
    // clears AA in DARK mode, which is the binding side.
    const blur = (GLASS_BLUR_INTENSITY / 100) * 0.78;
    expect(1 - (1 - blur) * (1 - GLASS_SCRIM_ALPHA)).toBeCloseTo(0.76, 6);
    // …and the scrim is a real layer, not a rounding artefact.
    expect(GLASS_SCRIM_ALPHA).toBeGreaterThan(0.5);
  });

  it('and a known-bad pairing still fails, so the threshold is doing work', () => {
    // White on a light-mode glass surface — the pairing `accent-colors.ts`
    // documents as one of the three defects it exists to prevent. It exercises
    // the same `parse` → `over` → `contrast` path as every row above, so a
    // broken helper cannot leave the assertions green.
    const colors = buildTheme('oxy', 'light').colors;
    const glass = resolveGlassColors(colors, 'primary');
    const surface = surfaceOver(colors, 'primary', false, parse(colors.background));
    expect(contrast(surface, WHITE)).toBeLessThan(AA);
  });
});
