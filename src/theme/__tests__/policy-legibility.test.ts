/**
 * The legibility gate for the colour policy.
 *
 * Every accent and status family is generated, not authored, so nothing else in
 * the suite can notice when a tuning change makes a label unreadable. This walks
 * the full matrix — 13 presets x 2 modes x 7 families — and asserts the property
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
import { APP_COLOR_NAMES } from '../color-presets';

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


  // The two modes want opposite things and the suite has to say which. Applying
  // the budget in LIGHT let a light seed keep its own tone there, so faircoin
  // rendered the same pale lime in both modes — no theme at all. Skipping it in
  // DARK left every Follow button, avatar and chat bubble with a black label.
  // Each half was individually legible, so nothing else could catch either.
  it('the brand fill keeps light exemption-free and dark budgeted', () => {
    const white = { light: 0, dark: 0 };
    for (const preset of APP_COLOR_NAMES) {
      for (const mode of ['light', 'dark'] as const) {
        if (getResolvedTokens(preset, mode)['--primary-foreground'] === 'rgb(255 255 255)') {
          white[mode] += 1;
        }
      }
    }
    // Light admits no exemption, so every preset carries white there. Dark keeps
    // the budget, so the seeds that are already light keep their colour instead.
    expect(white.light).toBe(APP_COLOR_NAMES.length);
    expect(white.dark).toBeGreaterThan(APP_COLOR_NAMES.length - 4);
  });
});
