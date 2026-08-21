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
import { isColourlessSeed } from '../color-policy';

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

  // The two modes want opposite things and the suite has to state the direction:
  // structural/deep on white, vivid/bright on black. Every pair can remain AA
  // while accidentally collapsing to the same heavy fill, so contrast alone is
  // not an instrument for this rule.
  it('keeps identity deep in light and moves it toward its vivid peak in dark', () => {
    const chromatic = APP_COLOR_NAMES.filter(
      (name) => !isColourlessSeed(APP_COLOR_PRESETS[name].hex),
    );
    const darkForegrounds = new Set<string>();
    for (const preset of chromatic) {
      const config = APP_COLOR_PRESETS[preset];
      const light = getResolvedTokens(preset, 'light');
      const dark = getResolvedTokens(preset, 'dark');
      expect(light['--primary-foreground']).toBe('rgb(255 255 255)');
      expect(Hct.fromInt(argbFromHex(rgbToHex(dark['--primary'] ?? ''))).tone).toBeGreaterThan(
        Hct.fromInt(argbFromHex(rgbToHex(light['--primary'] ?? ''))).tone,
      );
      darkForegrounds.add(dark['--primary-foreground'] ?? '');

      if (config.label === 'white') {
        expect(dark['--primary-foreground']).toBe('rgb(255 255 255)');
      }
    }

    // Positive controls: vivid peaks genuinely exercise both matched label
    // colours; a blanket foreground would leave the loop above deceptively green.
    expect([...darkForegrounds].sort()).toEqual(['rgb(0 0 0)', 'rgb(255 255 255)']);

    for (const preset of APP_COLOR_NAMES.filter((name) => isColourlessSeed(APP_COLOR_PRESETS[name].hex))) {
      expect(getResolvedTokens(preset, 'light')['--primary-foreground']).toBe('rgb(255 255 255)');
      expect(getResolvedTokens(preset, 'dark')['--primary-foreground']).toBe('rgb(0 0 0)');
    }
  });
});

function rgbToHex(value: string): string {
  const channels = (value.match(/\d+/g) ?? []).map(Number);
  if (channels.length !== 3) throw new Error(`expected rgb colour, received ${value}`);
  return `#${channels.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}
