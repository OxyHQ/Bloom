/**
 * Bloom colour engine — scheme variants.
 *
 * How each variant derives its five tonal palettes from the seed HCT. Faithful
 * port of Material Color Utilities' `Scheme*` families (Apache-2.0), expressed
 * as plain builder functions (our style) rather than subclasses. Fidelity/
 * Content are intentionally left out — they need the temperature-cache complement
 * and aren't useful for Bloom's fixed brand seeds.
 */
import { DynamicScheme } from './dynamic-scheme';
import type { Hct } from './hct';
import { sanitizeDegreesDouble } from './math-utils';
import { TonalPalette } from './tonal-palette';
import { Variant } from './variant';

export type SchemeVariant =
  | 'vivid'
  | 'vibrant'
  | 'expressive'
  | 'tonalSpot'
  | 'neutral'
  | 'monochrome';

/**
 * Optional explicit accent seeds for a scheme. When a source HCT is supplied, its
 * palette is built from that colour itself (keeping the brand hue + chroma) instead
 * of the derived hue-rotation — so a brand with a distinct secondary/tertiary accent
 * (e.g. blue primary + yellow secondary) can PIN its real accent family. The M3 role
 * tones still apply on top (a pinned yellow yields a yellow-hued secondary family:
 * light container, dark on-colour) — that is correct M3 behaviour.
 */
export interface AccentSources {
  secondarySource?: Hct;
  tertiarySource?: Hct;
}

/**
 * Build the accent tonal palette for a role: from the pinned brand colour when a
 * `source` is provided (preserving its hue + chroma), otherwise from the caller's
 * derived rotation. Uses `TonalPalette.fromInt` so the palette keeps the exact
 * brand key colour; the role tones apply the same way for both.
 */
function accentPalette(source: Hct | undefined, derived: () => TonalPalette): TonalPalette {
  return source !== undefined ? TonalPalette.fromInt(source.toInt()) : derived();
}

const VIBRANT_HUES = [0.0, 41.0, 61.0, 101.0, 131.0, 181.0, 251.0, 301.0, 360.0];
const VIBRANT_SECONDARY_ROTATIONS = [18.0, 15.0, 10.0, 12.0, 15.0, 18.0, 15.0, 12.0, 12.0];
const VIBRANT_TERTIARY_ROTATIONS = [35.0, 30.0, 20.0, 25.0, 30.0, 35.0, 30.0, 25.0, 25.0];

const EXPRESSIVE_HUES = [0.0, 21.0, 51.0, 121.0, 151.0, 191.0, 271.0, 321.0, 360.0];
const EXPRESSIVE_SECONDARY_ROTATIONS = [45.0, 95.0, 45.0, 20.0, 45.0, 90.0, 45.0, 45.0, 45.0];
const EXPRESSIVE_TERTIARY_ROTATIONS = [120.0, 120.0, 20.0, 45.0, 20.0, 15.0, 20.0, 120.0, 120.0];

/** Maxed-out colourfulness at each position of the primary palette. */
export function schemeVibrant(
  source: Hct,
  isDark: boolean,
  contrastLevel: number,
  accents: AccentSources = {},
): DynamicScheme {
  return new DynamicScheme({
    sourceColorArgb: source.toInt(),
    variant: Variant.VIBRANT,
    contrastLevel,
    isDark,
    primaryPalette: TonalPalette.fromHueAndChroma(source.hue, 200.0),
    secondaryPalette: accentPalette(accents.secondarySource, () =>
      TonalPalette.fromHueAndChroma(
        DynamicScheme.getRotatedHue(source, VIBRANT_HUES, VIBRANT_SECONDARY_ROTATIONS),
        24.0,
      ),
    ),
    tertiaryPalette: accentPalette(accents.tertiarySource, () =>
      TonalPalette.fromHueAndChroma(
        DynamicScheme.getRotatedHue(source, VIBRANT_HUES, VIBRANT_TERTIARY_ROTATIONS),
        32.0,
      ),
    ),
    neutralPalette: TonalPalette.fromHueAndChroma(source.hue, 10.0),
    neutralVariantPalette: TonalPalette.fromHueAndChroma(source.hue, 12.0),
  });
}

/** Playful, intentionally detached from the seed hue (primary rotated 240°). */
/**
 * Bloom's own brand-vivid scheme. Same vibrant base (max-chroma primary) but the
 * secondary and tertiary accents keep MUCH more chroma than canonical M3 (which
 * intentionally desaturates supporting accents). Neutrals stay low-chroma so
 * surfaces read as clean tinted light/dark. This is what the presets use — the
 * old hand-authored palette felt more vivid than pure M3, and this restores that
 * across the whole primary/secondary/tertiary trio.
 */
export function schemeVivid(
  source: Hct,
  isDark: boolean,
  contrastLevel: number,
  accents: AccentSources = {},
): DynamicScheme {
  return new DynamicScheme({
    sourceColorArgb: source.toInt(),
    variant: Variant.VIBRANT,
    contrastLevel,
    isDark,
    primaryPalette: TonalPalette.fromHueAndChroma(source.hue, 200.0),
    secondaryPalette: accentPalette(accents.secondarySource, () =>
      TonalPalette.fromHueAndChroma(
        DynamicScheme.getRotatedHue(source, VIBRANT_HUES, VIBRANT_SECONDARY_ROTATIONS),
        64.0,
      ),
    ),
    tertiaryPalette: accentPalette(accents.tertiarySource, () =>
      TonalPalette.fromHueAndChroma(
        DynamicScheme.getRotatedHue(source, VIBRANT_HUES, VIBRANT_TERTIARY_ROTATIONS),
        72.0,
      ),
    ),
    neutralPalette: TonalPalette.fromHueAndChroma(source.hue, 10.0),
    neutralVariantPalette: TonalPalette.fromHueAndChroma(source.hue, 12.0),
  });
}

export function schemeExpressive(
  source: Hct,
  isDark: boolean,
  contrastLevel: number,
  accents: AccentSources = {},
): DynamicScheme {
  return new DynamicScheme({
    sourceColorArgb: source.toInt(),
    variant: Variant.EXPRESSIVE,
    contrastLevel,
    isDark,
    primaryPalette: TonalPalette.fromHueAndChroma(sanitizeDegreesDouble(source.hue + 240.0), 40.0),
    secondaryPalette: accentPalette(accents.secondarySource, () =>
      TonalPalette.fromHueAndChroma(
        DynamicScheme.getRotatedHue(source, EXPRESSIVE_HUES, EXPRESSIVE_SECONDARY_ROTATIONS),
        24.0,
      ),
    ),
    tertiaryPalette: accentPalette(accents.tertiarySource, () =>
      TonalPalette.fromHueAndChroma(
        DynamicScheme.getRotatedHue(source, EXPRESSIVE_HUES, EXPRESSIVE_TERTIARY_ROTATIONS),
        32.0,
      ),
    ),
    neutralPalette: TonalPalette.fromHueAndChroma(source.hue + 15, 8.0),
    neutralVariantPalette: TonalPalette.fromHueAndChroma(source.hue + 15, 12.0),
  });
}

/** The Material You default — a calm, balanced treatment of the seed. */
export function schemeTonalSpot(
  source: Hct,
  isDark: boolean,
  contrastLevel: number,
  accents: AccentSources = {},
): DynamicScheme {
  return new DynamicScheme({
    sourceColorArgb: source.toInt(),
    variant: Variant.TONAL_SPOT,
    contrastLevel,
    isDark,
    primaryPalette: TonalPalette.fromHueAndChroma(source.hue, 36.0),
    secondaryPalette: accentPalette(accents.secondarySource, () =>
      TonalPalette.fromHueAndChroma(source.hue, 16.0),
    ),
    tertiaryPalette: accentPalette(accents.tertiarySource, () =>
      TonalPalette.fromHueAndChroma(sanitizeDegreesDouble(source.hue + 60.0), 24.0),
    ),
    neutralPalette: TonalPalette.fromHueAndChroma(source.hue, 6.0),
    neutralVariantPalette: TonalPalette.fromHueAndChroma(source.hue, 8.0),
  });
}

/** Near-greyscale — the seed hue is present only as a whisper. */
export function schemeNeutral(
  source: Hct,
  isDark: boolean,
  contrastLevel: number,
  accents: AccentSources = {},
): DynamicScheme {
  return new DynamicScheme({
    sourceColorArgb: source.toInt(),
    variant: Variant.NEUTRAL,
    contrastLevel,
    isDark,
    primaryPalette: TonalPalette.fromHueAndChroma(source.hue, 12.0),
    secondaryPalette: accentPalette(accents.secondarySource, () =>
      TonalPalette.fromHueAndChroma(source.hue, 8.0),
    ),
    tertiaryPalette: accentPalette(accents.tertiarySource, () =>
      TonalPalette.fromHueAndChroma(source.hue, 16.0),
    ),
    neutralPalette: TonalPalette.fromHueAndChroma(source.hue, 2.0),
    neutralVariantPalette: TonalPalette.fromHueAndChroma(source.hue, 2.0),
  });
}

/**
 * No colour at all: every palette is greyscale, so the seed's hue is irrelevant
 * and only its tone survives. This is the variant the `isMonochrome` role
 * branches in `color-roles` were written for — they push `primary` to the far end
 * of the scale (tone 0 on a light page, 100 on a dark one) rather than the
 * mid-tone the chromatic curves would pick, which is what keeps a black-and-white
 * theme from reading as a grey one.
 *
 * A pinned accent is ignored on purpose: honouring it would put one coloured
 * family back into a scheme whose entire point is that nothing is coloured.
 */
export function schemeMonochrome(
  source: Hct,
  isDark: boolean,
  contrastLevel: number,
): DynamicScheme {
  const grey = (): TonalPalette => TonalPalette.fromHueAndChroma(source.hue, 0);
  return new DynamicScheme({
    sourceColorArgb: source.toInt(),
    variant: Variant.MONOCHROME,
    contrastLevel,
    isDark,
    primaryPalette: grey(),
    secondaryPalette: grey(),
    tertiaryPalette: grey(),
    neutralPalette: grey(),
    neutralVariantPalette: grey(),
  });
}

const BUILDERS: Record<
  SchemeVariant,
  (s: Hct, d: boolean, c: number, accents: AccentSources) => DynamicScheme
> = {
  vivid: schemeVivid,
  vibrant: schemeVibrant,
  expressive: schemeExpressive,
  tonalSpot: schemeTonalSpot,
  neutral: schemeNeutral,
  monochrome: schemeMonochrome,
};

/**
 * Build a scheme by variant name.
 *
 * `accents` optionally pins the secondary and/or tertiary palette to an explicit
 * brand colour (see {@link AccentSources}); omitted accents keep the variant's
 * derived hue-rotation, so existing callers get byte-identical output.
 */
export function buildScheme(
  variant: SchemeVariant,
  source: Hct,
  isDark: boolean,
  contrastLevel = 0,
  accents: AccentSources = {},
): DynamicScheme {
  return BUILDERS[variant](source, isDark, contrastLevel, accents);
}
