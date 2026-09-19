/**
 * The CHROME glass role: a neutral island of controls floating over content
 * Bloom does not own.
 *
 * ── WHY THIS IS NOT IN `glass-colors.test.ts` ───────────────────────────────
 *
 * That suite prices a BRAND fill over one of Bloom's own five surfaces, and
 * almost nothing about this role is the same case: the fill is a neutral off
 * the surface ladder, the label is the theme's own `text`, and the backdrop is
 * whatever the app happens to be showing. It is also, already, one of the three
 * suites that trip the Node `vm`/contextify crash recorded in AGENTS.md — and
 * the crash gets likelier the longer a worker lives, so adding another
 * full-catalogue walk to it would have made a suite that sometimes runs into
 * one that does not. Verified in both directions: it crashes the same way on an
 * unmodified checkout of `main`, and this file passes on its own.
 *
 * ── THE BACKDROP RANGE IS THE WHOLE RANGE ───────────────────────────────────
 *
 * Not five surfaces — two endpoints: pure white and pure black. Every composite
 * a real backdrop can produce lies between them on every channel, so a pane
 * that clears AA at both ends clears it everywhere in between. That is the
 * whole argument for a separate NEUTRAL role rather than reusing the 0.85 brand
 * alpha, and it is measured rather than asserted.
 *
 * ── TWO PROPERTIES, BOTH FAILING IN BOTH DIRECTIONS ─────────────────────────
 *
 *  1. LEGIBILITY as an exact account — zero failures, and the two worst ratios
 *     pinned to the hundredth. Raising an alpha to buy margin moves them, so
 *     improving the material fails as loudly as regressing it and somebody has
 *     to look either way.
 *  2. TRANSLUCENCY as the DIRECT property — how far the painted pane moves when
 *     the backdrop goes black to white — with LITERAL floors. A floor derived
 *     from the alpha constant would move with it, so an opaque material would
 *     satisfy its own floor.
 */
import { APP_COLOR_PRESETS, type AppColorName } from '../color-presets';
import { buildTheme } from '../build-theme';
import { resolveSurfaceLevel } from '../../styles/surface-levels';
import {
  GLASS_BLUR_INTENSITY,
  GLASS_CHROME_ALPHA,
  GLASS_SHEEN,
  glassSheenCss,
  resolveChromeGlassColors,
} from '../glass-colors';
import {
  BLACK,
  WHITE,
  contrastRatio,
  over,
  parseColor,
  type Rgba,
} from '../../__tests__/support/composite';

/** WCAG AA for normal-size text. A header's title is not large text. */
const AA = 4.5;

const PRESETS = Object.keys(APP_COLOR_PRESETS) as AppColorName[];
const MODES = ['light', 'dark'] as const;
const PLATFORMS = ['web', 'native'] as const;
type Platform = (typeof PLATFORMS)[number];

/**
 * `expo-blur`'s OWN tint, reproduced from its `getBackgroundColor` — the layer a
 * NATIVE caller cannot decline, because one `intensity` drives the blur radius
 * and this together. CSS `backdrop-filter` has no counterpart, which is why
 * both platforms are walked.
 *
 * Copied rather than imported, for the reason `glass-colors.test.ts` gives for
 * its own copy: importing it would make the gate agree with expo-blur by
 * construction, so a version bump that changed the material would move the
 * measurement and the expectation together.
 */
function blurTint(isDark: boolean): Rgba {
  const opacity = GLASS_BLUR_INTENSITY / 100;
  return isDark
    ? { r: 25, g: 25, b: 25, a: opacity * 0.78 }
    : { r: 249, g: 249, b: 249, a: opacity * 0.78 };
}

/** The sheen at its darkest point — the bottom stop, black at 2%. */
const SHEEN_BOTTOM = parseColor(glassSheenCss(GLASS_SHEEN.bottom));

const themes = new Map<string, ReturnType<typeof buildTheme>>();
function themeFor(preset: AppColorName, mode: 'light' | 'dark') {
  const key = `${preset}/${mode}`;
  let theme = themes.get(key);
  if (!theme) {
    theme = buildTheme(preset, mode);
    themes.set(key, theme);
  }
  return theme;
}

/** The island's own fill: rung 1 of the ladder, which is what `GlassIsland` paints. */
function islandFill(theme: ReturnType<typeof buildTheme>) {
  const level = resolveSurfaceLevel(theme, 1);
  return resolveChromeGlassColors(level.background, level.border, theme.isDark);
}

/** The painted island: the chrome fill over the backdrop, then the sheen. */
function chromePane(
  theme: ReturnType<typeof buildTheme>,
  backdrop: Rgba,
  platform: Platform,
): Rgba {
  const material = platform === 'native' ? over(blurTint(theme.isDark), backdrop) : backdrop;
  return over(SHEEN_BOTTOM, over(parseColor(islandFill(theme).fill), material));
}

const ENDPOINTS = [
  ['white', WHITE],
  ['black', BLACK],
] as const;

describe('chrome glass, over content Bloom does not own', () => {
  it('reads a real catalogue', () => {
    // Vacuity floor: an empty walk reports no failures either.
    expect(PRESETS.length).toBeGreaterThanOrEqual(15);
    expect(PRESETS).toContain('oxy');
  });

  it('carries the alphas it was measured at', () => {
    // An equality on the INPUTS, so the numbers below cannot drift away from
    // the material that produced them without this line going red first.
    expect(GLASS_CHROME_ALPHA).toEqual({ light: 0.72, dark: 0.8 });
    // Dark carries the HIGHER alpha, which is the opposite of the intuition
    // that a dark UI can afford more transparency: a dark island over a white
    // backdrop has the whole luminance range above it to be washed out into.
    expect(GLASS_CHROME_ALPHA.dark).toBeGreaterThan(GLASS_CHROME_ALPHA.light);
  });

  it('keeps the label legible at BOTH ends of the backdrop range, on both platforms', () => {
    const failures: string[] = [];
    const worst: Record<'light' | 'dark', { ratio: number; row: string }> = {
      light: { ratio: Infinity, row: '' },
      dark: { ratio: Infinity, row: '' },
    };
    let rows = 0;
    for (const preset of PRESETS) {
      for (const mode of MODES) {
        const theme = themeFor(preset, mode);
        const label = parseColor(theme.colors.text);
        for (const [name, backdrop] of ENDPOINTS) {
          for (const platform of PLATFORMS) {
            const ratio = contrastRatio(chromePane(theme, backdrop, platform), label);
            const row = `${preset}/${mode}/${name}/${platform} ${ratio.toFixed(2)}`;
            rows += 1;
            if (ratio < AA) failures.push(row);
            if (ratio < worst[mode].ratio) {
              worst[mode] = { ratio, row };
            }
          }
        }
      }
    }
    expect(rows).toBe(PRESETS.length * MODES.length * ENDPOINTS.length * PLATFORMS.length);
    expect(rows).toBeGreaterThanOrEqual(256);

    // Unlike the brand fill, this role has no compromise to account for: it
    // clears AA everywhere, with margin. That is the reason a neutral role
    // exists rather than a header reusing the 0.85 brand alpha.
    expect(failures).toEqual([]);

    // The two floors, to the hundredth, each in the direction its mode can
    // least afford: a light pane washed out over black, a dark pane over white.
    expect(worst.light.ratio).toBeCloseTo(8.23, 2);
    expect(worst.light.row).toContain('/light/black/web');
    expect(worst.dark.ratio).toBeCloseTo(6.43, 2);
    expect(worst.dark.row).toContain('/dark/white/web');
  });

  it('is still GLASS — the painted pane moves with the backdrop', () => {
    let min = Infinity;
    let max = -Infinity;
    for (const preset of PRESETS) {
      for (const mode of MODES) {
        const theme = themeFor(preset, mode);
        const move = Math.abs(
          chromePane(theme, WHITE, 'web').r - chromePane(theme, BLACK, 'web').r,
        );
        if (move < min) min = move;
        if (move > max) max = move;
      }
    }
    // LITERALS. `(1 - GLASS_CHROME_ALPHA.dark) * 255` would move with the alpha.
    expect(min).toBeGreaterThan(45);
    expect(min).toBeCloseTo(49.98, 2);
    expect(max).toBeCloseTo(69.97, 2);
  });

  it('reads 0 at opacity and rises as the alpha falls', () => {
    // The instrument's own calibration. Without it, "the pane moves" is also
    // what a bug in `over()` would report.
    const theme = themeFor('oxy', 'light');
    const fill = parseColor(resolveSurfaceLevel(theme, 1).background);
    const moveAt = (alpha: number) => {
      const tint = { ...fill, a: alpha };
      return Math.abs(over(tint, WHITE).r - over(tint, BLACK).r);
    };
    expect(moveAt(1)).toBe(0);
    expect(moveAt(0.9)).toBeCloseTo(25.5, 1);
    expect(moveAt(0.8)).toBeCloseTo(51, 1);
    expect(moveAt(0.72)).toBeCloseTo(71.4, 1);
    expect(moveAt(0.9)).toBeLessThan(moveAt(0.8));
    expect(moveAt(0.8)).toBeLessThan(moveAt(0.72));
  });

  it('edges the island with a hairline that outlives its own fill', () => {
    // The lip of the pane keeps more body than the pane: a hairline that
    // dissolves at the same rate stops reading as an edge at exactly the moment
    // the fill stops reading as a surface.
    for (const mode of MODES) {
      const theme = themeFor('oxy', mode);
      const glass = islandFill(theme);
      expect(parseColor(glass.hairline).a).toBeGreaterThan(parseColor(glass.fill).a);
      expect(parseColor(glass.hairline).a).toBeLessThanOrEqual(1);
      // And it is the LADDER's hairline colour, not the fill at another alpha —
      // an edge the same hue as the pane is not an edge.
      expect(parseColor(glass.hairline)).not.toMatchObject({
        r: parseColor(glass.fill).r,
        g: parseColor(glass.fill).g,
        b: parseColor(glass.fill).b,
      });
    }
  });

  it('a known-bad pairing still fails, so the threshold is doing work', () => {
    // A dark-mode label on a LIGHT-mode island: the same parse → over →
    // contrast path as every row above, so a broken helper cannot leave the
    // assertions green.
    const light = themeFor('oxy', 'light');
    const dark = themeFor('oxy', 'dark');
    expect(
      contrastRatio(chromePane(light, WHITE, 'web'), parseColor(dark.colors.text)),
    ).toBeLessThan(AA);
  });
});
