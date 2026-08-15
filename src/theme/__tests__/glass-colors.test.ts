/**
 * What a label on a GLASS surface is actually legible against — and, just as
 * load-bearing, what it is NOT.
 *
 * `accent-colors.test.ts` already walks every tone x fill x preset x mode and
 * composites the `*Subtle` tint over the PAGE. That is the right measurement
 * for a chip sitting on the page and the wrong one here, because a glass pane
 * has an extra layer on native (`expo-blur` cannot be asked for a blur radius
 * without also painting a tint of its own — one `intensity` drives both) and
 * because its fill is the brand token at {@link GLASS_FILL_ALPHA}, not the
 * `*Subtle` pair.
 *
 * ── THE BACKDROP RANGE IS THE WHOLE ARGUMENT ────────────────────────────────
 *
 * An earlier version of this gate asserted AA over pure white AND pure black,
 * on the reasoning that "a glass surface floats OVER content by definition".
 * The arithmetic was right and the premise was wrong: satisfying it forces the
 * material to 0.76 opacity, which is a near-opaque card with a blur behind it
 * rather than glass, and it is what shipped the washed-out button this replaces.
 *
 * The surfaces a `Button` sits on are Bloom's own and are enumerable, so that
 * is what {@link SURFACE_KEYS} lists. The two halves below are therefore both
 * assertions, and the second is what stops the first from being satisfiable by
 * simply making the pane opaque again:
 *
 *   1. over Bloom's neutral surfaces, EVERY combination clears AA;
 *   2. over pure white / pure black, a LARGE SHARE still does not — because a
 *      material that survived arbitrary content would no longer be translucent.
 *
 * The reference this is ported from fails (2) as well: its own near-black label
 * measures 4.05 over a mid-tone photo and 1.20 over black. The variant for that
 * case is `inverse`, which is opaque.
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
 * material would move the measurement and the expectation together and the suite
 * would stay green through a real regression.
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
 * Every neutral surface in `ThemeColors` a control can be laid on — the honest
 * backdrop range, and the reason the material can stay at the reference's 25%.
 *
 * Enumerated from the type rather than sampled: `background` is the page,
 * `backgroundSecondary`/`backgroundTertiary` are `--surface`/`--popover`,
 * `card` is the lightest surface and `contrast50` is `--muted`. Anything a
 * future palette adds has to join this list or the range claim above stops
 * being true.
 */
const SURFACE_KEYS = [
  'background',
  'backgroundSecondary',
  'backgroundTertiary',
  'card',
  'contrast50',
] as const satisfies ReadonlyArray<keyof ThemeColors>;

/**
 * The brand fills a glass surface is painted in — the resolved tokens, since
 * that is what `resolveGlassColors` now takes. `Button` uses the first two;
 * the rest are here so the material is measured across the whole palette's
 * range of lightness and chroma rather than on one hue.
 */
const TONES: AccentTone[] = ['default', 'primary', 'success', 'warning', 'error', 'info'];

function fillsOf(colors: ThemeColors): string[] {
  return TONES.map((tone) => resolveAccentColors(colors, tone, 'solid').background);
}

/**
 * The ratio a user sees: the label over the whole stack, composited bottom-up.
 *
 * The sheen is included at its darkest point — the bottom stop, black at 2% —
 * because that is where a light label has the least to work with, and a
 * measurement taken at the surface's midpoint would miss it.
 */
function surfaceOver(
  colors: ThemeColors,
  fill: string,
  isDark: boolean,
  backdrop: Rgba,
  platform: 'web' | 'native',
): Rgba {
  const glass = resolveGlassColors(colors, fill);
  const material = platform === 'native' ? over(blurTint(isDark), backdrop) : backdrop;
  const tinted = over(parse(glass.fill), material);
  return over(parse(GLASS_SHEEN.bottom), tinted);
}

function measure(
  colors: ThemeColors,
  fill: string,
  isDark: boolean,
  backdrop: Rgba,
  platform: 'web' | 'native',
): number {
  const surface = surfaceOver(colors, fill, isDark, backdrop, platform);
  return contrast(surface, over(parse(resolveGlassColors(colors, fill).foreground), surface));
}

const PRESETS = Object.keys(APP_COLOR_PRESETS) as AppColorName[];
const MODES = ['light', 'dark'] as const;
const PLATFORMS = ['web', 'native'] as const;

/** WCAG AA for normal-size text. A button label is not large text. */
const AA = 4.5;

interface Row {
  name: string;
  ratio: number;
}

function walk(backdropsOf: (colors: ThemeColors) => Array<[string, Rgba]>): Record<string, Row[]> {
  const out: Record<string, Row[]> = { web: [], native: [] };
  for (const preset of PRESETS) {
    for (const mode of MODES) {
      const colors = buildTheme(preset, mode).colors;
      for (const fill of fillsOf(colors)) {
        for (const [backdropName, backdrop] of backdropsOf(colors)) {
          for (const platform of PLATFORMS) {
            out[platform]?.push({
              name: `${preset}/${mode}/${fill} over ${backdropName}`,
              ratio: measure(colors, fill, mode === 'dark', backdrop, platform),
            });
          }
        }
      }
    }
  }
  return out;
}

const onBloomSurfaces = walk((colors) =>
  SURFACE_KEYS.map((key) => [key, parse(colors[key])] as [string, Rgba]),
);
const onArbitraryContent = walk(() => [
  ['white', WHITE],
  ['black', BLACK],
]);

describe('glass surface legibility', () => {
  it('reads a real matrix', () => {
    // Vacuity floors: an empty walk reports no failures either.
    expect(PRESETS.length).toBeGreaterThanOrEqual(15);
    expect(TONES).toHaveLength(6);
    expect(SURFACE_KEYS).toHaveLength(5);
    for (const platform of PLATFORMS) {
      expect(onBloomSurfaces[platform]).toHaveLength(
        PRESETS.length * MODES.length * TONES.length * SURFACE_KEYS.length,
      );
      expect(onArbitraryContent[platform]).toHaveLength(
        PRESETS.length * MODES.length * TONES.length * 2,
      );
    }
  });

  it('reproduces the installed expo-blur material, so the native numbers mean something', () => {
    // Positive control on the COPIED constant. If expo-blur changes its tint
    // maths, this fails and the native ratios are known to be stale — rather
    // than both moving together and reporting a comfortable pass.
    //
    // Read as SOURCE rather than imported: expo-blur ships ESM and is not in
    // this project's jest transform whitelist, and adding it there to run one
    // assertion would change what every other suite loads.
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

  it('clears AA on every Bloom surface a control can sit on, on BOTH platform stacks', () => {
    for (const platform of PLATFORMS) {
      const failures = (onBloomSurfaces[platform] ?? [])
        .filter((row) => row.ratio < AA)
        .map((row) => `${platform}: ${row.name}: ${row.ratio.toFixed(2)}`)
        .sort();
      expect(failures).toEqual([]);
    }
  });

  it('is STILL TRANSLUCENT — over arbitrary content most of the matrix fails', () => {
    // The half that keeps the pass above honest. "Clears AA everywhere Bloom
    // paints it" is trivially satisfiable by making the pane opaque, which is
    // exactly the regression that shipped once: a neutral scrim taking the
    // stack to 0.76 opacity, at which point the brand contributed 3% of the
    // pixel and the button read as near-white with a coloured rim.
    //
    // Stated as a floor rather than an exact count so a palette change cannot
    // fail it spuriously, and as a MAJORITY so it cannot be satisfied by one
    // stubborn combination.
    for (const platform of PLATFORMS) {
      const rows = onArbitraryContent[platform] ?? [];
      const failures = rows.filter((row) => row.ratio < AA).length;
      expect(failures).toBeGreaterThan(rows.length / 3);
    }
  });

  it('carries the reference fill alpha, and no scrim beside it', () => {
    // The material is ONE translucent layer over the backdrop. If a second
    // opaque-ish layer were reintroduced the composite would stop matching this
    // arithmetic, which is the same composite the rows above are built from.
    const colors = buildTheme('oxy', 'light').colors;
    const glass = resolveGlassColors(colors, colors.primary);
    expect(parse(glass.fill).a).toBe(GLASS_FILL_ALPHA);
    expect(GLASS_FILL_ALPHA).toBe(0.25);
    // …and the hairline is the SAME hue at full strength — the edge of the pane,
    // not a decorative outline in some other colour.
    expect(glass.hairline).toBe(colors.primary);
    expect(parse(glass.fill)).toMatchObject(
      (({ r, g, b }) => ({ r, g, b }))(parse(colors.primary)),
    );
  });

  it('states the blur radius once, and both platforms read it from there', () => {
    // The web filter is the reference's verbatim — a blur and NOTHING else. An
    // added `saturate()` (which is expo-blur's, not the reference's) is visibly
    // different over a colourful backdrop, so it is asserted absent rather than
    // left to a reviewer's eye.
    expect(GLASS_BLUR_FILTER).toBe(`blur(${GLASS_BLUR_RADIUS_PX}px)`);
    expect(GLASS_BLUR_FILTER).not.toContain('saturate');
    expect(GLASS_BLUR_RADIUS_PX).toBe(10);
    // The native intensity is DERIVED from that radius through expo-blur's web
    // formula, so the two cannot drift apart by editing one.
    expect(GLASS_BLUR_INTENSITY * 0.2).toBe(GLASS_BLUR_RADIUS_PX);
  });

  it('builds the web sheen gradient from the same stops the native Svg uses', () => {
    // The web fork sets `background-image` and the native one draws an `Svg`
    // `LinearGradient`; both read `GLASS_SHEEN`. Deriving the CSS string is what
    // stops a stop from being edited on one platform only.
    expect(GLASS_SHEEN_GRADIENT).toContain(GLASS_SHEEN.top);
    expect(GLASS_SHEEN_GRADIENT).toContain(GLASS_SHEEN.bottom);
    expect(GLASS_SHEEN_GRADIENT).toContain(`${GLASS_SHEEN.middleStop * 100}%`);
  });

  it('and a known-bad pairing still fails, so the threshold is doing work', () => {
    // White on a light-mode glass surface — the pairing `accent-colors.ts`
    // documents as one of the three defects it exists to prevent. It exercises
    // the same `parse` → `over` → `contrast` path as every row above, so a
    // broken helper cannot leave the assertions green.
    const colors = buildTheme('oxy', 'light').colors;
    const surface = surfaceOver(colors, colors.primary, false, parse(colors.background), 'web');
    expect(contrast(surface, WHITE)).toBeLessThan(AA);
  });
});
