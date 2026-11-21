import { Platform } from 'react-native';

import type { FrameSpec, GlassValue, Modifier } from './node';
import { surfaceStyle } from '@oxy.so/bloom/shapes';
import type { TypeScaleVariant } from '@oxy.so/bloom/typography';

import { COLORS, ENVIRONMENT_DEFAULTS, FONT_SIZE, LAYER_RANK } from './generated/spec.generated';
import { WEB_CLASS } from './generated/web-sheet.generated';
import type { Paint } from './paint';
import {
  ALIGNMENT,
  OPACITY,
  SHRINK,
  resolveBorderWidth,
  resolveCorner,
  rampStep,
  resolveFont,
  resolveSpace,
  type Alignment,
  type BorderEdge,
  type ColorName,
  type ColorToken,
  type CornerCurve,
  type OpacityName,
  type Edge,
  type FontName,
  type LeadingToken,
  type ShrinkPriority,
  type SpaceToken,
  type TextAlignment,
  type TextCase,
  type TypeFamily,
  type WeightName,
} from './tokens';

const IS_WEB = Platform.OS === 'web';

/**
 * Style resolution. A style is resolved once per key into values and colour
 * ROLES, never colours: the theme is not an input, so one cache serves every
 * theme and a theme switch re-resolves nothing here. The role is painted
 * where the platform can do it cheapest:
 *
 * - native: a `Paint` descriptor, which the `Painted` leaf turns into the
 *   theme's colour (so a theme switch re-renders those leaves only);
 * - web: the role's CSS variable, in an atomic class from the generated sheet,
 *   so a theme switch re-renders nothing at all.
 */

/** A colour role inside a resolved style, at its opacity if it names one. Interned, so a style compares by identity. */
export interface RoleRef {
  readonly token: ColorToken;
  readonly role: ColorName;
  readonly opacity: number | undefined;
}
const ROLE_REFS = new Map<ColorToken, RoleRef>();

export function role(token: ColorToken): RoleRef {
  let ref = ROLE_REFS.get(token);
  if (ref === undefined) {
    const [name, amount] = token.split('/') as [ColorName, OpacityName | undefined];
    ref = Object.freeze({
      token,
      role: name,
      opacity: amount === undefined ? undefined : OPACITY[amount],
    });
    ROLE_REFS.set(token, ref);
  }
  return ref;
}

/**
 * A role's web paint: its CSS variable (or fixed colour), and at an opacity the
 * mix Tailwind writes for `/70`, so the web draws what the class drew.
 */
export function webInk(ref: RoleRef): string {
  const web = COLORS[ref.role].web;
  if (ref.opacity === undefined) return web;
  return `color-mix(in oklab, ${web} ${Number((ref.opacity * 100).toFixed(4))}%, transparent)`;
}

/** A style as resolved: style properties to numbers, strings or roles. */
export type Resolved = Record<string, number | string | RoleRef>;

/**
 * What a host is handed. `style` is final; `paint`, when present, names the
 * properties a `Painted` leaf must fill from the theme before drawing.
 */
export interface StyleOut {
  readonly style: unknown;
  readonly paint: Paint | undefined;
}

/**
 * `host`: a React Native host the language owns (View, Text, Pressable),
 * which takes classes on the web. `component`: a Bloom component the
 * language draws (Avatar, Button, Surface…), which reads its style as an
 * object, so it gets one on every platform. `material`: a Bloom material that
 * computes with its fill (`BlurIsland` reads its `backgroundColor`), so its
 * roles are painted from the theme on every platform, never a CSS variable.
 */
export type Target = 'host' | 'component' | 'material';

const NO_STYLE: StyleOut = Object.freeze({ style: undefined, paint: undefined });
const cache = new Map<string, StyleOut>();

/** The style for `key`, built once and handed back by lookup on every later render. */
export function cachedStyle(target: Target, key: string, build: () => Resolved): StyleOut {
  const id = `${target}|${key}`;
  let out = cache.get(id);
  if (out === undefined) {
    out = serialize(build(), target);
    cache.set(id, out);
  }
  return out;
}

function isRole(value: number | string | RoleRef): value is RoleRef {
  return typeof value === 'object';
}

function serialize(resolved: Resolved, target: Target): StyleOut {
  const keys = Object.keys(resolved);
  if (keys.length === 0) return NO_STYLE;
  if (IS_WEB && target !== 'material')
    return { style: webStyle(resolved, keys, target), paint: undefined };
  const values: Record<string, number | string> = {};
  const roles: (readonly [string, ColorName, number?])[] = [];
  for (const key of keys) {
    const value = resolved[key] as number | string | RoleRef;
    if (isRole(value))
      roles.push(
        value.opacity === undefined ? [key, value.role] : [key, value.role, value.opacity],
      );
    else values[key] = value;
  }
  const style = Object.freeze(values);
  if (roles.length === 0) return { style, paint: undefined };
  return { style: undefined, paint: { style, styleRoles: roles, propRoles: [] } };
}

/**
 * The web form: react-native-web `$$css` class objects for every value the
 * generated sheet has a class for, and an inline object for the rest (an
 * app token's own number). A Bloom component reads its style as an object,
 * so it gets the inline form, roles as their CSS variables.
 */
function webStyle(resolved: Resolved, keys: string[], target: 'host' | 'component'): unknown {
  let classes: Record<string, string | boolean> | undefined;
  let inline: Record<string, number | string> | undefined;
  for (const key of keys) {
    const value = resolved[key] as number | string | RoleRef;
    const name =
      target === 'host'
        ? WEB_CLASS[isRole(value) ? `${key}:@${value.token}` : `${key}:${value}`]
        : undefined;
    if (name !== undefined) {
      classes ??= { $$css: true };
      classes[key] = name;
    } else {
      inline ??= {};
      inline[key] = isRole(value) ? webInk(value) : value;
    }
  }
  const parts = [classes, inline].filter((part) => part !== undefined).map(Object.freeze);
  return parts.length === 1 ? parts[0] : Object.freeze(parts);
}

// ── Layers ───────────────────────────────────────────────────────

/**
 * The modifiers that shape a box. Within one React Native view their effects
 * stack in the spec's layer order (padding inside the frame, the fill behind
 * both, the border on it, the corner clipping all of that, the opacity over
 * the whole), so a chain that follows the order is ONE view, and a modifier
 * that comes against it (a padding after a background) starts a new view
 * around the previous ones. That is how modifier order keeps its meaning
 * without a view per modifier.
 */
export type LayerModifier = Extract<Modifier, { kind: keyof typeof LAYER_RANK }>;

export interface Layer {
  readonly modifiers: LayerModifier[];
  key: string;
  rank: number;
  edges: number;
  glass: GlassValue | undefined;
  /** A `corner('concentric')` layer: Bloom's concentric geometry draws it (`ConcentricView`, or a glass Surface). */
  concentric: boolean;
  /** The layer's `cornerCurve`, which a glass Surface takes as its prop. */
  curve: CornerCurve | undefined;
  /** A `blur()` layer: Bloom's `BlurIsland` draws it. */
  blur: boolean;
}

const EDGE_BITS: Record<Edge, number> = {
  all: 0b1111,
  horizontal: 0b1100,
  vertical: 0b0011,
  top: 0b0001,
  bottom: 0b0010,
  leading: 0b0100,
  trailing: 0b1000,
};

export function isLayerModifier(modifier: Modifier): modifier is LayerModifier {
  return modifier.kind in LAYER_RANK;
}

/** Appends a box modifier to the innermost-first layer list, opening a new layer when order requires it. */
export function addToLayers(layers: Layer[], modifier: LayerModifier): void {
  const rank = LAYER_RANK[modifier.kind];
  const current = layers[layers.length - 1];
  const edges = modifier.kind === 'padding' ? EDGE_BITS[modifier.edge] : 0;
  const repeats =
    current !== undefined &&
    (modifier.kind === 'padding'
      ? (current.edges & edges) !== 0
      : current.modifiers.some((existing) => existing.kind === modifier.kind));
  const glass = modifier.kind === 'glass' ? modifier.value : undefined;
  const concentric = modifier.kind === 'corner' && modifier.value === 'concentric';
  const curve = modifier.kind === 'cornerCurve' ? modifier.value : undefined;
  const blur = modifier.kind === 'blur';
  if (current === undefined || rank < current.rank || repeats) {
    layers.push({
      modifiers: [modifier],
      key: modifier.key,
      rank,
      edges,
      glass,
      concentric,
      curve,
      blur,
    });
    return;
  }
  current.modifiers.push(modifier);
  current.key = `${current.key};${modifier.key}`;
  current.rank = rank;
  current.edges |= edges;
  if (glass) current.glass = glass;
  if (concentric) current.concentric = true;
  if (curve) current.curve = curve;
  if (blur) current.blur = true;
}

function paddingStyle(style: Resolved, edge: Edge, value: number): void {
  // Negative padding pulls the box outward: a margin, as SwiftUI draws it.
  const prefix = value < 0 ? 'margin' : 'padding';
  // Longhands only: react-native-web ranks the shorthands above them (AGENTS.rules.md, Style).
  const bits = EDGE_BITS[edge];
  if (bits & 0b0001) style[`${prefix}Top`] = value;
  if (bits & 0b0010) style[`${prefix}Bottom`] = value;
  if (bits & 0b0100) style[`${prefix}Start`] = value;
  if (bits & 0b1000) style[`${prefix}End`] = value;
}

const BORDER_EDGE_KEY: Record<BorderEdge, string> = {
  all: 'border',
  top: 'borderTop',
  bottom: 'borderBottom',
  leading: 'borderStart',
  trailing: 'borderEnd',
};

/** One layer's view style. Glass's fill is the Surface's prop, not a style; a blur draws its own material. */
export function layerStyle(layer: Layer | undefined): Resolved {
  const style: Resolved = {};
  if (layer === undefined) return style;
  for (const modifier of layer.modifiers) {
    switch (modifier.kind) {
      case 'padding':
        paddingStyle(style, modifier.edge, resolveSpace(modifier.value));
        break;
      case 'frame':
        for (const name of Object.keys(modifier.value) as (keyof FrameSpec)[]) {
          const token = modifier.value[name];
          if (token !== undefined) style[name] = resolveSpace(token as SpaceToken);
        }
        break;
      case 'background':
        style.backgroundColor = role(modifier.value);
        break;
      case 'border': {
        const prefix = BORDER_EDGE_KEY[modifier.edge];
        style[`${prefix}Width`] = resolveBorderWidth(modifier.width);
        style[`${prefix}Color`] = role(modifier.value);
        break;
      }
      case 'corner':
        if (modifier.value !== 'concentric') style.borderRadius = resolveCorner(modifier.value);
        style.overflow = 'hidden';
        break;
      case 'cornerCurve':
        // Bloom's platform-adaptive corner (`shapes/surface-style`): the curve alone, on the radius beside it.
        Object.assign(style, surfaceStyle({ curve: modifier.value }));
        break;
      case 'opacity':
        style.opacity = OPACITY[modifier.value];
        break;
      case 'glass':
      case 'blur':
        break;
    }
  }
  return style;
}

// ── A view's place in its parent ─────────────────────────────────

/**
 * `grow` and `shrink` place the view in its parent, so they belong to its
 * outermost box. Neither lowers the minimum width; a view that must shrink
 * below its content says so with `.frame({ minWidth: 'none' })`.
 */
export function flexStyle(grow: boolean, shrink: ShrinkPriority | undefined): Resolved {
  const style: Resolved = {};
  if (grow) style.flex = 1;
  if (shrink !== undefined) style.flexShrink = SHRINK[shrink];
  return style;
}

// ── Stacks ───────────────────────────────────────────────────────

export function stackStyle(
  axis: 'horizontal' | 'vertical' | 'depth',
  spacing: SpaceToken | 'between' | undefined,
  align: Alignment | undefined,
): Resolved {
  const style: Resolved = {};
  if (axis === 'horizontal') style.flexDirection = 'row';
  if (axis === 'depth') style.position = 'relative';
  if (spacing === 'between') style.justifyContent = 'space-between';
  else if (spacing !== undefined) style.gap = resolveSpace(spacing);
  if (align !== undefined) style.alignItems = ALIGNMENT[align];
  return style;
}

// ── Text ─────────────────────────────────────────────────────────

export interface TextTraits {
  foreground: ColorToken | undefined;
  font: FontName | undefined;
  weight: WeightName | undefined;
  leading: LeadingToken | undefined;
}

/** The colour role text and icons paint with: the environment's, or the spec's default. */
export function foregroundOf(traits: TextTraits): ColorToken {
  return traits.foreground ?? ENVIRONMENT_DEFAULTS.foreground;
}

/** What a text's own chain sets beyond the environment's traits (its `own` modifiers). */
export interface TextLook {
  readonly noWrap: boolean;
  readonly align: TextAlignment | undefined;
  readonly italic: boolean;
  readonly underline: boolean;
  readonly strikethrough: boolean;
  readonly textCase: TextCase | undefined;
  /** A link: Bloom's inline link ink (`primary`) unless the chain names its own, and an underline. */
  readonly link: boolean;
}

/** React Native's alignment: `start` and `end` are its `left` and `right`, which it flips right to left. */
const TEXT_ALIGN: Record<TextAlignment, string> = {
  start: 'left',
  center: 'center',
  end: 'right',
  justify: 'justify',
};

/** The colour of a link with no ink of its own: Bloom's inline link (`markdown/InlineMarkdown`). */
const LINK_INK: ColorName = 'primary';

/** A ramp step, by family: the type Bloom's `Text` sets from its `variant`. */
export function isRampFont(font: FontName | undefined): font is TypeFamily {
  return font !== undefined && !(font in FONT_SIZE);
}

/** The `variant` Bloom's `Text` takes for these traits, when their font is a ramp step. */
export function textVariant(traits: TextTraits): TypeScaleVariant | undefined {
  if (!isRampFont(traits.font)) return undefined;
  return rampStep(traits.font, traits.weight) as TypeScaleVariant;
}

/**
 * A text's style. The outermost text is Bloom's `Text`: a ramp font is its
 * `variant` (see `textVariant`), so only a size rung, a weight without a ramp
 * font, a leading and a colour the environment sets are written here; with no
 * colour, Bloom's own ink stays. A nested text is an inline span (`span` holds
 * the traits its own chain sets): it writes only those, and inherits the rest
 * from the text it is in.
 */
export function textStyle(
  traits: TextTraits,
  look: TextLook,
  span: ReadonlySet<keyof TextTraits> | undefined,
): Resolved {
  const style: Resolved = {};
  const sets = (trait: keyof TextTraits) => span === undefined || span.has(trait);
  if (sets('font') || sets('weight') || sets('leading')) {
    const font = resolveFont(traits.font, traits.weight, traits.leading);
    if (span === undefined && isRampFont(traits.font)) {
      if (font.lineHeight !== undefined && traits.leading !== undefined)
        style.lineHeight = font.lineHeight;
      // A weight the ramp has no step for is written over the regular step.
      if (
        traits.weight !== undefined &&
        !rampStep(traits.font, traits.weight).endsWith(traits.weight)
      )
        style.fontWeight = font.fontWeight as string;
    } else Object.assign(style, font);
  }
  if (look.link && (span === undefined ? traits.foreground === undefined : !span.has('foreground')))
    style.color = role(LINK_INK);
  else if (sets('foreground') && traits.foreground !== undefined)
    style.color = role(traits.foreground);
  if (look.align !== undefined) style.textAlign = TEXT_ALIGN[look.align];
  if (look.italic) style.fontStyle = 'italic';
  const underline = look.underline || look.link;
  if (underline || look.strikethrough) {
    style.textDecorationLine =
      underline && look.strikethrough
        ? 'underline line-through'
        : underline
          ? 'underline'
          : 'line-through';
  }
  if (look.textCase !== undefined) style.textTransform = look.textCase;
  if (look.noWrap && IS_WEB) style.whiteSpace = 'nowrap';
  return style;
}
