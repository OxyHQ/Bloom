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
import { settingsGroupSurface } from '../settings-list/surface';
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

/**
 * `SettingsListGroup`'s default fill — the first component to resolve its
 * surface from the one its container PUBLISHED instead of taking a prop for it.
 *
 * The rule (`settings-list/surface.ts`): `theme.colors.card` on the page, one
 * ladder step off the published fill anywhere else. It belongs in this file
 * rather than beside the component's render tests for the reason the file
 * comment gives — and two of its three properties are invisible in one mode, so
 * every assertion below walks both.
 */
/**
 * The sampled presets where `backgroundSecondary` FAILS the JND against the menu
 * surface in dark. An equality: `mint`, the one preset missing from this list,
 * clears the floor by a hundredth — a scrape rather than a margin — so a change
 * that moves either way has to be read rather than absorbed.
 */
const FAILS_IN_DARK = ['blue', 'mono', 'purple', 'teal', 'yellow'];

describe('a settings group resolves a surface it cannot see', () => {
  it('never lands on the surface behind it, at any rung', () => {
    const offenders: string[] = [];
    for (const { theme, preset, mode } of THEMES) {
      for (const level of SURFACE_LEVELS) {
        // The two shapes a container publishes: the rung alone (`FloatingPanel`,
        // `QueuePanel`) and an exact fill that is NOT the rung — `ContentPanel`
        // paints `colors.card`, which in dark is ~1.27:1 off rung 1.
        const rung = resolveSurfaceLevel(theme, level).background;
        for (const behind of level === 1 ? [rung, theme.colors.card] : [rung]) {
          const ratio = contrastRatio(settingsGroupSurface(theme, behind), behind);
          if (ratio < FILL_JND) offenders.push(`${preset}/${mode} level ${level}: ${ratio.toFixed(3)}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('paints the `card` ROLE on the page, and `card` is the stronger answer there', () => {
    // WHY the page is a named branch rather than another step. In LIGHT rung 1
    // IS `colors.card`, so the two answers coincide and the branch is invisible;
    // in DARK they differ and `card` separates from the page further (1.55-1.58
    // against the step's 1.23-1.24 over the 64 presets), so taking the step
    // would flatten every settings screen in the fleet against its own page.
    // Both directions fail: if the two stop coinciding in light, or `card` stops
    // winning in dark, the branch needs re-deciding rather than keeping.
    const offenders: string[] = [];
    for (const { theme, preset, mode } of THEMES) {
      const page = theme.colors.background;
      const chosen = settingsGroupSurface(theme, page);
      if (chosen !== theme.colors.card) offenders.push(`${preset}/${mode}: not the card role`);
      const step = resolveSurfaceLevel(theme, 1).background;
      if (mode === 'light') {
        if (step !== theme.colors.card) offenders.push(`${preset}/light: rung 1 is not card`);
      } else if (contrastRatio(chosen, page) <= contrastRatio(step, page)) {
        offenders.push(`${preset}/dark: the step is not weaker`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('is a step and not `backgroundSecondary`, which is calibrated on `card` alone', () => {
    // The negative control for the choice, as a fact about the palette. On the
    // menu surface `FloatingPanel` and `QueuePanel` publish, `backgroundSecondary`
    // measures 1.086-1.106 in DARK — failing the JND on 52 of the full 64 presets
    // and on every preset sampled here — while clearing it in LIGHT on all of
    // them (1.221-1.230). That split is the whole reason a suite pinned to one
    // mode could not see this.
    //
    // Pinned as a NAMED SET, not as a floor: "at least one preset fails" erodes
    // to nothing, and an IMPROVEMENT has to be looked at too — if
    // `backgroundSecondary` ever clears the floor on the menu surface in dark,
    // the reason this default is a step needs restating, not silently keeping.
    // One sampled preset does clear it, and naming it is the point: it is a
    // scrape, not a margin.
    const failsInDark: string[] = [];
    const clearsInLight: string[] = [];
    const stepFails: string[] = [];
    for (const { theme, preset, mode } of THEMES) {
      const menu = resolveSurfaceLevel(theme, 1).background;
      const ratio = contrastRatio(theme.colors.backgroundSecondary, menu);
      if (mode === 'dark' && ratio < FILL_JND) failsInDark.push(preset);
      if (mode === 'light' && ratio >= FILL_JND) clearsInLight.push(preset);
      if (contrastRatio(settingsGroupSurface(theme, menu), menu) < FILL_JND) {
        stepFails.push(`${preset}/${mode}`);
      }
    }
    expect([failsInDark.sort(), clearsInLight.length]).toEqual([FAILS_IN_DARK, PRESETS.length]);
    expect(stepFails).toEqual([]);
  });

  it('gives an explicit variant its own role, whatever is behind it', () => {
    const offenders: string[] = [];
    for (const { theme, preset, mode } of THEMES) {
      for (const behind of [theme.colors.background, theme.colors.card]) {
        if (settingsGroupSurface(theme, behind, 'plain') !== theme.colors.card) {
          offenders.push(`${preset}/${mode}: plain`);
        }
        if (settingsGroupSurface(theme, behind, 'filled') !== theme.colors.backgroundSecondary) {
          offenders.push(`${preset}/${mode}: filled`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
