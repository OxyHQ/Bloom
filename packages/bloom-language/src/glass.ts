import { GLASS, GLASS_OPACITY } from './generated/spec.generated';
import type { ColorName, GlassOpacityName } from './tokens';

export type GlassMaterial = keyof typeof GLASS;

/**
 * A glass material, as SwiftUI's `glassEffect` takes it: `regular` or
 * `clear`, optionally tinted from a colour role at a named transparency.
 *
 * ```ts
 * Button(Icon(ComposeIcon)).glass()                                  // regular
 * HStack(...).glass(clear)
 * HStack(...).glass(regular.tint('primary'))
 * HStack(...).glass(clear.tint('primary', 'subtle'))
 * ```
 *
 * Today each draws Bloom's one material (`Surface`, see docs/bloom-language.mdx
 * for the mapping and how each will map natively).
 */
export class GlassValue {
  readonly key: string;

  constructor(
    readonly material: GlassMaterial,
    readonly tintColor?: ColorName,
    readonly tintOpacity?: GlassOpacityName,
  ) {
    this.key = `glass:${material}:${tintColor ?? ''}:${tintOpacity ?? ''}`;
    Object.freeze(this);
  }

  /** The same material tinted with a colour role, at a named transparency (or the material's own). */
  tint(color: ColorName, opacity?: GlassOpacityName): GlassValue {
    return new GlassValue(this.material, color, opacity);
  }

  /** The role the Surface's fill paints from, if any. */
  get fillRole(): ColorName | undefined {
    return this.tintColor ?? GLASS[this.material].fill ?? undefined;
  }

  /** The opacity that fill paints at; `undefined` is the colour as it is. */
  get fillOpacity(): number | undefined {
    const name = this.tintOpacity ?? GLASS[this.material].tintOpacity;
    return name === null ? undefined : GLASS_OPACITY[name];
  }

  /** Whether the material keeps Surface's native sheen. */
  get sheen(): boolean {
    return GLASS[this.material].sheen;
  }
}

/** Glass that adapts to what is behind it: Bloom's material. */
export const regular = new GlassValue('regular');
/** Glass that lets more of what is behind it through. */
export const clear = new GlassValue('clear');
