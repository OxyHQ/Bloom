/**
 * Bloom colour engine — dynamic scheme.
 *
 * Faithful port of Material Color Utilities' `DynamicScheme` core (Apache-2.0).
 * Holds the five tonal palettes (primary/secondary/tertiary/neutral/
 * neutralVariant) + error that a scheme variant derives from the seed, plus the
 * dark/contrast state a `DynamicColor` role reads to resolve into an ARGB. The
 * ~50 convenience role getters from the reference are omitted — Bloom reads
 * roles directly through `materialRoles`.
 */
import type { ColorRole } from './color-role';
import { Hct } from './hct';
import { sanitizeDegreesDouble } from './math-utils';
import { TonalPalette } from './tonal-palette';
import { Variant } from './variant';

export interface DynamicSchemeArgs {
  sourceColorArgb: number;
  variant: Variant;
  contrastLevel: number;
  isDark: boolean;
  primaryPalette: TonalPalette;
  secondaryPalette: TonalPalette;
  tertiaryPalette: TonalPalette;
  neutralPalette: TonalPalette;
  neutralVariantPalette: TonalPalette;
}

export class DynamicScheme {
  readonly sourceColorArgb: number;
  readonly variant: Variant;
  readonly contrastLevel: number;
  readonly isDark: boolean;
  readonly sourceColorHct: Hct;
  readonly primaryPalette: TonalPalette;
  readonly secondaryPalette: TonalPalette;
  readonly tertiaryPalette: TonalPalette;
  readonly neutralPalette: TonalPalette;
  readonly neutralVariantPalette: TonalPalette;
  readonly errorPalette: TonalPalette;

  constructor(args: DynamicSchemeArgs) {
    this.sourceColorArgb = args.sourceColorArgb;
    this.variant = args.variant;
    this.contrastLevel = args.contrastLevel;
    this.isDark = args.isDark;
    this.sourceColorHct = Hct.fromInt(args.sourceColorArgb);
    this.primaryPalette = args.primaryPalette;
    this.secondaryPalette = args.secondaryPalette;
    this.tertiaryPalette = args.tertiaryPalette;
    this.neutralPalette = args.neutralPalette;
    this.neutralVariantPalette = args.neutralVariantPalette;
    this.errorPalette = TonalPalette.fromHueAndChroma(25.0, 84.0);
  }

  /**
   * Rotate the seed hue by a designer-specified amount that depends on which
   * hue "breakpoint" band the seed falls in.
   */
  static getRotatedHue(sourceColor: Hct, hues: number[], rotations: number[]): number {
    const sourceHue = sourceColor.hue;
    if (hues.length !== rotations.length) {
      throw new Error(`mismatch between hue length ${hues.length} & rotations ${rotations.length}`);
    }
    if (rotations.length === 1) {
      const firstRotation = rotations[0];
      if (firstRotation === undefined) throw new Error('rotations[0] missing');
      return sanitizeDegreesDouble(sourceColor.hue + firstRotation);
    }
    const size = hues.length;
    for (let i = 0; i <= size - 2; i++) {
      const thisHue = hues[i];
      const nextHue = hues[i + 1];
      const rotation = rotations[i];
      if (thisHue === undefined || nextHue === undefined || rotation === undefined) continue;
      if (thisHue < sourceHue && sourceHue < nextHue) {
        return sanitizeDegreesDouble(sourceHue + rotation);
      }
    }
    return sourceHue;
  }

  getArgb(role: ColorRole): number {
    return role.getArgb(this);
  }

  getHct(role: ColorRole): Hct {
    return role.getHct(this);
  }
}
