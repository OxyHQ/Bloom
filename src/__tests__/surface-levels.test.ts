/**
 * The gate on the surface LADDER (`styles/surface-levels.ts`).
 *
 * The bug it exists to catch is a DISAPPEARANCE, and a disappearance is invisible
 * to every other kind of test: a dark text field painted `neutral-800` inside a
 * menu painted `neutral-800` renders perfectly valid markup with perfectly valid
 * styles, and measures 1.000:1. Nothing throws, nothing looks wrong in a prop
 * snapshot, and the control simply is not there.
 *
 * So everything here is a MEASUREMENT over the full preset matrix, and it is
 * written to fail in both directions where that is meaningful:
 *
 * - Each adjacent pair of rungs separates by fill, or by the hairline, and the
 *   suite pins WHICH — losing one mechanism cannot be hidden by the other.
 * - Every text rung clears its own floor as RENDERED (8-bit quantized), and the
 *   three rungs stay ordered, so "fixing" tertiary by making it secondary fails.
 * - A field, and a tab rail, are distinguishable from every surface Bloom can
 *   actually put them on — the page, the card, a menu panel and each rung.
 */
import { resolveAvatarTint } from '../avatar/initials';
import type { AvatarColor } from '../avatar/types';
import { resolveMenuPalette } from '../floating/menu-palette';
import { contrastRatio } from '../styles/color-contrast';
import {
  AA_GRAPHICAL,
  AA_TEXT,
  AA_TEXT_STRONG,
  hairlineOn,
  resolveSurfaceLevel,
  SURFACE_LEVELS,
  surfaceFillOn,
  surfaceTextOn,
  type SurfaceLevel,
} from '../styles/surface-levels';
import { buildTheme } from '../theme/build-theme';
import { APP_COLOR_NAMES, type AppColorName } from '../theme/color-presets';
import type { Theme } from '../theme/types';

const MODES = ['light', 'dark'] as const;

/**
 * Every built-in preset. The ladder is derived from `theme.colors.text` and
 * `theme.colors.background`, both of which move with the preset, so a floor that
 * only holds for `blue` holds for nothing.
 */
const PRESETS = APP_COLOR_NAMES as readonly AppColorName[];

/**
 * The matrix, built ONCE.
 *
 * `buildTheme` runs the whole colour engine — HCT solves, tonal palettes, the
 * policy — and this file walks the matrix six times. Re-deriving 128 themes per
 * assertion is not just slow: Node's `vm`/contextify hits
 * `Context::GetNumberOfEmbedderDataFields Not a native context` and takes the
 * worker down with a SIGSEGV (the known crash `AGENTS.md` records against
 * `glass-colors`). One derivation per preset x mode keeps the suite inside it.
 */
const THEMES: { theme: Theme; preset: AppColorName; mode: (typeof MODES)[number]; label: string }[] =
  PRESETS.flatMap((preset) =>
    MODES.map((mode) => ({
      preset,
      mode,
      theme: buildTheme(preset, mode),
      label: `${preset}/${mode}`,
    })),
  );

function themesIn(mode: (typeof MODES)[number]) {
  return THEMES.filter((t) => t.mode === mode);
}

function themes() {
  return THEMES;
}

/**
 * The smallest fill step that reads as a step. Below it two large flat patches
 * are the same patch — 1.000:1 is what shipped, and 1.03:1 is what a rounding
 * difference looks like.
 */
const FILL_JND = 1.1;

/** A hairline has to read against BOTH the surfaces it divides. */
const HAIRLINE_MIN = 1.18;

describe('the surface ladder', () => {
  it.each(MODES)('separates every adjacent rung, and says how (%s)', (mode) => {
    const byFill: string[] = [];
    const byHairlineOnly: string[] = [];
    for (const { preset, theme } of themesIn(mode)) {
      for (const level of SURFACE_LEVELS.slice(1)) {
        const here = resolveSurfaceLevel(theme, level);
        const below = resolveSurfaceLevel(theme, (level - 1) as SurfaceLevel);
        const fill = contrastRatio(here.background, below.background);
        const where = `${preset} ${level - 1}->${level}`;
        if (fill >= FILL_JND) byFill.push(where);
        else byHairlineOnly.push(`${where} ${fill.toFixed(3)}`);
        // Whatever the fills do, the hairline must read on both sides.
        expect([where, contrastRatio(here.border, here.background) >= HAIRLINE_MIN]).toEqual([where, true]);
        expect([where, contrastRatio(here.border, below.background) >= HAIRLINE_MIN]).toEqual([where, true]);
      }
    }
    // An EQUALITY, not a floor: every pair separates by fill today. If a tuning
    // change drops one onto its neighbour it lands in `byHairlineOnly` and this
    // goes red — and so does a change that makes the ladder coarser than it is.
    expect(byHairlineOnly).toEqual([]);
    expect(byFill).toHaveLength(PRESETS.length * 3);
  });

  it.each(MODES)('floors every text rung on its own fill, as rendered (%s)', (mode) => {
    for (const { preset, theme } of themesIn(mode)) {
      for (const level of SURFACE_LEVELS) {
        const p = resolveSurfaceLevel(theme, level);
        const where = `${preset} L${level}`;
        expect([where, contrastRatio(p.text, p.background) >= AA_TEXT_STRONG]).toEqual([where, true]);
        expect([where, contrastRatio(p.textSecondary, p.background) >= AA_TEXT_STRONG]).toEqual([where, true]);
        expect([where, contrastRatio(p.textTertiary, p.background) >= AA_TEXT]).toEqual([where, true]);
        expect([where, contrastRatio(p.textGraphical, p.background) >= AA_GRAPHICAL]).toEqual([where, true]);
        // Ordered: a "fix" that promotes tertiary to secondary is not a fix.
        expect([where, contrastRatio(p.textSecondary, p.background)]).toEqual([
          where,
          expect.any(Number),
        ]);
        expect(contrastRatio(p.textTertiary, p.background)).toBeLessThan(
          contrastRatio(p.textSecondary, p.background),
        );
        expect(contrastRatio(p.textGraphical, p.background)).toBeLessThan(
          contrastRatio(p.textTertiary, p.background),
        );
      }
    }
  });

  it('keeps the quiet rungs pinned AT their floors, not above them', () => {
    // `quietText` returns the QUIETEST colour that clears the floor, so every
    // rung sits within one 8-bit step of it. A rung that drifts high is a
    // hierarchy silently collapsing toward the primary text colour.
    for (const { theme, label } of themes()) {
      for (const level of SURFACE_LEVELS) {
        const p = resolveSurfaceLevel(theme, level);
        const where = `${label} L${level}`;
        expect([where, contrastRatio(p.textTertiary, p.background) < AA_TEXT + 0.2]).toEqual([where, true]);
        expect([where, contrastRatio(p.textGraphical, p.background) < AA_GRAPHICAL + 0.2]).toEqual([
          where,
          true,
        ]);
      }
    }
  });
});

describe('one quiet-text role, one colour', () => {
  it('agrees with the token layer about what `textTertiary` is', () => {
    // `--color-text-tertiary` aliases `--muted-foreground` in
    // `design-tokens/theme.css`. `theme.colors.textTertiary` read `outline`,
    // so one named role rendered as two colours — 8.42:1 as a class and 4.04:1
    // as a JS token, in light mode, where 4.04 is below AA.
    for (const { theme, label } of themes()) {
      expect([label, theme.colors.textTertiary]).toEqual([label, theme.colors.textSecondary]);
      expect([label, contrastRatio(theme.colors.textTertiary, theme.colors.background) >= AA_TEXT]).toEqual([
        label,
        true,
      ]);
    }
  });
});

describe('avatar fallback tints', () => {
  const TINTS: readonly AvatarColor[] = ['blue', 'lime', 'pink', 'neutral'];

  it.each(MODES)('every tint carries its initial at AA (%s)', (mode) => {
    for (const { preset, theme } of themesIn(mode)) {
      for (const tint of TINTS) {
        const { background, foreground } = resolveAvatarTint(theme, tint);
        const where = `${preset}/${mode} ${tint}`;
        // `pink` measured 1.24:1 in dark, `lime` 4.29 and `neutral` 3.19 — and
        // the name hash sends a quarter of all fallbacks to each of the four.
        expect([where, contrastRatio(background, foreground) >= AA_TEXT]).toEqual([where, true]);
      }
    }
  });

  it('keeps the disc colours — the fix moved the LETTER, not the hue', () => {
    const theme = buildTheme('blue', 'dark');
    expect(resolveAvatarTint(theme, 'pink').background).toBe('rgb(236 216 214)');
    expect(resolveAvatarTint(theme, 'lime').background).toBe('rgb(196 249 221)');
  });
});

describe('the ladder is anchored on what Bloom already painted', () => {
  it('level 1 lands on the menu surface, and level 0 IS the page', () => {
    for (const { theme, label } of themes()) {
      expect([label, resolveSurfaceLevel(theme, 0).background]).toEqual([label, theme.colors.background]);
      // Not byte-for-byte in dark (the menu surface is a ramp stop, the rung is
      // a step off the page) — but closer than the JND, so adopting the API is
      // not a repaint.
      const drift = contrastRatio(resolveSurfaceLevel(theme, 1).background, resolveMenuPalette(theme).surface);
      expect([label, drift < FILL_JND]).toEqual([label, true]);
    }
  });

  it('exposes the two primitives the rungs are built from', () => {
    const theme = buildTheme('blue', 'dark');
    const page = theme.colors.background;
    expect(resolveSurfaceLevel(theme, 1).background).toBe(surfaceFillOn(theme, page));
    expect(resolveSurfaceLevel(theme, 0).border).toBe(hairlineOn(theme, page));
  });
});
