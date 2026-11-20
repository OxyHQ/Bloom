import { Platform } from 'react-native';

import type { FrameSpec, GlassValue, Modifier } from './node';
import { COLORS, ENVIRONMENT_DEFAULTS, LAYER_RANK } from './generated/spec.generated';
import { WEB_CLASS } from './generated/web-sheet.generated';
import type { Paint } from './paint';
import {
  ALIGNMENT,
  OPACITY,
  SHRINK,
  resolveBorderWidth,
  resolveCorner,
  resolveFont,
  resolveSpace,
  type Alignment,
  type BorderEdge,
  type ColorName,
  type Edge,
  type FontName,
  type LeadingToken,
  type ShrinkPriority,
  type SpaceToken,
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

/** A colour role inside a resolved style. Interned, so a style compares by identity. */
export interface RoleRef {
  readonly role: ColorName;
}
const ROLE_REFS = Object.fromEntries(
  (Object.keys(COLORS) as ColorName[]).map((role) => [role, Object.freeze({ role })]),
) as Record<ColorName, RoleRef>;

export function role(name: ColorName): RoleRef {
  return ROLE_REFS[name];
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
 * object, so it gets one on every platform.
 */
export type Target = 'host' | 'component';

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
  if (IS_WEB) return { style: webStyle(resolved, keys, target), paint: undefined };
  const values: Record<string, number | string> = {};
  const roles: [string, ColorName][] = [];
  for (const key of keys) {
    const value = resolved[key] as number | string | RoleRef;
    if (isRole(value)) roles.push([key, value.role]);
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
function webStyle(resolved: Resolved, keys: string[], target: Target): unknown {
  let classes: Record<string, string | boolean> | undefined;
  let inline: Record<string, number | string> | undefined;
  for (const key of keys) {
    const value = resolved[key] as number | string | RoleRef;
    const name =
      target === 'host'
        ? WEB_CLASS[isRole(value) ? `${key}:@${value.role}` : `${key}:${value}`]
        : undefined;
    if (name !== undefined) {
      classes ??= { $$css: true };
      classes[key] = name;
    } else {
      inline ??= {};
      inline[key] = isRole(value) ? `var(--${COLORS[value.role].css})` : value;
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
  if (current === undefined || rank < current.rank || repeats) {
    layers.push({ modifiers: [modifier], key: modifier.key, rank, edges, glass });
    return;
  }
  current.modifiers.push(modifier);
  current.key = `${current.key};${modifier.key}`;
  current.rank = rank;
  current.edges |= edges;
  if (glass) current.glass = glass;
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

/** One layer's view style. Glass's fill is the Surface's prop, not a style. */
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
        style.borderRadius = resolveCorner(modifier.value);
        style.overflow = 'hidden';
        break;
      case 'opacity':
        style.opacity = OPACITY[modifier.value];
        break;
      case 'glass':
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
  foreground: ColorName | undefined;
  font: FontName | undefined;
  weight: WeightName | undefined;
  leading: LeadingToken | undefined;
}

/** The colour role text and icons paint with: the environment's, or the spec's default. */
export function foregroundOf(traits: TextTraits): ColorName {
  return traits.foreground ?? ENVIRONMENT_DEFAULTS.foreground;
}

export function textStyle(traits: TextTraits, noWrap: boolean): Resolved {
  const style: Resolved = { ...resolveFont(traits.font, traits.weight, traits.leading) };
  style.color = role(foregroundOf(traits));
  if (noWrap && IS_WEB) style.whiteSpace = 'nowrap';
  return style;
}
