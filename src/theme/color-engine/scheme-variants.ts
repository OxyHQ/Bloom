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

export type SchemeVariant = 'vibrant' | 'expressive' | 'tonalSpot' | 'neutral';

const VIBRANT_HUES = [0.0, 41.0, 61.0, 101.0, 131.0, 181.0, 251.0, 301.0, 360.0];
const VIBRANT_SECONDARY_ROTATIONS = [18.0, 15.0, 10.0, 12.0, 15.0, 18.0, 15.0, 12.0, 12.0];
const VIBRANT_TERTIARY_ROTATIONS = [35.0, 30.0, 20.0, 25.0, 30.0, 35.0, 30.0, 25.0, 25.0];

const EXPRESSIVE_HUES = [0.0, 21.0, 51.0, 121.0, 151.0, 191.0, 271.0, 321.0, 360.0];
const EXPRESSIVE_SECONDARY_ROTATIONS = [45.0, 95.0, 45.0, 20.0, 45.0, 90.0, 45.0, 45.0, 45.0];
const EXPRESSIVE_TERTIARY_ROTATIONS = [120.0, 120.0, 20.0, 45.0, 20.0, 15.0, 20.0, 120.0, 120.0];

/** Maxed-out colourfulness at each position of the primary palette. */
export function schemeVibrant(source: Hct, isDark: boolean, contrastLevel: number): DynamicScheme {
  return new DynamicScheme({
    sourceColorArgb: source.toInt(),
    variant: Variant.VIBRANT,
    contrastLevel,
    isDark,
    primaryPalette: TonalPalette.fromHueAndChroma(source.hue, 200.0),
    secondaryPalette: TonalPalette.fromHueAndChroma(
      DynamicScheme.getRotatedHue(source, VIBRANT_HUES, VIBRANT_SECONDARY_ROTATIONS),
      24.0,
    ),
    tertiaryPalette: TonalPalette.fromHueAndChroma(
      DynamicScheme.getRotatedHue(source, VIBRANT_HUES, VIBRANT_TERTIARY_ROTATIONS),
      32.0,
    ),
    neutralPalette: TonalPalette.fromHueAndChroma(source.hue, 10.0),
    neutralVariantPalette: TonalPalette.fromHueAndChroma(source.hue, 12.0),
  });
}

/** Playful, intentionally detached from the seed hue (primary rotated 240°). */
export function schemeExpressive(source: Hct, isDark: boolean, contrastLevel: number): DynamicScheme {
  return new DynamicScheme({
    sourceColorArgb: source.toInt(),
    variant: Variant.EXPRESSIVE,
    contrastLevel,
    isDark,
    primaryPalette: TonalPalette.fromHueAndChroma(sanitizeDegreesDouble(source.hue + 240.0), 40.0),
    secondaryPalette: TonalPalette.fromHueAndChroma(
      DynamicScheme.getRotatedHue(source, EXPRESSIVE_HUES, EXPRESSIVE_SECONDARY_ROTATIONS),
      24.0,
    ),
    tertiaryPalette: TonalPalette.fromHueAndChroma(
      DynamicScheme.getRotatedHue(source, EXPRESSIVE_HUES, EXPRESSIVE_TERTIARY_ROTATIONS),
      32.0,
    ),
    neutralPalette: TonalPalette.fromHueAndChroma(source.hue + 15, 8.0),
    neutralVariantPalette: TonalPalette.fromHueAndChroma(source.hue + 15, 12.0),
  });
}

/** The Material You default — a calm, balanced treatment of the seed. */
export function schemeTonalSpot(source: Hct, isDark: boolean, contrastLevel: number): DynamicScheme {
  return new DynamicScheme({
    sourceColorArgb: source.toInt(),
    variant: Variant.TONAL_SPOT,
    contrastLevel,
    isDark,
    primaryPalette: TonalPalette.fromHueAndChroma(source.hue, 36.0),
    secondaryPalette: TonalPalette.fromHueAndChroma(source.hue, 16.0),
    tertiaryPalette: TonalPalette.fromHueAndChroma(sanitizeDegreesDouble(source.hue + 60.0), 24.0),
    neutralPalette: TonalPalette.fromHueAndChroma(source.hue, 6.0),
    neutralVariantPalette: TonalPalette.fromHueAndChroma(source.hue, 8.0),
  });
}

/** Near-greyscale — the seed hue is present only as a whisper. */
export function schemeNeutral(source: Hct, isDark: boolean, contrastLevel: number): DynamicScheme {
  return new DynamicScheme({
    sourceColorArgb: source.toInt(),
    variant: Variant.NEUTRAL,
    contrastLevel,
    isDark,
    primaryPalette: TonalPalette.fromHueAndChroma(source.hue, 12.0),
    secondaryPalette: TonalPalette.fromHueAndChroma(source.hue, 8.0),
    tertiaryPalette: TonalPalette.fromHueAndChroma(source.hue, 16.0),
    neutralPalette: TonalPalette.fromHueAndChroma(source.hue, 2.0),
    neutralVariantPalette: TonalPalette.fromHueAndChroma(source.hue, 2.0),
  });
}

const BUILDERS: Record<SchemeVariant, (s: Hct, d: boolean, c: number) => DynamicScheme> = {
  vibrant: schemeVibrant,
  expressive: schemeExpressive,
  tonalSpot: schemeTonalSpot,
  neutral: schemeNeutral,
};

/** Build a scheme by variant name. */
export function buildScheme(
  variant: SchemeVariant,
  source: Hct,
  isDark: boolean,
  contrastLevel = 0,
): DynamicScheme {
  return BUILDERS[variant](source, isDark, contrastLevel);
}
