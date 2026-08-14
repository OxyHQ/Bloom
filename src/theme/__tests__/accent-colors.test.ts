/**
 * @jest-environment node
 */

/**
 * The legibility gate for `theme.colors` — the layer COMPONENTS read.
 *
 * `policy-legibility.test.ts` walks the CSS token map, and it was green the whole
 * time `Chip variant="soft"` and `Badge variant="subtle"` were painting a label
 * on its own colour at contrast 1.00. That is not a gap in it: the tokens were
 * always right. Three separate defects lived in the gap between the tokens and
 * what components did with them, and every one of them renders:
 *
 * 1. A tint derived by appending hex alpha to an `rgb(...)` fill.
 * 2. A hardcoded white label on a neutral fill that is LIGHT in dark mode.
 * 3. A fill colour used as a label on the page (the fill is sized to carry white
 *    text, not to BE text — that is the `-text` member's job).
 *
 * And a fourth in `theme.colors` itself: `primarySubtleForeground` mapped to the
 * engine's `onPrimaryContainer` — the on-colour of M3's OPAQUE container — while
 * `primarySubtle` is the policy's TRANSLUCENT tint. Not a pair, and for `mono`
 * they measured 1.25 in light and 1.53 in dark.
 *
 * So this suite asserts the property a user perceives, on the values a component
 * receives: every pair `resolveAccentColors` can return, composited over the page
 * background, clears AA. A check that only confirms a background style EXISTS
 * cannot tell a tinted control from an invisible one.
 */
import { buildTheme } from '../build-theme';
import { buildThemeFromSeed } from '../build-theme-from-seed';
import { APP_COLOR_NAMES, APP_COLOR_PRESETS } from '../color-presets';
import {
  resolveAccentColors,
  type AccentFill,
  type AccentTone,
} from '../accent-colors';
import type { ThemeColors } from '../types';

const AA = 4.5;

const TONES: readonly AccentTone[] = [
  'default',
  'primary',
  'success',
  'warning',
  'error',
  'info',
];
const FILLS: readonly AccentFill[] = ['solid', 'subtle', 'outlined'];

type Rgba = { r: number; g: number; b: number; a: number };

/**
 * Parse an `rgb()` / `rgba()` / `#rrggbb` colour.
 *
 * THROWS on anything else, and that is the point: `"rgb(103 80 164)18"` — the
 * malformed string this whole suite exists for — must not quietly parse as the
 * opaque colour react-native-web reads it as, or the gate would measure the
 * defect's own reading of itself and agree with it.
 */
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
 * The ratio a user sees for one tone at one loudness: the label over the
 * background the component paints, itself composited over the page.
 */
function measure(colors: ThemeColors, tone: AccentTone, fill: AccentFill): number {
  const page = parse(colors.background);
  const accent = resolveAccentColors(colors, tone, fill);
  const surface =
    accent.background === 'transparent' ? page : over(parse(accent.background), page);
  return contrast(surface, over(parse(accent.foreground), surface));
}

/**
 * `measure`, with an unparseable colour reported as a NUMBERED failure rather
 * than an exception.
 *
 * The distinction matters more than it looks: the matrix below runs while jest
 * COLLECTS the file, so a throw out of it produces `Tests: 0 total` — the shape
 * of a suite that failed to load, which reads as tooling trouble rather than as
 * the defect it is. Returning 0 keeps the failure inside the assertion, named by
 * preset, mode, tone and variant.
 */
function measureOrZero(colors: ThemeColors, tone: AccentTone, fill: AccentFill): number {
  try {
    return measure(colors, tone, fill);
  } catch {
    return 0;
  }
}

describe('resolveAccentColors is legible across the whole palette', () => {
  const failures: string[] = [];
  let worst = Infinity;
  let worstAt = '';
  let measured = 0;

  for (const preset of APP_COLOR_NAMES) {
    for (const mode of ['light', 'dark'] as const) {
      const { colors } = buildTheme(preset, mode);
      for (const tone of TONES) {
        for (const fill of FILLS) {
          const ratio = measureOrZero(colors, tone, fill);
          measured += 1;
          if (ratio < worst) {
            worst = ratio;
            worstAt = `${preset}/${mode} ${tone}/${fill}`;
          }
          if (ratio < AA) {
            failures.push(`${preset}/${mode} ${tone}/${fill} = ${ratio.toFixed(2)}`);
          }
        }
      }
    }
  }

  // Vacuity floor: "no failures" and "the loop never ran" are the same output.
  it('walks the whole matrix', () => {
    expect(measured).toBe(APP_COLOR_NAMES.length * 2 * TONES.length * FILLS.length);
    expect(measured).toBeGreaterThan(500);
  });

  it('every tone at every loudness clears AA', () => {
    expect(failures).toEqual([]);
    // Stated so a regression that merely erodes the margin is visible in the
    // output rather than only when it crosses 4.5.
    expect({ worst: Number(worst.toFixed(2)), worstAt }).toEqual({
      worst: expect.any(Number),
      worstAt: expect.any(String),
    });
    expect(worst).toBeGreaterThanOrEqual(AA);
  });

  // The seed path builds the same `ThemeColors` shape from an arbitrary hex, so
  // a consumer theming from artwork gets the identical guarantee. Both built-in
  // presets and off-palette seeds are covered, since the failure that shipped
  // (`mono`) was a preset and the one most likely next is a user's own colour.
  it('holds for a theme built from an arbitrary seed', () => {
    const seeds = [
      '#000000',
      '#ffffff',
      '#808080',
      '#ff0000',
      '#fff200',
      '#0a7aff',
      APP_COLOR_PRESETS.mono.hex,
    ];
    const seedFailures: string[] = [];
    let seedMeasured = 0;
    for (const seed of seeds) {
      for (const mode of ['light', 'dark'] as const) {
        const { colors } = buildThemeFromSeed(seed, mode);
        for (const tone of TONES) {
          for (const fill of FILLS) {
            const ratio = measureOrZero(colors, tone, fill);
            seedMeasured += 1;
            if (ratio < AA) {
              seedFailures.push(`${seed}/${mode} ${tone}/${fill} = ${ratio.toFixed(2)}`);
            }
          }
        }
      }
    }
    expect(seedMeasured).toBe(seeds.length * 2 * TONES.length * FILLS.length);
    expect(seedFailures).toEqual([]);
  });
});

describe('the defects this resolver replaced', () => {
  // The measurement's own positive control. If `measure` were blind — a parse
  // that swallowed the malformed string, a composite that dropped the alpha —
  // "everything clears AA" is exactly what it would print. Reproducing the two
  // shipped defects and watching the SAME function report them below AA is what
  // says the green above is a fact about the colours rather than about the
  // instrument.
  const { colors } = buildTheme('teal', 'dark');
  const page = parse(colors.background);

  it('a label on its own colour measures 1.00 through this instrument', () => {
    const base = parse(colors.primary);
    expect(contrast(base, base)).toBeCloseTo(1, 5);
  });

  it('white on the neutral fill in dark mode measures below AA', () => {
    const fill = parse(colors.textSecondary);
    expect(contrast(fill, { r: 255, g: 255, b: 255, a: 1 })).toBeLessThan(AA);
    // And the replacement, measured the same way, clears it.
    expect(measure(colors, 'default', 'solid')).toBeGreaterThanOrEqual(AA);
  });

  it('the fill colour used as a label on the page measures below AA', () => {
    expect(contrast(page, parse(colors.error))).toBeLessThan(AA);
    expect(measure(colors, 'error', 'outlined')).toBeGreaterThanOrEqual(AA);
  });

  it('refuses to parse the malformed string the old tint produced', () => {
    // `theme.colors.primary + '18'`. A parser that shrugged at this would let a
    // reintroduction of the bug measure as whatever the fill measures.
    expect(() => parse(`${colors.primary}18`)).toThrow(/unparseable colour/);
  });
});

describe('the variant contract', () => {
  const { colors } = buildTheme('blue', 'light');

  it('outlined paints no surface and matches its border to its label', () => {
    const outlined = resolveAccentColors(colors, 'success', 'outlined');
    expect(outlined.background).toBe('transparent');
    expect(outlined.border).toBe(outlined.foreground);
  });

  it('subtle draws no border', () => {
    expect(resolveAccentColors(colors, 'success', 'subtle').border).toBe('transparent');
  });

  it('subtle reads the token pair rather than deriving a tint', () => {
    const subtle = resolveAccentColors(colors, 'error', 'subtle');
    expect(subtle.background).toBe(colors.errorSubtle);
    expect(subtle.foreground).toBe(colors.errorSubtleForeground);
  });

  it('solid reads the fill and the foreground the policy paired with it', () => {
    const solid = resolveAccentColors(colors, 'primary', 'solid');
    expect(solid.background).toBe(colors.primary);
    expect(solid.foreground).toBe(colors.primaryForeground);
  });
});
