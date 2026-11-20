import { createElement, type ComponentType, type ReactElement, type ReactNode } from 'react';
import { Platform } from 'react-native';
import { useThemePaint, withAlpha, type ThemeColors } from '@oxy.so/bloom/theme';

import { COLORS } from './generated/spec.generated';
import type { ColorName } from './tokens';

/**
 * What a `Painted` leaf fills from the theme: style properties painted from
 * colour roles (native; the web paints style roles with CSS variables), and
 * props painted from roles, optionally at an opacity (an icon's `fill`, a
 * glass Surface's `fill`, on every platform).
 */
export interface Paint {
  readonly style: object | undefined;
  readonly styleRoles: readonly (readonly [string, ColorName])[];
  readonly propRoles: readonly (readonly [string, ColorName, number?])[];
}

const IS_WEB = Platform.OS === 'web';
const resolved = new WeakMap<ThemeColors, WeakMap<Paint, Record<string, unknown>>>();

/**
 * A colour at an opacity. Native paints parse to RGB; a web paint can be a CSS
 * variable (Bloom's prepaint), which only the browser can mix.
 */
function atOpacity(color: string, opacity: number): string {
  return IS_WEB
    ? `color-mix(in srgb, ${color} ${opacity * 100}%, transparent)`
    : withAlpha(color, opacity);
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
      for (const [key, role] of paint.styleRoles) style[key] = colors[COLORS[role].paint];
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
  return createElement(host, { ...props, ...painted });
}
Painted.displayName = 'BloomPaint';
