/**
 * What a label on a GLASS surface is actually legible against — and, just as
 * load-bearing, what it costs.
 *
 * ── WHY THIS GATE LOOKS DIFFERENT FROM THE ONE IT REPLACES ──────────────────
 *
 * At fill alpha 0.25 this file asserted two things: that every combination
 * cleared AA on Bloom's surfaces, and that a LARGE SHARE still failed over pure
 * black and white — the second being the proof that the pane had not been
 * quietly made opaque to satisfy the first.
 *
 * At 0.85 the first is no longer TRUE and the second is no longer a good
 * INSTRUMENT, so both are replaced rather than relaxed:
 *
 *  - The AA claim is now an EXACT ACCOUNT of the compromise (count, band, and
 *    the named preset/mode set), not a threshold. A threshold is what erodes;
 *    an equality fails in both directions, so improving the palette breaks it
 *    just as loudly as regressing it, and either way somebody has to look.
 *  - The translucency proof is now the DIRECT property — does the painted pane
 *    still move when the backdrop moves — rather than the AA-failure proxy. It
 *    is strictly stronger: it reads 0.0 the instant the fill goes opaque, it is
 *    monotonic in the alpha, and it does not depend on which foreground token
 *    the material happens to use. Measured across the alpha sweep: 0.85 → 37.5,
 *    0.90 → 25.0, 0.95 → 12.5, 1.00 → 0.0 (web).
 *
 * Both replacements are mutation-verified in the same commit.
 */
import { readFileSync } from 'node:fs';

import { APP_COLOR_PRESETS, type AppColorName } from '../color-presets';
import { buildTheme } from '../build-theme';
import { resolveAccentColors, type AccentTone } from '../accent-colors';
import {
  GLASS_BLUR_FILTER,
  GLASS_BLUR_INTENSITY,
  GLASS_BLUR_RADIUS_PX,
  GLASS_FILL_ALPHA,
  GLASS_SHEEN,
  GLASS_SHEEN_GRADIENT,
  glassSheenCss,
  resolveGlassColors,
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
 * NATIVE caller cannot decline because `intensity` drives the blur radius and
 * this together. The web fork has no counterpart: CSS `backdrop-filter` is a
 * pure blur, which is why both platforms are measured below.
 *
 * Copied deliberately rather than imported: importing it would make this gate
 * agree with expo-blur by construction, so a version bump that changed the
 * material would move the measurement and the expectation together and the
 * suite would stay green through a real regression.
 */
function blurTint(isDark: boolean): Rgba {
  const opacity = GLASS_BLUR_INTENSITY / 100;
  return isDark
    ? { r: 25, g: 25, b: 25, a: opacity * 0.78 }
    : { r: 249, g: 249, b: 249, a: opacity * 0.78 };
}

const WHITE: Rgba = { r: 255, g: 255, b: 255, a: 1 };
const BLACK: Rgba = { r: 0, g: 0, b: 0, a: 1 };

/**
 * Every neutral surface in `ThemeColors` a control can be laid on — the backdrop
 * range every number below is measured against.
 *
 * Enumerated from the type rather than sampled: `background` is the page,
 * `backgroundSecondary`/`backgroundTertiary` are `--surface`/`--popover`,
 * `card` is the lightest surface and `contrast50` is `--muted`.
 */
const SURFACE_KEYS = [
  'background',
  'backgroundSecondary',
  'backgroundTertiary',
  'card',
  'contrast50',
] as const satisfies ReadonlyArray<keyof ThemeColors>;

const PLATFORMS = ['web', 'native'] as const;
type Platform = (typeof PLATFORMS)[number];

/** WCAG AA for normal-size text. A button label is not large text. */
const AA = 4.5;

const PRESETS = Object.keys(APP_COLOR_PRESETS) as AppColorName[];
const MODES = ['light', 'dark'] as const;

/** The sheen at its darkest point — the bottom stop, black at 2%. */
const SHEEN_BOTTOM = glassSheenCss(GLASS_SHEEN.bottom);

/** The painted pane: fill at its alpha over the backdrop, then the sheen. */
function pane(fill: string, backdrop: Rgba, platform: Platform, isDark: boolean): Rgba {
  const material = platform === 'native' ? over(blurTint(isDark), backdrop) : backdrop;
  return over(parse(SHEEN_BOTTOM), over(parse(resolveGlassColors(fill).fill), material));
}

function labelRatio(fill: string, onFill: string, backdrop: Rgba, platform: Platform, isDark: boolean): number {
  const surface = pane(fill, backdrop, platform, isDark);
  return contrast(surface, over(parse(onFill), surface));
}

/**
 * The two fills `Button` actually paints. Scoped deliberately: the wider fill
 * vocabulary is measured separately below, but no component ships a glass
 * success or warning button today, and a gate that mixes reachable failures
 * with unreachable ones cannot be read.
 */
function buttonFills(c: ThemeColors): Array<{ name: string; fill: string; onFill: string }> {
  return [
    { name: 'primary', fill: c.primary, onFill: c.primaryForeground },
    { name: 'destructive', fill: c.negative, onFill: c.negativeForeground },
  ];
}

/** The whole accent vocabulary, for the material's range rather than Button's. */
const TONES: AccentTone[] = ['default', 'primary', 'success', 'warning', 'error', 'info'];

describe('glass surface legibility', () => {
  it('reads a real matrix', () => {
    // Vacuity floors: an empty walk reports no failures either.
    expect(PRESETS.length).toBeGreaterThanOrEqual(15);
    expect(SURFACE_KEYS).toHaveLength(5);
    expect(TONES).toHaveLength(6);
  });

  it('reproduces the installed expo-blur material, so the native numbers mean something', () => {
    // Positive control on the COPIED constant. If expo-blur changes its tint
    // maths, this fails and the native ratios are known to be stale — rather
    // than both moving together and reporting a comfortable pass.
    const shipped = readFileSync(require.resolve('expo-blur/build/getBackgroundColor.js'), 'utf8');
    expect(shipped).toContain('`rgba(25,25,25,${opacity * 0.78})`');
    expect(shipped).toContain('`rgba(249,249,249,${opacity * 0.78})`');
    expect(shipped).toContain('const opacity = intensity / 100;');
    expect(blurTint(true)).toEqual({ r: 25, g: 25, b: 25, a: (GLASS_BLUR_INTENSITY / 100) * 0.78 });
    expect(blurTint(false)).toEqual({
      r: 249,
      g: 249,
      b: 249,
      a: (GLASS_BLUR_INTENSITY / 100) * 0.78,
    });
  });

  // ── THE COMPROMISE, ACCOUNTED FOR EXACTLY ────────────────────────────────
  //
  // These four assertions replace "everything clears AA", which was true at
  // 0.25 and is not true at 0.85. They are an EQUALITY on the failure set, so
  // the alpha cannot move by a hundredth without one of them going red:
  // measured, 0.86 -> 21 rows, 0.87 -> 14, 0.88 -> 5, 0.89 -> 0.
  //
  // The count came DOWN from 45 when the surface ramp opened up
  // (`color-policy.ts`'s `SURFACE_RAMP`): the pane bleeds toward the surface
  // under it, and three of the five surfaces are now darker, so a white label
  // on them has further to fall before it fails. That is a palette improvement
  // showing up here, not a softened bar — the numbers below were re-measured,
  // not relaxed.

  it('costs EXACTLY 30 of Button primary\'s 180 rows, in a bounded band', () => {
    const failures: Array<{ where: string; ratio: number }> = [];
    let rows = 0;
    for (const preset of PRESETS) {
      for (const mode of MODES) {
        const c = buildTheme(preset, mode).colors;
        const { fill, onFill } = buttonFills(c)[0] as { fill: string; onFill: string };
        for (const key of SURFACE_KEYS) {
          rows++;
          const ratio = labelRatio(fill, onFill, parse(c[key]), 'web', mode === 'dark');
          if (ratio < AA) failures.push({ where: `${preset}/${mode}/${key}`, ratio });
        }
      }
    }
    expect(rows).toBe(PRESETS.length * MODES.length * SURFACE_KEYS.length);
    // The count is exact, not a ceiling. A palette change that fixes some of
    // these fails here too, which is the point: somebody has to look.
    expect(failures).toHaveLength(30);
    // …and the shortfall is BOUNDED. Every failure is a near miss, not a
    // control nobody can read. Without this the count alone would tolerate 30
    // rows at 1.05.
    const worst = Math.min(...failures.map((f) => f.ratio));
    expect(worst).toBeCloseTo(4.17, 1);
    expect(worst).toBeGreaterThan(4.0);
    expect(Math.max(...failures.map((f) => f.ratio))).toBeLessThan(AA);
  });

  it('confines that cost to LIGHT mode and to nine named presets', () => {
    // The SHAPE of the compromise, not just its size. The bleed moves the pane
    // toward the surface under it, so in light mode it lightens — which is the
    // one direction a white label cannot afford. A failure appearing in dark
    // mode would mean something else is wrong, and a count-only assertion
    // would not notice.
    const involved = new Set<string>();
    for (const preset of PRESETS) {
      for (const mode of MODES) {
        const c = buildTheme(preset, mode).colors;
        const { fill, onFill } = buttonFills(c)[0] as { fill: string; onFill: string };
        for (const key of SURFACE_KEYS) {
          if (labelRatio(fill, onFill, parse(c[key]), 'web', mode === 'dark') < AA) {
            involved.add(`${preset}/${mode}`);
          }
        }
      }
    }
    expect([...involved].sort()).toEqual([
      'blue/light',
      'faircoin/light',
      'green/light',
      'mint/light',
      'orange/light',
      'pumpkin/light',
      'rose/light',
      'sky/light',
      'yellow/light',
    ]);
  });

  it('costs the destructive variant NOTHING', () => {
    // The other half of Button's surface, and it is clean — so the compromise
    // above is specific rather than a property of the material. Its floor is
    // pinned too, or "zero failures" would survive the fill drifting toward
    // the line.
    let worst = Infinity;
    for (const preset of PRESETS) {
      for (const mode of MODES) {
        const c = buildTheme(preset, mode).colors;
        const { fill, onFill } = buttonFills(c)[1] as { fill: string; onFill: string };
        for (const key of SURFACE_KEYS) {
          for (const platform of PLATFORMS) {
            worst = Math.min(worst, labelRatio(fill, onFill, parse(c[key]), platform, mode === 'dark'));
          }
        }
      }
    }
    expect(worst).toBeGreaterThan(AA);
    expect(worst).toBeCloseTo(5.32, 1);
  });

  it('beats the alternative label by four-fold, which is why it is the on-fill token', () => {
    // The choice of foreground, kept as a MEASUREMENT rather than a comment.
    // At 0.25 `colors.text` was correct and the on-fill token was not; at 0.85
    // it is the other way round, and this is the number that flipped. If the
    // alpha ever moves back, this assertion is what says the label must move
    // with it.
    let onFillFailures = 0;
    let textFailures = 0;
    let rows = 0;
    for (const preset of PRESETS) {
      for (const mode of MODES) {
        const c = buildTheme(preset, mode).colors;
        for (const tone of TONES) {
          const accent = resolveAccentColors(c, tone, 'solid');
          for (const key of SURFACE_KEYS) {
            const backdrop = parse(c[key]);
            rows++;
            if (labelRatio(accent.background, accent.foreground, backdrop, 'web', mode === 'dark') < AA) {
              onFillFailures++;
            }
            if (labelRatio(accent.background, c.text, backdrop, 'web', mode === 'dark') < AA) {
              textFailures++;
            }
          }
        }
      }
    }
    expect(rows).toBe(PRESETS.length * MODES.length * TONES.length * SURFACE_KEYS.length);
    expect(textFailures).toBeGreaterThan(onFillFailures * 3);
  });

  // ── STILL GLASS, MEASURED DIRECTLY ───────────────────────────────────────

  it('is STILL TRANSLUCENT — the painted pane moves when the backdrop moves', () => {
    // The direct property, replacing the AA-failure proxy the 0.25 gate used.
    // An opaque pane scores 0 here whatever else is true of it, so this is the
    // assertion that stops "make it solid" from being the cheapest way to
    // satisfy everything above.
    //
    // Floors are LITERALS, deliberately: deriving them from GLASS_FILL_ALPHA
    // would move both sides together and measure nothing. Web at 0.85 reads
    // 37.5 and native 22.9 (native is lower because expo-blur's own tint
    // absorbs part of the backdrop before the fill does).
    const FLOOR: Record<Platform, number> = { web: 32, native: 20 };
    for (const platform of PLATFORMS) {
      let smallest = Infinity;
      let where = '';
      for (const preset of PRESETS) {
        for (const mode of MODES) {
          const c = buildTheme(preset, mode).colors;
          for (const tone of TONES) {
            const fill = resolveAccentColors(c, tone, 'solid').background;
            const onWhite = pane(fill, WHITE, platform, mode === 'dark');
            const onBlack = pane(fill, BLACK, platform, mode === 'dark');
            const movement = Math.max(
              Math.abs(onWhite.r - onBlack.r),
              Math.abs(onWhite.g - onBlack.g),
              Math.abs(onWhite.b - onBlack.b),
            );
            if (movement < smallest) {
              smallest = movement;
              where = `${preset}/${mode}/${tone}`;
            }
          }
        }
      }
      // Reported as a string so a failure NAMES the combination rather than
      // printing two bare numbers.
      expect({
        platform,
        worst: where,
        movement: Number(smallest.toFixed(1)),
        floor: FLOOR[platform],
        passes: smallest > FLOOR[platform],
      }).toMatchObject({ passes: true });
    }
  });

  it('holds the fill alpha at the reference value, and the hairline at full strength', () => {
    const colors = buildTheme('oxy', 'light').colors;
    const glass = resolveGlassColors(colors.primary);
    expect(GLASS_FILL_ALPHA).toBe(0.85);
    expect(parse(glass.fill).a).toBe(GLASS_FILL_ALPHA);
    // The hairline is the SAME hue at full strength — the edge of the pane, not
    // a decorative outline in some other colour.
    expect(glass.hairline).toBe(colors.primary);
    const { r, g, b } = parse(colors.primary);
    expect(parse(glass.fill)).toMatchObject({ r, g, b });
  });

  it('keeps the two platform stacks within a couple of levels of each other', () => {
    // At 0.25 this gap was worth a paragraph; at 0.85 expo-blur's tint can only
    // touch the 15% that gets through, so it should be nearly nothing. Asserted
    // rather than assumed, because it widens the moment the alpha moves.
    let widest = 0;
    for (const preset of PRESETS) {
      for (const mode of MODES) {
        const c = buildTheme(preset, mode).colors;
        for (const tone of TONES) {
          const fill = resolveAccentColors(c, tone, 'solid').background;
          for (const key of SURFACE_KEYS) {
            const backdrop = parse(c[key]);
            const w = pane(fill, backdrop, 'web', mode === 'dark');
            const n = pane(fill, backdrop, 'native', mode === 'dark');
            widest = Math.max(
              widest,
              Math.abs(w.r - n.r),
              Math.abs(w.g - n.g),
              Math.abs(w.b - n.b),
            );
          }
        }
      }
    }
    expect(widest).toBeLessThan(4);
    // …and it is not zero, or this would be measuring a native stack that had
    // silently stopped including the blur tint at all.
    expect(widest).toBeGreaterThan(1);
  });

  it('states the blur radius once, and both platforms read it from there', () => {
    // The web filter is the reference's verbatim — a blur and NOTHING else. An
    // added `saturate()` (expo-blur's, not the reference's) is visibly
    // different over a colourful backdrop, so it is asserted absent rather than
    // left to a reviewer's eye.
    expect(GLASS_BLUR_FILTER).toBe(`blur(${GLASS_BLUR_RADIUS_PX}px)`);
    expect(GLASS_BLUR_FILTER).not.toContain('saturate');
    expect(GLASS_BLUR_RADIUS_PX).toBe(10);
    expect(GLASS_BLUR_INTENSITY * 0.2).toBe(GLASS_BLUR_RADIUS_PX);
  });

  it('builds the web sheen gradient from the same stops the native Svg uses', () => {
    expect(GLASS_SHEEN_GRADIENT).toContain(glassSheenCss(GLASS_SHEEN.top));
    expect(GLASS_SHEEN_GRADIENT).toContain(glassSheenCss(GLASS_SHEEN.bottom));
    expect(GLASS_SHEEN_GRADIENT).toContain(`${GLASS_SHEEN.middleStop * 100}%`);
  });

  /**
   * The assertion above pins the two forks to the same VALUES, and that is all
   * it ever pinned — which is exactly why an Android emulator found the pane
   * painting a solid white-to-black wipe over an invisible brand fill while
   * every suite was green. `react-native-svg` takes RGB from `stopColor` and
   * DISCARDS an alpha channel found there, so the one representation that must
   * never reach an SVG stop is a colour with its alpha inside it.
   *
   * This is the shape of the defect rather than its pixels: jest cannot
   * rasterise an SVG gradient, so a pixel assertion here would be theatre. What
   * it can do is refuse the ambiguous representation at the token.
   */
  it('keeps every sheen stop alpha OUT of its colour, where an SVG stop would drop it', () => {
    const stops = [GLASS_SHEEN.top, GLASS_SHEEN.middle, GLASS_SHEEN.bottom];
    expect(stops).toHaveLength(3);
    for (const stop of stops) {
      expect(stop.color).toMatch(/^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/);
      expect(stop.color).not.toContain('rgba');
      expect(typeof stop.opacity).toBe('number');
      expect(stop.opacity).toBeGreaterThanOrEqual(0);
      expect(stop.opacity).toBeLessThanOrEqual(1);
    }
    // A positive control on the check itself: the pre-fix spelling must FAIL the
    // same predicate, or this only asserts that strings are strings.
    expect('rgba(255, 255, 255, 0.02)').not.toMatch(/^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/);
    // And the sheen must still be a sheen — an all-zero opacity set would pass
    // every line above while painting nothing.
    expect(stops.some((s) => s.opacity > 0)).toBe(true);
  });

  it('and a known-bad pairing still fails, so the threshold is doing work', () => {
    // `colors.text` on a light-mode glass pane — the pairing this material used
    // at 0.25 and cannot use at 0.85. It exercises the same parse → over →
    // contrast path as every row above, so a broken helper cannot leave the
    // assertions green.
    const colors = buildTheme('oxy', 'light').colors;
    expect(
      labelRatio(colors.primary, colors.text, parse(colors.background), 'web', false),
    ).toBeLessThan(AA);
  });
});
