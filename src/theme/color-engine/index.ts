/**
 * Bloom colour engine — public surface.
 *
 * A dependency-free tonal colour system (HCT + tonal palettes + dynamic roles)
 * reimplemented in Bloom from the Material Color Utilities algorithm (Apache-2.0)
 * and verified byte-for-byte against it. Give it ANY seed colour and it derives a
 * full, self-consistent, WCAG-legible set of roles for light and dark at any
 * contrast level — the same dynamic theming MaterialKolor does, but ours.
 */
/**
 * This barrel is the engine's PUBLIC surface — `@oxyhq/bloom/theme` publishes it
 * whole, as the `ColorEngine` namespace. Keep it to what a consumer deriving a
 * theme actually calls; the ports underneath (`Hct`, `TonalPalette`,
 * `DynamicScheme`, `ColorRole`, `Roles`, `buildScheme`, `quantizeWu`, `score`)
 * are implementation and are imported from their own modules by the handful of
 * files inside Bloom that need them — adding one back here publishes it.
 */
export type { SchemeVariant, AccentSources } from './scheme-variants';
export type { RoleName } from './color-roles';
export { quantizeImage, seedsFromImagePixels, seedHexFromImagePixels } from './seed-from-image';
export { argbFromRgb, redFromArgb, greenFromArgb, blueFromArgb } from './color-utils';

import { blueFromArgb, greenFromArgb, redFromArgb } from './color-utils';
import { Roles, type RoleName } from './color-roles';
import { Hct } from './hct';
import { buildScheme, type SchemeVariant } from './scheme-variants';

/** Parse a `#rrggbb` (or `#aarrggbb`) hex string into an ARGB int. */
export function argbFromHex(hex: string): number {
  const h = hex.replace('#', '');
  const v = h.length === 6 ? `ff${h}` : h;
  return parseInt(v, 16) >>> 0;
}

/** Format an ARGB int as `#rrggbb`. */
export function hexFromArgb(argb: number): string {
  const r = redFromArgb(argb).toString(16).padStart(2, '0');
  const g = greenFromArgb(argb).toString(16).padStart(2, '0');
  const b = blueFromArgb(argb).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
}

/** Every colour role as a modern `rgb(r g b)` string. */
export type RoleColors = Record<RoleName, string>;

export interface GenerateOptions {
  /** The brand/seed colour, `#rrggbb`. */
  seed: string;
  variant?: SchemeVariant;
  isDark?: boolean;
  /** −1 (low) … 0 (normal) … 1 (high). */
  contrastLevel?: number;
  /**
   * Optional explicit secondary-accent seed, `#rrggbb`. When set, the secondary
   * palette is pinned to THIS colour's hue + chroma (M3 role tones still apply)
   * instead of the variant's derived hue-rotation of the primary seed. Omit for
   * the current derived behaviour.
   */
  secondarySeed?: string;
  /**
   * Optional explicit tertiary-accent seed, `#rrggbb`. Same semantics as
   * {@link GenerateOptions.secondarySeed} for the tertiary palette.
   */
  tertiarySeed?: string;
}

/**
 * Generate the full role set from ANY seed colour — the dynamic-theming entry
 * point. Presets are just fixed seeds; a user-picked colour works identically.
 *
 * `secondarySeed` / `tertiarySeed` optionally PIN those accent families to real
 * brand colours (e.g. a blue-primary brand with a yellow secondary); omitted, the
 * accents are derived as the variant's hue-rotations — byte-identical to before.
 */
export function generateRoleColors(opts: GenerateOptions): RoleColors {
  const scheme = buildScheme(
    opts.variant ?? 'vibrant',
    Hct.fromInt(argbFromHex(opts.seed)),
    opts.isDark ?? false,
    opts.contrastLevel ?? 0,
    {
      secondarySource:
        opts.secondarySeed !== undefined
          ? Hct.fromInt(argbFromHex(opts.secondarySeed))
          : undefined,
      tertiarySource:
        opts.tertiarySeed !== undefined
          ? Hct.fromInt(argbFromHex(opts.tertiarySeed))
          : undefined,
    },
  );
  const out = {} as RoleColors;
  for (const name of Object.keys(Roles) as RoleName[]) {
    const argb = Roles[name].getArgb(scheme);
    out[name] = `rgb(${redFromArgb(argb)} ${greenFromArgb(argb)} ${blueFromArgb(argb)})`;
  }
  return out;
}
