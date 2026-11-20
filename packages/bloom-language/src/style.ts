import type { TextStyle, ViewStyle } from 'react-native';
import type { ThemeColors } from '@oxy.so/bloom/theme';

import type { Alignment, Edge, Modifier, ShrinkPriority, BorderEdge } from './node';
import {
  BORDER_WIDTHS,
  OPACITY_SCALE,
  resolveColor,
  resolveCorner,
  resolveFont,
  resolveSpace,
  type ColorName,
  type FontName,
  type LeadingToken,
  type SpaceToken,
  type WeightName,
} from './tokens';

/**
 * Style resolution. Every style object the renderer hands React Native comes
 * out of a per-theme cache keyed by the modifier keys that produced it, so a
 * re-render with the same modifiers reuses the same object: no style is
 * computed or allocated twice for one theme.
 */
export interface StyleCache {
  readonly colors: ThemeColors;
  readonly styles: Map<string, object>;
}

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

const caches = new WeakMap<ThemeColors, StyleCache>();

export function styleCacheFor(colors: ThemeColors): StyleCache {
  let cache = caches.get(colors);
  if (!cache) {
    cache = { colors, styles: new Map() };
    caches.set(colors, cache);
  }
  return cache;
}

export function cached<T extends object>(cache: StyleCache, key: string, build: () => T): T {
  let style = cache.styles.get(key) as T | undefined;
  if (style === undefined) {
    style = Object.freeze(build()) as T;
    cache.styles.set(key, style);
  }
  return style;
}

// ── Layers ───────────────────────────────────────────────────────

/**
 * The modifiers that shape a box. Within one React Native view their effects
 * stack in this order — padding inside the frame, the fill behind both, the
 * border on it, the corner clipping all of that, the opacity over the whole —
 * so a chain that follows the order is ONE view, and a modifier that comes
 * against it (a padding after a background) starts a new view around the
 * previous ones. That is how modifier order keeps its meaning without a view
 * per modifier.
 */
export type LayerModifier = Extract<
  Modifier,
  { kind: 'padding' | 'frame' | 'background' | 'border' | 'corner' | 'opacity' | 'glass' }
>;

const RANK: Record<LayerModifier['kind'], number> = {
  padding: 0,
  frame: 1,
  background: 2,
  glass: 2,
  border: 3,
  corner: 4,
  opacity: 5,
};

export interface Layer {
  readonly modifiers: LayerModifier[];
  key: string;
  rank: number;
  edges: number;
  glass: boolean;
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
  return modifier.kind in RANK;
}

/** Appends a box modifier to the innermost-first layer list, opening a new layer when order requires it. */
export function addToLayers(layers: Layer[], modifier: LayerModifier): void {
  const rank = RANK[modifier.kind];
  const current = layers[layers.length - 1];
  const edges = modifier.kind === 'padding' ? EDGE_BITS[modifier.edge] : 0;
  const repeats =
    current !== undefined &&
    (modifier.kind === 'padding'
      ? (current.edges & edges) !== 0
      : current.modifiers.some((existing) => existing.kind === modifier.kind));
  if (current === undefined || rank < current.rank || repeats) {
    layers.push({
      modifiers: [modifier],
      key: modifier.key,
      rank,
      edges,
      glass: modifier.kind === 'glass',
    });
    return;
  }
  current.modifiers.push(modifier);
  current.key = `${current.key};${modifier.key}`;
  current.rank = rank;
  current.edges |= edges;
  if (modifier.kind === 'glass') current.glass = true;
}

function paddingStyle(edge: Edge, value: number): ViewStyle {
  // Negative padding pulls the box outward: a margin, as SwiftUI draws it.
  const prefix = value < 0 ? 'margin' : 'padding';
  // Longhands only: react-native-web ranks the shorthands above them (AGENTS.rules.md, Style).
  const style: Record<string, number> = {};
  const bits = EDGE_BITS[edge];
  if (bits & 0b0001) style[`${prefix}Top`] = value;
  if (bits & 0b0010) style[`${prefix}Bottom`] = value;
  if (bits & 0b0100) style[`${prefix}Start`] = value;
  if (bits & 0b1000) style[`${prefix}End`] = value;
  return style as ViewStyle;
}

const BORDER_WIDTH_KEY: Record<BorderEdge, keyof ViewStyle> = {
  all: 'borderWidth',
  top: 'borderTopWidth',
  bottom: 'borderBottomWidth',
  leading: 'borderStartWidth',
  trailing: 'borderEndWidth',
};
const BORDER_COLOR_KEY: Record<BorderEdge, keyof ViewStyle> = {
  all: 'borderColor',
  top: 'borderTopColor',
  bottom: 'borderBottomColor',
  leading: 'borderStartColor',
  trailing: 'borderEndColor',
};

/** One layer's view style. Glass's fill is the Surface's prop, not a style. */
export function layerStyle(colors: ThemeColors, layer: Layer): ViewStyle {
  const style: Record<string, unknown> = {};
  for (const modifier of layer.modifiers) {
    switch (modifier.kind) {
      case 'padding':
        Object.assign(style, paddingStyle(modifier.edge, resolveSpace(modifier.value)));
        break;
      case 'frame':
        for (const [name, token] of Object.entries(modifier.value)) {
          if (token !== undefined) style[name] = resolveSpace(token as SpaceToken);
        }
        break;
      case 'background':
        style.backgroundColor = resolveColor(colors, modifier.value);
        break;
      case 'border':
        style[BORDER_WIDTH_KEY[modifier.edge]] = BORDER_WIDTHS[modifier.width];
        style[BORDER_COLOR_KEY[modifier.edge]] = resolveColor(colors, modifier.value);
        break;
      case 'corner':
        style.borderRadius = resolveCorner(modifier.value);
        style.overflow = 'hidden';
        break;
      case 'opacity':
        style.opacity = OPACITY_SCALE[modifier.value];
        break;
      case 'glass':
        break;
    }
  }
  return style as ViewStyle;
}

// ── A view's place in its parent ─────────────────────────────────

const SHRINK: Record<ShrinkPriority, number> = { never: 0, normal: 1, first: 10 };

/**
 * `grow` and `shrink` place the view in its parent, so they belong to its
 * outermost box. Neither lowers the minimum width; a view that must shrink
 * below its content says so with `.frame({ minWidth: 'none' })`.
 */
export function flexStyle(grow: boolean, shrink: ShrinkPriority | undefined): ViewStyle {
  const style: Mutable<ViewStyle> = {};
  if (grow) style.flex = 1;
  if (shrink !== undefined) style.flexShrink = SHRINK[shrink];
  return style;
}

// ── Stacks ───────────────────────────────────────────────────────

const ALIGN: Record<Alignment, ViewStyle['alignItems']> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
  baseline: 'baseline',
};

export function stackStyle(
  axis: 'horizontal' | 'vertical' | 'depth',
  spacing: SpaceToken | 'between' | undefined,
  align: Alignment | undefined,
): ViewStyle {
  const style: Mutable<ViewStyle> = {};
  if (axis === 'horizontal') style.flexDirection = 'row';
  if (axis === 'depth') style.position = 'relative';
  if (spacing === 'between') style.justifyContent = 'space-between';
  else if (spacing !== undefined) style.gap = resolveSpace(spacing);
  if (align !== undefined) style.alignItems = ALIGN[align];
  return style;
}

// ── Text ─────────────────────────────────────────────────────────

export interface TextTraits {
  foreground: ColorName | undefined;
  font: FontName | undefined;
  weight: WeightName | undefined;
  leading: LeadingToken | undefined;
}

export function textStyle(
  colors: ThemeColors,
  traits: TextTraits,
  noWrap: boolean,
  web: boolean,
): TextStyle {
  const style: TextStyle = {
    ...resolveFont(traits.font, traits.weight, traits.leading),
    color: resolveColor(colors, traits.foreground ?? 'foreground'),
  };
  if (noWrap && web) (style as Record<string, unknown>).whiteSpace = 'nowrap';
  return style;
}
