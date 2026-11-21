import { Platform } from 'react-native';

import type { FrameSpec, GlassValue, Modifier, PositionEdges } from './node';
import { SHADOW_BOX, bloomShadowStyle, type ShadowRole } from '@oxy.so/bloom/design-tokens';
import { surfaceStyle } from '@oxy.so/bloom/shapes';
import { fontFamilyStyle, type TypeScaleVariant } from '@oxy.so/bloom/typography';

import { COLORS, ENVIRONMENT_DEFAULTS, FONT_SIZE, LAYER_RANK } from './generated/spec.generated';
import { WEB_CLASS } from './generated/web-sheet.generated';
import type { Paint, PaintVariant } from './paint';
import { compareLive, warnNoClass, type LiveCondition, type Planned } from './variants';
import { adoptVariantClasses, variantSuffix } from './web-sheet';
import {
  ALIGNMENT,
  OPACITY,
  SHRINK,
  Z_INDEX,
  resolveBorderWidth,
  resolveCorner,
  rampStep,
  resolveFont,
  resolveLength,
  resolveSpace,
  type Alignment,
  type Axis,
  type BorderEdge,
  type CornerName,
  type CornerSide,
  type LengthToken,
  type Justify,
  type OverlayAlignment,
  type ZIndexName,
  type ShadowName,
  type ColorName,
  type ColorToken,
  type CornerCurve,
  type OpacityName,
  type Edge,
  type FontFamilyName,
  type FontName,
  type TrackingName,
  type LeadingToken,
  type ShrinkPriority,
  type SpaceToken,
  type TextAlignment,
  type TextCase,
  type WordBreak,
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

/** A value a resolved style holds: a number, a string, a role, or a structured value (a shadow's offset, a transform). */
export type StyleValue = number | string | RoleRef | object;
/** A style as resolved: style properties to numbers, strings, roles or structured values. */
export type Resolved = Record<string, StyleValue>;

/** A style's live variants, in the order they apply (`compareLive`): what each condition overrides. */
export type VariantStyles = readonly (readonly [LiveCondition, Resolved])[];

/** Variant styles gathered from several sources (a layer, the placement…), in the order they apply. */
export function joinVariants(...lists: (VariantStyles | undefined)[]): VariantStyles {
  const byCondition = new Map<LiveCondition, Resolved>();
  for (const list of lists) {
    for (const [condition, style] of list ?? []) {
      byCondition.set(condition, Object.assign(byCondition.get(condition) ?? {}, style));
    }
  }
  return [...byCondition.keys()]
    .sort(compareLive)
    .map((condition) => [condition, byCondition.get(condition) as Resolved] as const);
}

/**
 * What a host is handed. `style` is final; `paint`, when present, names the
 * properties a `Painted` leaf must fill from the theme before drawing (and,
 * with variants, what a `Conditioned` leaf picks from the environment).
 */
export interface StyleOut {
  readonly style: unknown;
  readonly paint: Paint | undefined;
  /** The web: the host reads its style as an object (a Bloom component), so it takes no class and tracks its state in JS. */
  readonly object?: true;
}

/**
 * `host`: a React Native host the language owns (View, Text, Pressable),
 * which takes classes on the web. `component`: a Bloom component the
 * language draws (Avatar, Button, Surface…), which reads its style as an
 * object, so it gets one on every platform (with live variants, a
 * `Conditioned` leaf picks it, on the web too). `material`: a Bloom material that
 * computes with its fill (`BlurIsland` reads its `backgroundColor`), so its
 * roles are painted from the theme on every platform, never a CSS variable.
 */
export type Target = 'host' | 'component' | 'material';

const NO_STYLE: StyleOut = Object.freeze({ style: undefined, paint: undefined });
const NO_OBJECT_STYLE: StyleOut = Object.freeze({
  style: undefined,
  paint: undefined,
  object: true,
});
const cache = new Map<string, StyleOut>();

/**
 * The style for `key`, built once and handed back by lookup on every later
 * render. `variants` are its live variants (the key names them too).
 */
export function cachedStyle(
  target: Target,
  key: string,
  build: () => Resolved,
  variants?: () => VariantStyles,
): StyleOut {
  const id = `${target}|${key}`;
  let out = cache.get(id);
  if (out === undefined) {
    out = serialize(build(), target, variants?.() ?? []);
    cache.set(id, out);
  }
  return out;
}

function isRole(value: StyleValue): value is RoleRef {
  return typeof value === 'object' && (value as Partial<RoleRef>).role !== undefined;
}

/** A resolved style as a native host takes it: its values, and the properties painted from roles. */
function split(resolved: Resolved): {
  style: object;
  styleRoles: (readonly [string, ColorName, number?])[];
} {
  const values: Record<string, StyleValue> = {};
  const roles: (readonly [string, ColorName, number?])[] = [];
  for (const key of Object.keys(resolved)) {
    const value = resolved[key] as StyleValue;
    if (isRole(value))
      roles.push(
        value.opacity === undefined ? [key, value.role] : [key, value.role, value.opacity],
      );
    else values[key] = value;
  }
  return { style: Object.freeze(values), styleRoles: roles };
}

function serialize(resolved: Resolved, target: Target, variants: VariantStyles): StyleOut {
  const keys = Object.keys(resolved);
  if (IS_WEB && target === 'component') {
    // A Bloom component reads its style as an object, which CSS cannot vary:
    // its live variants are picked by a `Conditioned` leaf, as native's are,
    // each role its CSS variable as in the component's inline style.
    if (keys.length === 0 && variants.length === 0) return NO_OBJECT_STYLE;
    const out =
      variants.length === 0
        ? { style: Object.freeze(inked(resolved)), paint: undefined }
        : paintOut(
            inked(resolved),
            variants.map(([condition, styled]) => [condition, inked(styled)] as const),
          );
    return { ...out, object: true };
  }
  if (keys.length === 0 && variants.length === 0) return NO_STYLE;
  if (IS_WEB && target !== 'material')
    return { style: webStyle(resolved, keys, variants), paint: undefined };
  return paintOut(resolved, variants);
}

/** A resolved style with each role as its web paint (its CSS variable). */
function inked(resolved: Resolved): Resolved {
  const out: Resolved = {};
  for (const key of Object.keys(resolved)) {
    const value = resolved[key] as StyleValue;
    out[key] = isRole(value) ? webInk(value) : value;
  }
  return out;
}

/** The native form (and a web component's with variants): values, the roles a `Painted` leaf paints, the variants a `Conditioned` one picks. */
function paintOut(resolved: Resolved, variants: VariantStyles): StyleOut {
  const { style, styleRoles } = split(resolved);
  if (variants.length > 0) {
    const varied: PaintVariant[] = variants.map(([condition, styled]) => ({
      condition,
      ...split(styled),
    }));
    const base = Object.keys(resolved).length > 0 ? style : undefined;
    return {
      style: undefined,
      paint: { style: base, styleRoles, propRoles: [], variants: varied },
    };
  }
  if (styleRoles.length === 0) return { style, paint: undefined };
  return { style: undefined, paint: { style, styleRoles, propRoles: [] } };
}

/**
 * The web form: react-native-web `$$css` class objects for every value the
 * generated sheet has a class for, and an inline object for the rest (an
 * app token's own number). A Bloom component's style is an object
 * (`serialize`).
 */
const classOf = (key: string, value: StyleValue): string | undefined =>
  WEB_CLASS[isRole(value) ? `${key}:@${value.token}` : `${key}:${String(value)}`];

function webStyle(resolved: Resolved, keys: string[], variants: VariantStyles): unknown {
  let classes: Record<string, string | boolean> | undefined;
  let inline: Record<string, StyleValue> | undefined;
  for (const key of keys) {
    const value = resolved[key] as StyleValue;
    const name = classOf(key, value);
    if (name !== undefined) {
      classes ??= { $$css: true };
      classes[key] = name;
    } else {
      inline ??= {};
      inline[key] = isRole(value) ? webInk(value) : value;
    }
  }
  // A variant is the same class under its condition's CSS, keyed apart from the
  // base so styleq keeps both; its rule reaches the page with it (web-sheet.ts).
  for (const [condition, styled] of variants) {
    const names: string[] = [];
    for (const key of Object.keys(styled)) {
      const name = classOf(key, styled[key] as StyleValue);
      if (name === undefined) {
        warnNoClass(key);
        continue;
      }
      names.push(name);
      classes ??= { $$css: true };
      classes[`${key}@${condition}`] = `${name}-${variantSuffix(condition)}`;
    }
    adoptVariantClasses(condition, names);
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
  /** What variants change in this view: each over the values the chain set before it. */
  readonly variants: [Planned, LayerModifier][];
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
  /** Views drawn over (and, `behind`, under) what the layer holds: \`overlay()\` and \`background(view)\`. */
  overlays: Extract<Modifier, { kind: 'overlay' }>[];
  /** The corners the layer's `corner()`s round, a bit each (`CORNER_BITS`). */
  corners: number;
  /**
   * A shadow layer's outline: the corners of the clipped box it is drawn around.
   * A shadow never shares a view with a corner's clip (iOS clips a view's own
   * shadow to its bounds), so it is a view of its own with the same radii.
   */
  follows: readonly CornerModifier[];
}

type CornerModifier = Extract<Modifier, { kind: 'corner' }>;

/** Each corner a `corner()` side rounds, a bit each: top-leading, top-trailing, bottom-leading, bottom-trailing. */
const CORNER_BITS: Record<CornerSide, number> = {
  all: 0b1111,
  top: 0b0011,
  bottom: 0b1100,
  leading: 0b0101,
  trailing: 0b1010,
  'top-leading': 0b0001,
  'top-trailing': 0b0010,
  'bottom-leading': 0b0100,
  'bottom-trailing': 0b1000,
};

/** Each corner's radius, logical as the edges are: leading and trailing follow the reading direction. */
const CORNER_RADIUS: readonly (readonly [number, string])[] = [
  [0b0001, 'borderTopStartRadius'],
  [0b0010, 'borderTopEndRadius'],
  [0b0100, 'borderBottomStartRadius'],
  [0b1000, 'borderBottomEndRadius'],
];

/** The radius a corner writes: one `borderRadius`, or a radius per corner it rounds. */
function cornerRadius(style: Resolved, corner: CornerModifier): void {
  if (corner.value === 'concentric') return;
  const radius = resolveCorner(corner.value);
  if (corner.side === 'all') {
    style.borderRadius = radius;
    return;
  }
  const bits = CORNER_BITS[corner.side];
  for (const [bit, key] of CORNER_RADIUS) if (bits & bit) style[key] = radius;
}

/** The radius keys a per-side corner writes: a glass or an island takes one radius, so it has none of these. */
export const SIDE_RADII: readonly string[] = CORNER_RADIUS.map(([, key]) => key);

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
  const corners = modifier.kind === 'corner' ? CORNER_BITS[modifier.side] : 0;
  // A second padding of an edge (or corner of a corner) the view has wraps it; other edges join it.
  const repeats =
    current !== undefined &&
    (modifier.kind === 'padding'
      ? (current.edges & edges) !== 0
      : modifier.kind === 'corner'
        ? (current.corners & corners) !== 0
        : current.modifiers.some((existing) => existing.kind === modifier.kind));
  const glass = modifier.kind === 'glass' ? modifier.value : undefined;
  const concentric = modifier.kind === 'corner' && modifier.value === 'concentric';
  const curve = modifier.kind === 'cornerCurve' ? modifier.value : undefined;
  const blur = modifier.kind === 'blur';
  const overlay = modifier.kind === 'overlay' ? modifier : undefined;
  const clip =
    modifier.kind === 'shadow'
      ? current?.modifiers.filter(
          (existing): existing is CornerModifier => existing.kind === 'corner',
        )
      : undefined;
  const clipped = clip !== undefined && clip.length > 0;
  // Overlays stack: a second one joins the first, over it (or, behind, under it).
  const sameKind = repeats && modifier.kind !== 'overlay';
  if (current === undefined || rank < current.rank || sameKind || clipped) {
    layers.push({
      modifiers: [modifier],
      variants: [],
      key: clipped ? `${modifier.key}@${clip.map((corner) => corner.key).join(',')}` : modifier.key,
      rank,
      edges,
      glass,
      concentric,
      curve,
      blur,
      overlays: overlay ? [overlay] : [],
      corners,
      follows: clipped ? clip : [],
    });
    return;
  }
  current.modifiers.push(modifier);
  current.key = `${current.key};${modifier.key}`;
  current.rank = rank;
  current.edges |= edges;
  current.corners |= corners;
  if (glass) current.glass = glass;
  if (concentric) current.concentric = true;
  if (curve) current.curve = curve;
  if (blur) current.blur = true;
  if (overlay) current.overlays.push(overlay);
}

/** Whether two box modifiers set the same thing (a padding the same edge, a border the same side). */
function sameSlot(a: LayerModifier, b: LayerModifier): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'padding' && b.kind === 'padding')
    return (EDGE_BITS[a.edge] & EDGE_BITS[b.edge]) !== 0;
  if (a.kind === 'border' && b.kind === 'border') return a.edge === b.edge;
  if (a.kind === 'corner' && b.kind === 'corner')
    return (CORNER_BITS[a.side] & CORNER_BITS[b.side]) !== 0;
  return true;
}

/**
 * A variant's box modifier goes to the view that set the same thing last
 * before the variant (it overrides that value), else to the outermost view so
 * far, else to a view of its own.
 */
export function addVariantToLayers(
  layers: Layer[],
  condition: Planned,
  modifier: LayerModifier,
): void {
  let target: Layer | undefined;
  for (let i = layers.length - 1; i >= 0 && target === undefined; i--) {
    const layer = layers[i] as Layer;
    if (layer.modifiers.some((existing) => sameSlot(existing, modifier))) target = layer;
  }
  target ??= layers[layers.length - 1];
  if (target === undefined) {
    target = {
      modifiers: [],
      variants: [],
      key: '',
      rank: -1,
      edges: 0,
      glass: undefined,
      concentric: false,
      curve: undefined,
      blur: false,
      overlays: [],
      corners: 0,
      follows: [],
    };
    layers.push(target);
  }
  target.variants.push([condition, modifier]);
  target.key += `;?${condition ?? ''}${modifier.key}`;
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

/** One layer's view style, the variants that hold included. Glass's fill is the Surface's prop, not a style; a blur draws its own material. */
export function layerStyle(layer: Layer | undefined): Resolved {
  if (layer === undefined) return {};
  const style = modifiersStyle(layer, layer.modifiers);
  for (const [condition, modifier] of layer.variants) {
    if (condition === null) Object.assign(style, modifiersStyle(layer, [modifier]));
  }
  return style;
}

/** One layer's live variants: what each condition overrides. */
export function layerVariants(layer: Layer | undefined): VariantStyles {
  if (layer === undefined || layer.variants.length === 0) return [];
  return joinVariants(
    layer.variants
      .filter(([condition]) => condition !== null)
      .map(([condition, modifier]) => [
        condition as LiveCondition,
        modifiersStyle(layer, [modifier]),
      ]),
  );
}

function modifiersStyle(layer: Layer, modifiers: readonly LayerModifier[]): Resolved {
  const style: Resolved = {};
  for (const modifier of modifiers) {
    switch (modifier.kind) {
      case 'padding':
        paddingStyle(style, modifier.edge, resolveSpace(modifier.value));
        break;
      case 'frame':
        for (const name of Object.keys(modifier.value) as (keyof FrameSpec)[]) {
          const token = modifier.value[name];
          if (token !== undefined) style[name] = resolveLength(token);
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
        cornerRadius(style, modifier);
        style.overflow = 'hidden';
        break;
      case 'cornerCurve':
        // Bloom's platform-adaptive corner (`shapes/surface-style`): the curve alone, on the radius beside it.
        Object.assign(style, surfaceStyle({ curve: modifier.value }));
        break;
      case 'opacity':
        style.opacity = OPACITY[modifier.value];
        break;
      case 'ring':
        ringStyle(style, modifier);
        break;
      case 'shadow':
        // Bloom's elevation: the web's box-shadow, native's shadow and elevation.
        shadowStyle(style, modifier.value);
        for (const corner of layer.follows) cornerRadius(style, corner);
        break;
      case 'glass':
      case 'blur':
      case 'overlay':
        break;
    }
  }
  return style;
}

/**
 * Bloom's elevation for a role: the web's box-shadow, native's shadow and
 * elevation (`bloomShadowStyle`). A Tailwind shadow is named by its exact
 * box-shadow, which every platform draws as it is.
 */
function shadowStyle(style: Resolved, shadow: ShadowName): void {
  if (shadow in SHADOW_BOX) Object.assign(style, bloomShadowStyle(shadow as ShadowRole));
  else style.boxShadow = shadow;
}

/**
 * A ring is an outline: it draws outside the box and takes no room, as
 * Bloom's own focus ring does. `none` is the web's `outline: none` (native
 * draws none to remove).
 */
function ringStyle(style: Resolved, ring: Extract<Modifier, { kind: 'ring' }>): void {
  if (ring.value === 'none') {
    if (IS_WEB) style.outlineStyle = 'none';
    return;
  }
  style.outlineColor = role(ring.value);
  style.outlineStyle = 'solid';
  style.outlineWidth = resolveBorderWidth(ring.width);
  if (ring.offset !== undefined) style.outlineOffset = resolveSpace(ring.offset);
}

/** Where an overlay sits in its view: SwiftUI's alignment, as the flex placement of an absolute inset box. */
const OVERLAY_ROW: Record<string, string> = { top: 'flex-start', bottom: 'flex-end' };
const OVERLAY_COLUMN: Record<string, string> = { leading: 'flex-start', trailing: 'flex-end' };

/** An overlay's box: the whole of its view, its content placed at `alignment`. */
export function overlayStyle(alignment: OverlayAlignment): Resolved {
  const [vertical, horizontal] = alignment.includes('-')
    ? alignment.split('-')
    : alignment === 'top' || alignment === 'bottom'
      ? [alignment, 'center']
      : ['center', alignment];
  return {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: OVERLAY_ROW[vertical as string] ?? 'center',
    alignItems: OVERLAY_COLUMN[horizontal as string] ?? 'center',
  };
}

// ── A view's place in its parent ─────────────────────────────────

/** What places a view in its parent: the modifiers its outermost box takes. */
export interface Placement {
  grow: boolean;
  shrink: ShrinkPriority | undefined;
  alignSelf: Alignment | undefined;
  position: PositionEdges | undefined;
  zIndex: ZIndexName | undefined;
  hidden: boolean | undefined;
  basis: LengthToken | undefined;
  allowsHitTesting: boolean | undefined;
  accessibilityOnly: boolean;
  /** Its resting geometry (`motionPlan`'s transform), when nothing moves it: see render.tsx `renderNode`. */
  transform: readonly object[] | undefined;
  /** What variants change in the view's place. */
  variants: [Planned, PlaceModifier][];
  /** The cache key of everything above, '' when nothing places the view. */
  key: string;
}

/** The modifiers that place a view in its parent. */
export type PlaceModifier = Extract<
  Modifier,
  {
    kind:
      | 'grow'
      | 'shrink'
      | 'alignSelf'
      | 'position'
      | 'zIndex'
      | 'hidden'
      | 'basis'
      | 'allowsHitTesting'
      | 'accessibilityOnly';
  }
>;
export const PLACE_KINDS: ReadonlySet<string> = new Set([
  'grow',
  'shrink',
  'alignSelf',
  'position',
  'zIndex',
  'hidden',
  'basis',
  'allowsHitTesting',
  'accessibilityOnly',
]);

/** Sets what `modifier` says about the view's place. */
export function applyPlacement(place: Placement, modifier: PlaceModifier): void {
  if (modifier.kind === 'grow') place.grow = true;
  else if (modifier.kind === 'accessibilityOnly') place.accessibilityOnly = true;
  else (place as unknown as Record<string, unknown>)[modifier.kind] = modifier.value;
  place.key += `;${modifier.key}`;
}

/** A placement of these modifiers alone: what a variant's place modifiers write. */
function placementOf(modifiers: readonly PlaceModifier[]): Placement {
  const place = emptyPlacement();
  for (const modifier of modifiers) applyPlacement(place, modifier);
  return place;
}

/** The live variants of a view's place. */
export function placeVariants(place: Placement): VariantStyles {
  if (place.variants.length === 0) return [];
  return joinVariants(
    place.variants
      .filter(([condition]) => condition !== null)
      .map(([condition, modifier]) => [
        condition as LiveCondition,
        placeStyle(placementOf([modifier])),
      ]),
  );
}

export function emptyPlacement(): Placement {
  return {
    grow: false,
    shrink: undefined,
    alignSelf: undefined,
    position: undefined,
    zIndex: undefined,
    hidden: undefined,
    basis: undefined,
    allowsHitTesting: undefined,
    accessibilityOnly: false,
    transform: undefined,
    variants: [],
    key: '',
  };
}

/**
 * Tailwind's `sr-only`: out of the layout, one point square, clipped. Native
 * has neither a clip path nor white-space, as NativeWind drew it there.
 */
const ACCESSIBILITY_ONLY: Resolved = Object.freeze({
  position: 'absolute',
  width: 1,
  height: 1,
  paddingTop: 0,
  paddingBottom: 0,
  paddingStart: 0,
  paddingEnd: 0,
  marginTop: -1,
  marginBottom: -1,
  marginStart: -1,
  marginEnd: -1,
  overflow: 'hidden',
  borderWidth: 0,
  ...(IS_WEB ? { clipPath: 'inset(50%)', whiteSpace: 'nowrap' } : null),
});

const POSITION_EDGE: Record<keyof PositionEdges, string> = {
  top: 'top',
  bottom: 'bottom',
  leading: 'start',
  trailing: 'end',
};

/** What sizes a view in its parent's flex (grow, shrink, basis): what a box moved around it takes too. */
export function flexOnly(place: Placement): Resolved {
  const style: Resolved = {};
  if (place.grow) style.flex = 1;
  if (place.shrink !== undefined) style.flexShrink = SHRINK[place.shrink];
  if (place.basis !== undefined) style.flexBasis = resolveLength(place.basis);
  return style;
}

/**
 * `grow`, `shrink`, `basis`, `alignSelf`, `position`, `zIndex`, `hidden`,
 * hit testing and `accessibilityOnly` place the view in its parent, so they
 * belong to its outermost box. (`offset` and `scale` move it where it is laid
 * out: the motion layer draws them, render.tsx `motionPlan`.) Neither
 * `grow` nor `shrink` lowers the minimum width; a view that must shrink below
 * its content says so with `.frame({ minWidth: 'none' })`.
 */
export function placeStyle(place: Placement): Resolved {
  const style: Resolved = {};
  if (place.grow) style.flex = 1;
  if (place.shrink !== undefined) style.flexShrink = SHRINK[place.shrink];
  if (place.basis !== undefined) style.flexBasis = resolveLength(place.basis);
  if (place.alignSelf !== undefined) style.alignSelf = ALIGNMENT[place.alignSelf];
  if (place.position !== undefined) {
    style.position = 'absolute';
    for (const edge of Object.keys(POSITION_EDGE) as (keyof PositionEdges)[]) {
      const token = place.position[edge];
      if (token !== undefined) style[POSITION_EDGE[edge]] = resolveSpace(token);
    }
  }
  if (place.accessibilityOnly) Object.assign(style, ACCESSIBILITY_ONLY);
  if (place.transform !== undefined) style.transform = place.transform as StyleValue;
  if (place.zIndex !== undefined) style.zIndex = Z_INDEX[place.zIndex];
  if (place.hidden !== undefined) style.display = place.hidden ? 'none' : 'flex';
  if (place.allowsHitTesting !== undefined)
    style.pointerEvents = place.allowsHitTesting ? 'auto' : 'none';
  for (const [condition, modifier] of place.variants) {
    if (condition === null) Object.assign(style, placeStyle(placementOf([modifier])));
  }
  return style;
}

// ── Stacks ───────────────────────────────────────────────────────

/** A stack's own layout: what its constructor and its stack modifiers say. */
export interface StackLayout {
  spacing: SpaceToken | undefined;
  align: Alignment | undefined;
  justify: Justify | undefined;
  wrap: boolean | undefined;
  /** `.axis()`: the axis over the constructor's. */
  axis: Axis | undefined;
}

const JUSTIFY: Record<Justify, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
  around: 'space-around',
  evenly: 'space-evenly',
};

/** The stack modifiers. */
export type StackModifier = Extract<
  Modifier,
  { kind: 'spacing' | 'align' | 'justify' | 'wrap' | 'axis' }
>;
export const STACK_KINDS: ReadonlySet<string> = new Set([
  'spacing',
  'align',
  'justify',
  'wrap',
  'axis',
]);

/** A stack layout of these modifiers, the last of each kind winning. */
export function layoutOf(modifiers: readonly StackModifier[]): StackLayout {
  const layout: StackLayout = {
    spacing: undefined,
    align: undefined,
    justify: undefined,
    wrap: undefined,
    axis: undefined,
  };
  for (const modifier of modifiers) {
    (layout as unknown as Record<string, unknown>)[modifier.kind] = modifier.value;
  }
  return layout;
}

/** What a layout sets, and nothing else (a variant writes only what it changes). */
export function layoutStyle(layout: StackLayout): Resolved {
  const style: Resolved = {};
  if (layout.axis !== undefined)
    style.flexDirection = layout.axis === 'horizontal' ? 'row' : 'column';
  if (layout.justify !== undefined) style.justifyContent = JUSTIFY[layout.justify];
  if (layout.spacing !== undefined) style.gap = resolveSpace(layout.spacing);
  if (layout.align !== undefined) style.alignItems = ALIGNMENT[layout.align];
  if (layout.wrap !== undefined) style.flexWrap = layout.wrap ? 'wrap' : 'nowrap';
  return style;
}

export function stackStyle(
  axis: 'horizontal' | 'vertical' | 'depth',
  layout: StackLayout,
): Resolved {
  const style: Resolved = {};
  if (axis === 'horizontal') style.flexDirection = 'row';
  if (axis === 'depth') style.position = 'relative';
  return Object.assign(style, layoutStyle(layout));
}

// ── Text ─────────────────────────────────────────────────────────

export interface TextTraits {
  foreground: ColorToken | undefined;
  /** The size: a ramp step or a size rung. */
  font: Exclude<FontName, FontFamilyName> | undefined;
  /** The face beside the size (`.font('mono')`); Bloom's own when unset. */
  family: FontFamilyName | undefined;
  weight: WeightName | undefined;
  leading: LeadingToken | undefined;
  tracking: TrackingName | undefined;
  /** The traits live variants set above (`when()`), each over the traits it is in. */
  variants?: readonly (readonly [LiveCondition, Partial<TextTraits>])[];
}

const PLAIN_LOOK: TextLook = {
  noWrap: false,
  align: undefined,
  italic: false,
  underline: false,
  strikethrough: false,
  textCase: undefined,
  link: false,
  tabular: false,
  wordBreak: undefined,
};

/** A text's live variants: what each sets of the traits it changes (a colour, a whole font). */
export function textVariants(traits: TextTraits): VariantStyles {
  if (traits.variants === undefined || traits.variants.length === 0) return [];
  return joinVariants(
    traits.variants.map(([condition, changed]) => [
      condition,
      textStyle(
        { ...traits, ...changed, variants: undefined },
        PLAIN_LOOK,
        new Set(Object.keys(changed) as (keyof TextTraits)[]),
      ),
    ]),
  );
}

/** Digits of one width: React Native's `fontVariant`, the web's `font-variant`. */
const TABULAR: readonly string[] = Object.freeze(['tabular-nums']);

/** Each family's face, as Bloom's `Text` sets it for `font-mono`. */
const FAMILY: Record<FontFamilyName, string> = { mono: fontFamilyStyle('mono').fontFamily };

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
  /** `monospacedDigit()`: digits of one width. */
  readonly tabular: boolean;
  /** Web: where a line may break inside a word. */
  readonly wordBreak: WordBreak | undefined;
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
export function isRampFont(font: TextTraits['font']): font is TypeFamily {
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
  if (sets('font') || sets('weight') || sets('leading') || sets('tracking')) {
    const font = resolveFont(traits.font, traits.weight, traits.leading, traits.tracking);
    if (span === undefined && isRampFont(traits.font)) {
      if (font.lineHeight !== undefined && traits.leading !== undefined)
        style.lineHeight = font.lineHeight;
      if (font.letterSpacing !== undefined && traits.tracking !== undefined)
        style.letterSpacing = font.letterSpacing;
      // A weight the ramp has no step for is written over the regular step.
      if (
        traits.weight !== undefined &&
        !rampStep(traits.font, traits.weight).endsWith(traits.weight)
      )
        style.fontWeight = font.fontWeight as string;
    } else Object.assign(style, font);
  }
  if (sets('family') && traits.family !== undefined) style.fontFamily = FAMILY[traits.family];
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
  if (look.tabular) style.fontVariant = TABULAR;
  // React Native has no word breaking of its own to set; the web's is CSS.
  if (look.wordBreak === 'all' && IS_WEB) style.wordBreak = 'break-all';
  if (look.wordBreak === 'words' && IS_WEB) style.overflowWrap = 'break-word';
  return style;
}
