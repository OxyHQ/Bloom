/**
 * Bloom colour engine — the dynamic-theming entry point.
 *
 * Turns ANY seed colour into the full role set. Presets are just fixed seeds; a
 * user-picked colour, or one pulled off artwork, works identically.
 */
import { blueFromArgb, greenFromArgb, redFromArgb, argbFromHex } from './color-utils';
import { Roles, type RoleName } from './color-roles';
import { Hct } from './hct';
import { buildScheme, type SchemeVariant } from './scheme-variants';

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
