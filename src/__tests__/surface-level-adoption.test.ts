/**
 * The families that had each resolved their own surface, measured against the
 * ladder (`styles/surface-levels.ts`).
 *
 * Split from `surface-levels.test.ts` on purpose: this one imports `tabs`,
 * `chart-cards`, `media-header` and their react-native / reanimated graphs, and
 * the full 64-preset matrix on top of that module graph is what pushes a jest
 * worker into the `Context::GetNumberOfEmbedderDataFields` crash `AGENTS.md`
 * records. The ladder itself is swept over every preset next door; this file
 * walks a SAMPLE chosen to span what the derivation depends on — the seed's
 * chroma (including a colourless one, where the whole palette goes greyscale)
 * and its hue — and each assertion names the case that fails.
 */
import { resolveChartCardPalette } from '../chart-cards/palette';
import { resolveCreatorStudioPaint } from '../creator-studio/shared';
import { resolveMenuPalette } from '../floating/menu-palette';
import { resolveMediaHeaderPaint } from '../media-header/shared';
import { resolveInsightPalette } from '../property-insights/shared';
import { contrastRatio } from '../styles/color-contrast';
import {
  AA_TEXT,
  AA_TEXT_STRONG,
  resolveSurfaceLevel,
  SURFACE_LEVELS,
  surfaceTextOn,
} from '../styles/surface-levels';
import { resolveTabsPaint } from '../tabs/Tabs';
import { resolveTextFieldPalette } from '../text-field/shared';
import { buildTheme } from '../theme/build-theme';
import type { AppColorName } from '../theme/color-presets';
import type { Theme } from '../theme/types';

const MODES = ['light', 'dark'] as const;

/**
 * A sample, not the matrix — see the file comment. `mono` is the colourless
 * seed (the greyscale theme, where there is no hue to lean on), `yellow` and
 * `mint` are the high-lightness seeds whose fills sit near the top of the tone
 * range, `purple` peaks dark, and `blue`/`teal` are the two the audit measured.
 */
const PRESETS = ['blue', 'teal', 'mono', 'yellow', 'mint', 'purple'] as const satisfies readonly AppColorName[];

const THEMES: { theme: Theme; preset: AppColorName; mode: (typeof MODES)[number] }[] = PRESETS.flatMap(
  (preset) => MODES.map((mode) => ({ preset, mode, theme: buildTheme(preset, mode) })),
);

function themesIn(mode: (typeof MODES)[number]) {
  return THEMES.filter((t) => t.mode === mode);
}

/** The smallest fill step that reads as a step. 1.000:1 is what shipped. */
const FILL_JND = 1.1;

/** A hairline has to read against the surface it divides. */
const HAIRLINE_MIN = 1.18;

describe('a field inside a card is distinguishable from it', () => {
  /** Every surface Bloom can actually put a field or a tab strip on. */
  function parents(theme: Theme): { name: string; fill: string }[] {
    return [
      { name: 'page', fill: theme.colors.background },
      { name: 'card', fill: theme.colors.card },
      { name: 'menu', fill: resolveMenuPalette(theme).surface },
      ...SURFACE_LEVELS.map((level) => ({
        name: `L${level}`,
        fill: resolveSurfaceLevel(theme, level).background,
      })),
    ];
  }

  it.each(MODES)('the text field keeps a shell on every one (%s)', (mode) => {
    for (const { preset, theme } of themesIn(mode)) {
      for (const { name, fill } of parents(theme)) {
        const p = resolveTextFieldPalette(theme, fill);
        const where = `${preset} field on ${name}`;
        expect([where, contrastRatio(p.background, fill) >= FILL_JND]).toEqual([where, true]);
        expect([where, contrastRatio(p.placeholder, p.background) >= AA_TEXT]).toEqual([where, true]);
        expect([where, contrastRatio(p.count, p.background) >= AA_TEXT]).toEqual([where, true]);
        expect([where, contrastRatio(p.hint, fill) >= AA_TEXT]).toEqual([where, true]);
      }
    }
  });

  it.each(MODES)('the tab rail reads on every one (%s)', (mode) => {
    for (const { preset, theme } of themesIn(mode)) {
      for (const { name, fill } of parents(theme)) {
        const paint = resolveTabsPaint(theme, 'underline', fill);
        const where = `${preset} rail on ${name}`;
        expect([where, contrastRatio(paint.separator, fill) >= HAIRLINE_MIN]).toEqual([where, true]);
      }
    }
  });

  it('is what the two collisions on main measured, so the regression is named', () => {
    // Both were byte-for-byte identical, in every preset, in dark mode.
    const theme = buildTheme('blue', 'dark');
    const menu = resolveMenuPalette(theme).surface;
    expect(resolveTextFieldPalette(theme, menu).background).not.toBe(menu);
    expect(resolveTabsPaint(theme, 'underline', menu).separator).not.toBe(menu);
  });
});

describe('quiet text is read off the surface it lands on', () => {
  it.each(MODES)('chart cards clear AA for label and tick (%s)', (mode) => {
    for (const { preset, theme } of themesIn(mode)) {
      const p = resolveChartCardPalette(theme);
      const where = `${preset}/${mode}`;
      // Was 4.38 / 3.78 (label) and 2.42 / 2.29 (tick) on `blue`.
      expect([where, contrastRatio(p.textSecondary, p.surface) >= AA_TEXT_STRONG]).toEqual([where, true]);
      expect([where, contrastRatio(p.textTertiary, p.surface) >= AA_TEXT]).toEqual([where, true]);
      expect([where, contrastRatio(p.textSecondary, p.inner) >= AA_TEXT_STRONG]).toEqual([where, true]);
      expect([where, contrastRatio(p.text, p.surface) >= AA_TEXT_STRONG]).toEqual([where, true]);
      // The delta chips carry their own label.
      expect([where, contrastRatio(p.neutral.foreground, p.neutral.background) >= AA_TEXT]).toEqual([
        where,
        true,
      ]);
      // And the tick is legible on the INNER tile too, which it also paints.
      expect([where, contrastRatio(p.textTertiary, p.inner) >= AA_TEXT]).toEqual([where, true]);
    }
  });

  it.each(MODES)('creator studio, property insights and media headers do too (%s)', (mode) => {
    for (const { preset, theme } of themesIn(mode)) {
      const where = `${preset}/${mode}`;

      const studio = resolveCreatorStudioPaint(theme);
      expect([where, contrastRatio(studio.textSecondary, studio.surface) >= AA_TEXT_STRONG]).toEqual([where, true]);
      expect([where, contrastRatio(studio.textTertiary, studio.surface) >= AA_TEXT]).toEqual([where, true]);

      const insights = resolveInsightPalette(theme);
      expect([where, contrastRatio(insights.muted, insights.card) >= AA_TEXT]).toEqual([where, true]);
      expect([where, contrastRatio(insights.muted, insights.surface) >= AA_TEXT]).toEqual([where, true]);
      expect([where, contrastRatio(insights.textSecondary, insights.surface) >= AA_TEXT]).toEqual([where, true]);

      const header = resolveMediaHeaderPaint(theme, null);
      expect([where, contrastRatio(header.textMuted, header.card) >= AA_TEXT]).toEqual([where, true]);
      expect([where, contrastRatio(header.textMuted, header.background) >= AA_TEXT]).toEqual([where, true]);
    }
  });

  it('moves the rung when the surface moves — it is not a constant in disguise', () => {
    const theme = buildTheme('blue', 'dark');
    const onPage = surfaceTextOn(theme, theme.colors.background).textTertiary;
    const onCard = surfaceTextOn(theme, resolveSurfaceLevel(theme, 2).background).textTertiary;
    expect(onPage).not.toBe(onCard);
  });

});
