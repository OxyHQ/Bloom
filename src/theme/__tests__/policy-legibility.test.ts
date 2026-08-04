/**
 * The legibility gate for the colour policy.
 *
 * Every accent and status family is generated, not authored, so nothing else in
 * the suite can notice when a tuning change makes a label unreadable. This walks
 * the full matrix — every preset x 2 modes x 7 families — and asserts the property
 * a user actually perceives.
 *
 * Two failure shapes it exists to catch, both of which have already happened:
 *
 * - A pair that lands just under AA. Contrast is decided on the QUANTIZED
 *   colour: an earlier version chose tones with the engine's continuous
 *   tone-ratio and shipped 135 pairs at a measured 4.49.
 * - Black on a fill where white was legible. Foregrounds must follow the fill's
 *   tone rather than a preference, and a tie once handed 8 presets a black label
 *   on a fill picked specifically to carry white.
 *
 * A `-subtle` token is a translucent tint, so its text member is checked
 * COMPOSITED over the page background — the surface it actually sits on. Checking
 * it against the raw rgba would compare against a colour nobody ever sees.
 */
import { getResolvedTokens } from '../token-registry';
import { APP_COLOR_NAMES, APP_COLOR_PRESETS } from '../color-presets';
import { Hct } from '../color-engine/hct';
import { argbFromHex } from '../color-engine';

const AA = 4.5;

/** Families whose fill must carry its own foreground. */
const FAMILIES = ['primary', 'secondary', 'tertiary', 'success', 'error', 'warning', 'info'] as const;

/** Families that also ship a translucent surface with a text member on it. */
const TINTED = ['primary', 'secondary', 'tertiary', 'success', 'error', 'warning', 'info'] as const;

type Rgba = { r: number; g: number; b: number; a: number };

function parse(value: string): Rgba {
  const parts = (value.match(/[\d.]+/g) ?? []).map(Number);
  return {
    r: parts[0] ?? 0,
    g: parts[1] ?? 0,
    b: parts[2] ?? 0,
    a: parts[3] ?? 1,
  };
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

const WHITE: Rgba = { r: 255, g: 255, b: 255, a: 1 };

describe('colour policy legibility', () => {
  const failures: string[] = [];
  const avoidableBlack: string[] = [];
  let checked = 0;

  for (const preset of APP_COLOR_NAMES) {
    for (const mode of ['light', 'dark'] as const) {
      const tokens = getResolvedTokens(preset, mode);
      const background = parse(tokens['--background'] ?? 'rgb(0 0 0)');

      for (const family of FAMILIES) {
        const fill = parse(tokens[`--${family}`] ?? '');
        const foreground = parse(tokens[`--${family}-foreground`] ?? '');
        checked += 1;
        const ratio = contrast(fill, foreground);
        if (ratio < AA) failures.push(`${preset}/${mode} --${family} ${ratio.toFixed(2)}`);
        // Black chosen where white would have been legible means the foreground
        // rule stopped following the fill's tone.
        if (foreground.r === 0 && contrast(fill, WHITE) >= AA) {
          avoidableBlack.push(`${preset}/${mode} --${family}`);
        }
      }

      for (const family of TINTED) {
        const tint = over(parse(tokens[`--${family}-subtle`] ?? ''), background);
        const text = parse(tokens[`--${family}-text`] ?? '');
        checked += 1;
        const ratio = contrast(tint, text);
        if (ratio < AA) {
          failures.push(`${preset}/${mode} --${family}-text sobre -subtle ${ratio.toFixed(2)}`);
        }
      }
    }
  }

  // Vacuity floor: a broken traversal must not pass as "nothing failed".
  it('covers the whole preset matrix', () => {
    expect(checked).toBe(APP_COLOR_NAMES.length * 2 * (FAMILIES.length + TINTED.length));
    expect(checked).toBeGreaterThan(300);
  });

  it('every fill carries its own foreground at AA', () => {
    expect(failures).toEqual([]);
  });

  it('never picks black where white is legible', () => {
    expect(avoidableBlack).toEqual([]);
  });


  // The regression this exists for has landed twice, both times reported by the
  // user rather than by the suite: a preset rendering the IDENTICAL brand fill in
  // both modes, which is not a theme, just one palette shown twice. It is easy to
  // reintroduce because every individual token stays legible and every other
  // assertion here keeps passing — nothing in a per-mode check can see that the
  // two modes agree.
  //
  // Two distinct mechanisms produced it, which is why the gate is on the OUTPUT
  // rather than on either cause: a tone search that degenerated to its own floor
  // for any seed whose chroma is flat across the search range (pink, purple), and
  // a light floor sharing that same bound, which voided the depth step for a seed
  // whose dark fill already sat on it (pink again, for the opposite reason).
  it('every preset renders a different brand fill in each mode', () => {
    const identical = APP_COLOR_NAMES.filter(
      (preset) =>
        getResolvedTokens(preset, 'light')['--primary'] ===
        getResolvedTokens(preset, 'dark')['--primary'],
    );
    expect(identical).toEqual([]);
  });

  // The two modes want opposite things and the suite has to say which. Applying
  // the budget in LIGHT let a light seed keep its own tone there, so faircoin
  // rendered the same pale lime in both modes — no theme at all. Skipping it in
  // DARK left every Follow button, avatar and chat bubble with a black label.
  // Each half was individually legible, so nothing else could catch either.
  it('the brand fill keeps light exemption-free and dark budgeted', () => {
    // `mono` is not governed by the budget — it has no chroma to preserve, and its
    // dark fill is near-WHITE by design, so it takes a black label on purpose.
    const chromatic = APP_COLOR_NAMES.filter((name) => name !== 'mono');
    const black: number[] = [];
    const white: number[] = [];
    for (const preset of chromatic) {
      // Light admits no exemption: every chromatic preset comes down far enough
      // to carry white, which is what makes faircoin a deep green there and a
      // bright lime in dark rather than the same pale smear twice.
      expect(getResolvedTokens(preset, 'light')['--primary-foreground']).toBe('rgb(255 255 255)');
      const seedTone = Hct.fromInt(argbFromHex(APP_COLOR_PRESETS[preset].hex)).tone;
      (getResolvedTokens(preset, 'dark')['--primary-foreground'] === 'rgb(255 255 255)'
        ? white
        : black
      ).push(seedTone);
    }

    // Dark's split is decided by the SEED'S OWN LIGHTNESS and nothing else: a seed
    // already too light to come down within the budget keeps its tone and takes a
    // black label. So the partition must be ordered — every black-label seed
    // lighter than every white-label one. Counting them instead (an "at most N
    // take black" slack) says nothing about WHICH, passes while the rule inverts,
    // and has to be re-tuned by hand every time a preset is added.
    expect(black.length).toBeGreaterThan(0);
    expect(white.length).toBeGreaterThan(0);
    expect(Math.min(...black)).toBeGreaterThan(Math.max(...white));

    // And the monochrome exception itself, stated rather than tolerated: a fill at
    // each end of the scale, carrying the opposite label.
    expect(getResolvedTokens('mono', 'light')['--primary-foreground']).toBe('rgb(255 255 255)');
    expect(getResolvedTokens('mono', 'dark')['--primary-foreground']).toBe('rgb(0 0 0)');
  });
});
