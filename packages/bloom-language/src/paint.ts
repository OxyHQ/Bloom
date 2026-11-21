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
import {
  parseRgb,
  useTheme,
  useThemePaint,
  withAlpha,
  type ThemeColors,
} from '@oxy.so/bloom/theme';

import { COLORS } from './generated/spec.generated';
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
}

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

/**
 * A colour at an opacity: Bloom's `withAlpha` of a colour it can parse, as an
 * app writes it (Surface computes its material from its fill, which a
 * `color-mix()` hides from it: drawn opaque, at 72%). A web paint can be a CSS
 * variable (Bloom's prepaint), which only the browser can mix.
 */
function atOpacity(color: string, opacity: number): string {
  return !IS_WEB || parseRgb(color) !== null
    ? withAlpha(color, opacity)
    : `color-mix(in srgb, ${color} ${opacity * 100}%, transparent)`;
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
      for (const [key, role, opacity] of paint.styleRoles) {
        const color = colors[COLORS[role].paint];
        style[key] = opacity === undefined ? color : atOpacity(color, opacity);
      }
      props.style = Object.freeze(style);
    } else if (paint.style !== undefined) {
      props.style = paint.style;
    }
    for (const [key, role, opacity] of paint.propRoles) {
      const color = colors[COLORS[role].paint];
      props[key] = opacity === undefined ? color : atOpacity(color, opacity);
    }
    Object.freeze(props);
    byPaint.set(paint, props);
  }
  return props;
}

interface PaintedProps {
  host: ComponentType<Record<string, unknown>> | string;
  paint: Paint;
  children?: ReactNode;
  [prop: string]: unknown;
}

/**
 * The one place the language reads the theme: a leaf that draws `host` with
 * the colours `paint` names. The trees above it are theme-free, so a theme
 * switch re-renders these leaves and no view body (the theme reaches them
 * through context, past every memoized view in between).
 */
export function Painted({ host, paint, ...props }: PaintedProps): ReactElement {
  const painted = paintProps(useThemePaint(), paint);
  // A moving host's motion style (`Outer`) comes after the painted one.
  if (props.style !== undefined && painted.style !== undefined) {
    return createElement(host, { ...props, ...painted, style: [painted.style, props.style] });
  }
  return createElement(host, { ...props, ...painted });
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
    const style: Record<string, unknown> = { ...(base.style as object | undefined) };
    const next: Record<string, unknown> = { ...base };
    const paintColor = (role: ColorName, opacity: number | undefined) => {
      const color = colors[COLORS[role].paint];
      return opacity === undefined ? color : atOpacity(color, opacity);
    };
    (paint.variants ?? []).forEach((variant, index) => {
      if ((holding & (1 << index)) === 0) return;
      Object.assign(style, variant.style);
      Object.assign(next, variant.props);
      for (const [key, role, opacity] of variant.styleRoles) style[key] = paintColor(role, opacity);
      for (const [key, role, opacity] of variant.propRoles ?? [])
        next[key] = paintColor(role, opacity);
    });
    // A paint of props alone (an icon's fill) gains no style.
    if (base.style !== undefined || Object.keys(style).length > 0)
      next.style = Object.freeze(style);
    props = Object.freeze(next);
    byHolding.set(holding, props);
  }
  return props;
}

/**
 * A `Painted` leaf whose style has live variants (native): it reads what they
 * hold on (the window's breakpoint tier, the scheme, the state of the view it
 * belongs to) and draws the props built once for that set. A resize re-renders
 * it only across a breakpoint, a press only the leaves of the pressed view.
 */
export function Conditioned({ host, paint, ...props }: PaintedProps): ReactElement {
  const colors = useThemePaint();
  const { isDark } = useTheme();
  const tier = useWindowBreakpoint();
  const state = useContext(InteractionContext);
  let holding = 0;
  (paint.variants ?? []).forEach((variant, index) => {
    if (holds(variant.condition, tier, isDark, state)) holding |= 1 << index;
  });
  return createElement(host, { ...props, ...conditionedProps(colors, paint, holding) });
}
Conditioned.displayName = 'BloomConditioned';
