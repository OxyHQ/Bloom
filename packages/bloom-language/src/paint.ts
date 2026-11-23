import {
  createContext,
  createElement,
  useContext,
  type ComponentType,
  type ReactElement,
  type ReactNode,
} from 'react';
import { Platform } from 'react-native';
import { useWindowBreakpoint } from '@oxy.so/bloom/hooks';
import { useSurfaceFill } from '@oxy.so/bloom/styles';
import {
  parseRgb,
  useTheme,
  useThemePaint,
  withAlpha,
  type ThemeColors,
} from '@oxy.so/bloom/theme';

import { COLORS } from './generated/spec.generated';
import type { RoleRef } from './style';
import { adoptInk } from './web-sheet';
import type { ColorName } from './tokens';
import { TIERS, termsOf, type LiveCondition, type LiveTerm, type Tier } from './variants';

/**
 * What a `Painted` leaf fills from the theme: style properties painted from
 * colour roles (native; the web paints style roles with CSS variables), and
 * props painted from roles, optionally at an opacity (an icon's `fill`, a
 * glass Surface's `fill`, on every platform).
 */
export interface Paint {
  readonly style: object | undefined;
  readonly styleRoles: readonly (readonly [string, ColorName, number?])[];
  readonly propRoles: readonly (readonly [string, ColorName, number?])[];
  /** Native: what live variants override, in the order they apply (a `Conditioned` leaf draws them). */
  readonly variants?: readonly PaintVariant[];
  /** Props painted as a list of colours (a loader's four, a gradient's stops): see `listProps`. */
  readonly propLists?: readonly (readonly [string, readonly ListColor[]])[];
}

/** One colour of a painted list: a role (at an opacity), or an app's own colour as it is. */
export type ListColor = readonly [ColorName, number?] | string;

/**
 * One live variant of a native style: its values, the properties painted from
 * roles, and the props: painted from roles (an icon's `fill`) or as they are
 * (a glass's radius).
 */
export interface PaintVariant {
  readonly condition: LiveCondition;
  readonly style: object;
  readonly styleRoles: readonly (readonly [string, ColorName, number?])[];
  readonly propRoles?: readonly (readonly [string, ColorName, number?])[];
  readonly props?: Readonly<Record<string, unknown>>;
}

const IS_WEB = Platform.OS === 'web';
const resolved = new WeakMap<ThemeColors, WeakMap<Paint, Record<string, unknown>>>();

const surfacePalettes = new WeakMap<ThemeColors, Map<string, ThemeColors>>();
/**
 * The palette a leaf paints with: the theme's, and the fill of the surface it
 * sits on as the `surfaceFill` role (Bloom's `useSurfaceFill()`), one palette
 * per theme and fill, so what it paints is built once for each.
 */
function onSurface(colors: ThemeColors, fill: string): ThemeColors {
  let byFill = surfacePalettes.get(colors);
  if (byFill === undefined) {
    byFill = new Map();
    surfacePalettes.set(colors, byFill);
  }
  let palette = byFill.get(fill);
  if (palette === undefined) {
    palette = Object.freeze({ ...colors, [COLORS.surfaceFill.paint]: fill }) as ThemeColors;
    byFill.set(fill, palette);
  }
  return palette;
}

/**
 * A view's geometry in a resolved style: one key per transform component
 * (`translateX`, `translateY` px, `rotate` degrees, `scale`), so a variant
 * overrides only the component it sets. They apply in this order (Tailwind's
 * translate, rotate, scale; the motion layer's).
 */
export const GEOMETRY_KEYS = ['translateX', 'translateY', 'rotate', 'scale'] as const;
export type GeometryKey = (typeof GEOMETRY_KEYS)[number];
export type Geometry = { readonly [K in GeometryKey]?: number };

/**
 * A style as a host takes it: its geometry components composed into one
 * `transform` (native, and a Bloom component's style object on the web).
 * The web's own hosts compose them in CSS instead (style.ts, `webStyle`).
 */
export function composeGeometry<T extends object>(style: T): T {
  const source = style as Record<string, unknown>;
  let out: Record<string, unknown> | undefined;
  let transform: Record<string, number | string>[] | undefined;
  for (const key of GEOMETRY_KEYS) {
    const value = source[key] as number | undefined;
    if (value === undefined) continue;
    out ??= { ...source };
    delete out[key];
    transform ??= [];
    transform.push(key === 'rotate' ? { rotate: `${value}deg` } : { [key]: value });
  }
  if (out === undefined) return style;
  out.transform = transform;
  return out as T;
}

/**
 * A colour at an opacity: Bloom's `withAlpha` of a colour it can parse, as an
 * app writes it (Surface computes its material from its fill, which a
 * `color-mix()` hides from it: drawn opaque, at 72%). A web paint can be a CSS
 * variable (Bloom's prepaint), which only the browser can mix: the mix is a
 * custom property of the language's ink sheet (`--bl-bloom-paint-primary-24`,
 * web-sheet.ts) and the prop its `var()`, as a style's ink is
 * (`webInk`), since react-native-web drops a `color-mix()` from a style a
 * component draws the prop as.
 */
function atOpacity(color: string, opacity: number): string {
  if (!IS_WEB || parseRgb(color) !== null) return withAlpha(color, opacity);
  const mix = `color-mix(in srgb, ${color} ${opacity * 100}%, transparent)`;
  const variable = /^var\(--([\w-]+)\)$/.exec(color)?.[1];
  if (variable === undefined) return mix;
  const name = `--bl-${variable}-${String(Number((opacity * 100).toFixed(4))).replace('.', '_')}`;
  adoptInk(name, mix);
  return `var(${name})`;
}

/** A role's colour in a palette (the surface fill's included, `onSurface`). */
export function paletteColor(colors: ThemeColors, role: ColorName): string {
  return (colors as unknown as Record<string, string>)[COLORS[role].paint] as string;
}

/**
 * A palette with the surface fill a leaf was handed (`OnSurface`): the
 * theme's own when it was handed none, as a leaf whose paint names no
 * `surfaceFill` never is.
 */
export function withSurface(colors: ThemeColors, surface: string | undefined): ThemeColors {
  return surface === undefined ? colors : onSurface(colors, surface);
}

/** Whether a role is the surface fill, which only a leaf drawn `OnSurface` can paint. */
export const isSurfaceFill = (role: ColorName | undefined): boolean => role === 'surfaceFill';

/** A leaf's props, as the renderer assembles them. */
type LeafProps = Record<string, unknown>;

/**
 * Reads the surface fill (Bloom's `useSurfaceFill()`) and draws `leaf` with
 * it as `surface`. Drawn only around a leaf that paints `surfaceFill`, so no
 * other leaf reads the surface's context: a node costs what its JSX does.
 */
function OnSurface({ leaf, ...props }: { leaf: unknown } & LeafProps): ReactElement {
  return createElement(leaf as ComponentType<LeafProps>, { ...props, surface: useSurfaceFill() });
}
OnSurface.displayName = 'BloomOnSurface';

/** `leaf` with `props`, drawn `OnSurface` when it paints the surface fill: the component and props to draw. */
export function surfaced(
  leaf: unknown,
  props: LeafProps,
  paintsSurface: boolean,
): [unknown, LeafProps] {
  return paintsSurface ? [OnSurface, { ...props, leaf }] : [leaf, props];
}

const surfacePaints = new WeakMap<Paint, boolean>();
/** Whether a paint names the surface fill anywhere: its style, its props, its variants, its lists. */
export function paintsSurface(paint: Paint): boolean {
  let names = surfacePaints.get(paint);
  if (names === undefined) {
    const roles = (list: readonly (readonly [string, ColorName, number?])[] | undefined) =>
      (list ?? []).some(([, role]) => isSurfaceFill(role));
    names =
      roles(paint.styleRoles) ||
      roles(paint.propRoles) ||
      (paint.variants ?? []).some(
        (variant) => roles(variant.styleRoles) || roles(variant.propRoles),
      ) ||
      (paint.propLists ?? []).some(([, list]) =>
        list.some((color) => typeof color !== 'string' && isSurfaceFill(color[0])),
      );
    surfacePaints.set(paint, names);
  }
  return names;
}

/** A painted leaf for `paint`: `Conditioned` with live variants, else `Painted`, `OnSurface` when it paints the surface fill. */
export function paintedLeaf(props: LeafProps & { paint: Paint }): [unknown, LeafProps] {
  return surfaced(leafOf(props.paint), props, paintsSurface(props.paint));
}

/** A prop painted from a role (an icon's `fill`), at its opacity: what an app hands Bloom. */
function propColor(colors: ThemeColors, role: ColorName, opacity: number | undefined): string {
  const color = paletteColor(colors, role);
  return opacity === undefined ? color : atOpacity(color, opacity);
}

/**
 * A style property painted from a role, at its opacity: what a class draws.
 * On native a fixed colour (`white`, `black`) at an opacity is what
 * NativeWind's compiler writes for `bg-white/70`: its hex with the alpha in 8
 * bits, the opacity × 255 rounded with the opacity a 32-bit float, as its
 * compiler (lightningcss) holds it (`#ffffffb2`: 178.49999…; `bg-black/50`
 * `#00000080`: 127.5). The web keeps the exact percentage (its
 * `color-mix()`, `webInk`), as Tailwind writes it.
 */
function styleColor(colors: ThemeColors, role: ColorName, opacity: number | undefined): string {
  const fixed = COLORS[role].web;
  if (opacity === undefined || IS_WEB || !fixed?.startsWith('#'))
    return propColor(colors, role, opacity);
  return `${fixed}${Math.round(Math.fround(opacity) * 255)
    .toString(16)
    .padStart(2, '0')}`;
}

/** The props a paint resolves to under one palette, built once per palette and reused. */
function paintProps(colors: ThemeColors, paint: Paint): Record<string, unknown> {
  let byPaint = resolved.get(colors);
  if (byPaint === undefined) {
    byPaint = new WeakMap();
    resolved.set(colors, byPaint);
  }
  let props = byPaint.get(paint);
  if (props === undefined) {
    props = {};
    if (paint.styleRoles.length > 0) {
      const style: Record<string, unknown> = { ...paint.style };
      for (const [key, role, opacity] of paint.styleRoles)
        style[key] = styleColor(colors, role, opacity);
      props.style = Object.freeze(composeGeometry(style));
    } else if (paint.style !== undefined) {
      props.style = composeGeometry(paint.style);
    }
    for (const [key, role, opacity] of paint.propRoles)
      props[key] = propColor(colors, role, opacity);
    Object.freeze(props);
    byPaint.set(paint, props);
  }
  return props;
}

const listed = new WeakMap<ThemeColors, WeakMap<Paint, Record<string, unknown>>>();

/**
 * The props a paint's lists resolve to under one palette, built once per
 * palette and reused: `undefined` when it paints none. A list is what Bloom
 * blends (a composer loader's midpoint, a gradient's stops), so its roles are
 * the theme's RGB colours (`useTheme().colors`), which an app hands Bloom for
 * colour math, not the paint palette (a CSS variable on the web).
 */
function listProps(colors: ThemeColors, paint: Paint): Record<string, unknown> | undefined {
  if (paint.propLists === undefined) return undefined;
  let byPaint = listed.get(colors);
  if (byPaint === undefined) {
    byPaint = new WeakMap();
    listed.set(colors, byPaint);
  }
  let props = byPaint.get(paint);
  if (props === undefined) {
    props = {};
    for (const [key, list] of paint.propLists)
      props[key] = Object.freeze(
        list.map((color) => {
          if (typeof color === 'string') return color;
          const [role, opacity] = color;
          const rgb = paletteColor(colors, role);
          return opacity === undefined ? rgb : withAlpha(rgb, opacity);
        }),
      );
    Object.freeze(props);
    byPaint.set(paint, props);
  }
  return props;
}

/**
 * A colour as Bloom's theme hands it to a component that does colour math
 * with it (a Screen's fill, which publishes its surface): a role as the
 * theme's RGB colour (`useTheme().colors`), at its opacity; an app colour as written.
 */
export function themeColor(colors: ThemeColors, value: RoleRef | string): string {
  if (typeof value === 'string') return value;
  const rgb = paletteColor(colors, value.role);
  return value.opacity === undefined ? rgb : withAlpha(rgb, value.opacity);
}

/**
 * The two palettes a leaf paints from, in one theme read on native: the
 * paint (what a final style takes) and the theme (its RGB colours for colour
 * math, and its scheme). Native has no prepaint, so its paint is the theme's
 * own colours (Bloom's `use-paint-colors.native.ts`); the web's paint may be
 * the prepainted document's CSS variables, a read of its own.
 */
const usePalettes: () => { paint: ThemeColors; theme: ReturnType<typeof useTheme> } = IS_WEB
  ? () => ({ paint: useThemePaint(), theme: useTheme() })
  : () => {
      const theme = useTheme();
      return { paint: theme.colors, theme };
    };

export interface PaintedProps {
  host: ComponentType<Record<string, unknown>> | string;
  paint: Paint;
  /** The surface fill, handed in by `OnSurface` when the paint names it. */
  surface?: string;
  children?: ReactNode;
  [prop: string]: unknown;
}

/**
 * The one place the language reads the theme: a leaf that draws `host` with
 * the colours `paint` names. The trees above it are theme-free, so a theme
 * switch re-renders these leaves and no view body (the theme reaches them
 * through context, past every memoized view in between).
 */
export function Painted({ host, paint, surface, ...props }: PaintedProps): ReactElement {
  const { paint: colors, theme } = usePalettes();
  const painted = paintProps(withSurface(colors, surface), paint);
  const lists = listProps(withSurface(theme.colors, surface), paint);
  // A moving host's motion style (`Outer`) comes after the painted one.
  if (props.style !== undefined && painted.style !== undefined) {
    return createElement(host, {
      ...props,
      ...painted,
      ...lists,
      style: [painted.style, props.style],
    });
  }
  return createElement(host, { ...props, ...painted, ...lists });
}
Painted.displayName = 'BloomPaint';

// ── Live variants on native ──────────────────────────────────────

/** The state of the view a host belongs to: what its outermost box (a `StateHost`) tracks. */
export interface Interaction {
  readonly hovered: boolean;
  readonly focused: boolean;
  readonly pressed: boolean;
}
export const IDLE: Interaction = Object.freeze({ hovered: false, focused: false, pressed: false });
export const InteractionContext = createContext<Interaction>(IDLE);
InteractionContext.displayName = 'BloomInteraction';

/** Whether a live condition holds: every term it joins does. */
function holds(condition: LiveCondition, tier: Tier, dark: boolean, state: Interaction): boolean {
  return termsOf(condition).every((term) => termHolds(term, tier, dark, state));
}

/** Whether one term holds: the window's tier from the variant's up, the scheme, a state. */
function termHolds(condition: LiveTerm, tier: Tier, dark: boolean, state: Interaction): boolean {
  switch (condition) {
    case 'dark':
      return dark;
    case 'hovered':
    case 'focused':
    case 'pressed':
      return state[condition];
    default:
      return TIERS.indexOf(tier) >= TIERS.indexOf(condition);
  }
}

const conditioned = new WeakMap<
  ThemeColors,
  WeakMap<Paint, Map<number, Record<string, unknown>>>
>();

/** The props a paint resolves to under one palette with these variants holding (a bit each), built once and reused. */
function conditionedProps(
  colors: ThemeColors,
  paint: Paint,
  holding: number,
): Record<string, unknown> {
  let byPaint = conditioned.get(colors);
  if (byPaint === undefined) {
    byPaint = new WeakMap();
    conditioned.set(colors, byPaint);
  }
  let byHolding = byPaint.get(paint);
  if (byHolding === undefined) {
    byHolding = new Map();
    byPaint.set(paint, byHolding);
  }
  const base = paintProps(colors, paint);
  if (holding === 0) return base;
  let props = byHolding.get(holding);
  if (props === undefined) {
    const next: Record<string, unknown> = { ...base };
    // From the paint's own values (geometry by component, so a variant sets only its own), then each holding variant.
    const style: Record<string, unknown> = { ...paint.style };
    for (const [key, role, opacity] of paint.styleRoles)
      style[key] = styleColor(colors, role, opacity);
    (paint.variants ?? []).forEach((variant, index) => {
      if ((holding & (1 << index)) === 0) return;
      Object.assign(style, variant.style);
      Object.assign(next, variant.props);
      for (const [key, role, opacity] of variant.styleRoles)
        style[key] = styleColor(colors, role, opacity);
      for (const [key, role, opacity] of variant.propRoles ?? [])
        next[key] = propColor(colors, role, opacity);
    });
    // A paint of props alone (an icon's fill) gains no style.
    if (base.style !== undefined || Object.keys(style).length > 0)
      next.style = Object.freeze(composeGeometry(style));
    props = Object.freeze(next);
    byHolding.set(holding, props);
  }
  return props;
}

/** The props a varied paint draws under `tier`, the scheme and the state of the view it belongs to. */
function picked(
  { host, paint, surface, ...props }: PaintedProps,
  tier: Tier,
  state: Interaction,
): ReactElement {
  const { paint: palette, theme } = usePalettes();
  const colors = withSurface(palette, surface);
  let holding = 0;
  (paint.variants ?? []).forEach((variant, index) => {
    if (holds(variant.condition, tier, theme.isDark, state)) holding |= 1 << index;
  });
  const chosen = conditionedProps(colors, paint, holding);
  const lists = listProps(withSurface(theme.colors, surface), paint);
  // A moving host's motion style (`Outer`) comes after the picked one, as in `Painted`.
  if (props.style !== undefined && chosen.style !== undefined) {
    return createElement(host, {
      ...props,
      ...chosen,
      ...lists,
      style: [chosen.style, props.style],
    });
  }
  return createElement(host, { ...props, ...chosen, ...lists });
}

/**
 * A `Painted` leaf whose style has live variants (native): it reads what they
 * hold on (the window's breakpoint tier, the scheme, the state of the view it
 * belongs to) and draws the props built once for that set. A resize re-renders
 * it only across a breakpoint, a press only the leaves of the pressed view.
 */
export function Conditioned(props: PaintedProps): ReactElement {
  return picked(props, useWindowBreakpoint(), useContext(InteractionContext));
}
Conditioned.displayName = 'BloomConditioned';

/**
 * A `Conditioned` leaf whose variants answer no breakpoint (a pressed or a
 * dark style): it subscribes to no window size, so it holds no hook.
 */
export function StateConditioned(props: PaintedProps): ReactElement {
  return picked(props, 'base', useContext(InteractionContext));
}
StateConditioned.displayName = 'BloomConditioned';

const tiered = new WeakMap<Paint, boolean>();

/** Whether a paint varies with the window: a variant with a breakpoint term. */
function answersTier(paint: Paint): boolean {
  let answers = tiered.get(paint);
  if (answers === undefined) {
    answers = (paint.variants ?? []).some((variant) =>
      termsOf(variant.condition).some((term) => (TIERS as readonly string[]).includes(term)),
    );
    tiered.set(paint, answers);
  }
  return answers;
}

/** The leaf that draws `paint`: a `Painted` one, or a `Conditioned` one when it has live variants. */
export function leafOf(paint: Paint): (props: PaintedProps) => ReactElement {
  if (paint.variants === undefined) return Painted;
  return answersTier(paint) ? Conditioned : StateConditioned;
}
