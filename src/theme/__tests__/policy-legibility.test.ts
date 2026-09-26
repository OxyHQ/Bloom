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
import { APP_COLOR_NAMES, APP_COLOR_PRESETS, type AppColorName } from '../color-presets';
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

  /**
   * The explicit-pinned-accent case — a consumer app (via `BloomProvider`'s
   * `secondaryColor`/`tertiaryColor`) or a Bloom preset's own declared
   * `secondaryHex`/`tertiaryHex` pins that accent to a REAL brand colour
   * instead of letting the variant derive it from the seed's hue-rotation.
   * Every assertion above only ever exercises the derived-from-seed accents
   * `APP_COLOR_PRESETS` builds internally with no `accents` argument, so a bug
   * that only manifests once a caller pins its own hex had nothing here to
   * catch it — which is exactly how the tertiary `pinnedAction` regression
   * shipped (and kept shipping in ~30 of Bloom's own presets that declare a
   * `tertiaryHex`, not just a consumer's pin).
   */
  describe('explicit pinned accents', () => {
    const seedPreset: AppColorName = 'oxy';

    // A spread of real-looking brand hexes across hue, tone and chroma —
    // deliberately including Willo's own pinned pair (`#625007` / `#8e3205`),
    // the exact values that shipped the tertiary light/dark collapse.
    const PINNED_HEXES = [
      '#625007',
      '#8e3205',
      '#9a153d',
      '#b74b12',
      '#006f7a',
      '#6a1fd2',
      '#ffb000',
      '#087a3e',
      '#00537f',
      '#5c3000',
      '#79452a',
      '#e08932',
    ];

    const pinnedFailures: string[] = [];
    const pinnedAvoidableBlack: string[] = [];
    const pinnedIdentical: string[] = [];
    let pinnedChecked = 0;

    for (const hex of PINNED_HEXES) {
      for (const role of ['secondary', 'tertiary'] as const) {
        const accents = role === 'secondary' ? { secondaryHex: hex } : { tertiaryHex: hex };
        const light = getResolvedTokens(seedPreset, 'light', accents);
        const dark = getResolvedTokens(seedPreset, 'dark', accents);

        for (const [label, tokens] of [
          ['light', light],
          ['dark', dark],
        ] as const) {
          const fill = parse(tokens[`--${role}`] ?? '');
          const foreground = parse(tokens[`--${role}-foreground`] ?? '');
          pinnedChecked += 1;
          const ratio = contrast(fill, foreground);
          if (ratio < AA) pinnedFailures.push(`${hex}/${label} --${role} ${ratio.toFixed(2)}`);
          if (foreground.r === 0 && contrast(fill, WHITE) >= AA) {
            pinnedAvoidableBlack.push(`${hex}/${label} --${role}`);
          }
        }

        // The fill itself — the tone the engine actually picked — is the real
        // invariant. The foreground is NOT: it is a two-value binary (pure white
        // or pure black, whichever is AA-legible against that exact fill tone),
        // so two genuinely different fill tones legitimately land on the SAME
        // foreground (e.g. a mid-tone light fill and a mid-tone dark fill can
        // both correctly need black) — that is not a bug, so it is not asserted
        // here. Only the fill collapsing to one identical colour in both modes
        // is.
        if (light[`--${role}`] === dark[`--${role}`]) {
          pinnedIdentical.push(`${hex} --${role}`);
        }
      }
    }

    it('covers every pinned hex x role x mode', () => {
      expect(pinnedChecked).toBe(PINNED_HEXES.length * 2 * 2);
    });

    it('every pinned fill carries its own foreground at AA', () => {
      expect(pinnedFailures).toEqual([]);
    });

    it('never picks black where white is legible, for a pinned accent', () => {
      expect(pinnedAvoidableBlack).toEqual([]);
    });

    // The regression this exists for: `pinnedAction` (the tertiary-only branch
    // that keeps a deliberately paired action near its hue's vivid peak) floored
    // BOTH modes on `peakTone(hue)` with only the FLOOR differing between them —
    // `LIGHT_FILL_FLOOR` vs `DARK_ACCENT_FLOOR` — so for any hue whose peak sat
    // above both floors (the common case) the floor never bound anything and
    // light/dark rendered the IDENTICAL fill. A single-mode check cannot see
    // that; this is the assertion that would catch a silent revert.
    it('a pinned accent renders a different fill in each mode', () => {
      expect(pinnedIdentical).toEqual([]);
    });

    // Willo's own exact configuration (`BloomProvider seed="#00537f"
    // secondaryColor="#625007" tertiaryColor="#8e3205"`), pinning BOTH accents
    // at once — the real-world shape the bug shipped in.
    it('matches an app pinning both secondary and tertiary at once (Willo)', () => {
      const accents = { secondaryHex: '#625007', tertiaryHex: '#8e3205' };
      for (const mode of ['light', 'dark'] as const) {
        const tokens = getResolvedTokens(seedPreset, mode, accents);
        for (const role of ['secondary', 'tertiary'] as const) {
          const fill = parse(tokens[`--${role}`] ?? '');
          const foreground = parse(tokens[`--${role}-foreground`] ?? '');
          expect(contrast(fill, foreground)).toBeGreaterThanOrEqual(AA);
        }
      }
      const light = getResolvedTokens(seedPreset, 'light', accents);
      const dark = getResolvedTokens(seedPreset, 'dark', accents);
      expect(dark['--tertiary']).not.toBe(light['--tertiary']);
      expect(dark['--secondary']).not.toBe(light['--secondary']);
    });
  });

  // The two modes want opposite things and the suite has to state the direction:
  // structural/deep on white, vivid/bright on black. Every pair can remain AA
  // while accidentally collapsing to the same heavy fill, so contrast alone is
  // not an instrument for this rule.
  it('keeps identity deep in light and moves it toward its vivid peak in dark', () => {
    // Authored brand schemes (`tokens`) choose their own fill and label; this
    // pins the policy's derivation, and the AA checks above still cover them.
    const chromatic = APP_COLOR_NAMES.filter(
      (name) =>
        !isColourlessSeed(APP_COLOR_PRESETS[name].hex) && APP_COLOR_PRESETS[name].tokens === undefined,
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
