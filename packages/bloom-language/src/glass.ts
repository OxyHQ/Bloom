import { type ENUMS, GLASS, GLASS_OPACITY } from './generated/spec.generated';
import type { ColorName, GlassOpacityName } from './tokens';

export type GlassMaterial = keyof typeof GLASS;
/** How a glass with an identity arrives and leaves (SwiftUI's `glassEffectTransition`). */
export type GlassTransition = (typeof ENUMS.glassTransition)[number];

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
    /** Whether it answers touch, when said (`.interactive()`); unsaid, the platform's default. */
    readonly interactiveSaid?: boolean,
    /** `false` for `identity`: no glass is drawn. */
    readonly drawn: boolean = true,
  ) {
    this.key = drawn
      ? `glass:${material}:${tintColor ?? ''}:${tintOpacity ?? ''}${interactiveSaid === undefined ? '' : `:i${interactiveSaid}`}`
      : 'glass:identity';
    Object.freeze(this);
  }

  /** The same material tinted with a colour role, at a named transparency (or the material's own). */
  tint(color: ColorName, opacity?: GlassOpacityName): GlassValue {
    return new GlassValue(this.material, color, opacity, this.interactiveSaid, this.drawn);
  }

  /**
   * The same material over Apple's dimming layer (black at `dim`, 35%): what
   * `clear` glass over bright media takes so what is on it stays legible.
   */
  dimmed(): GlassValue {
    return this.tint('black', 'dim');
  }

  /**
   * The same material, answering touch or not (SwiftUI's `Glass.interactive`):
   * it springs under the finger on Android and OxyOS and reacts on iOS. Unsaid,
   * a glass answers touch where the platform's default does.
   */
  interactive(on = true): GlassValue {
    return new GlassValue(this.material, this.tintColor, this.tintOpacity, on, this.drawn);
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
/**
 * No glass (SwiftUI's `Glass.identity`): the view draws no material, and its
 * chain keeps its shape, so a value can turn the glass off
 * (`.glass(active ? regular : identity)`).
 */
export const identity = new GlassValue('regular', undefined, undefined, undefined, false);
