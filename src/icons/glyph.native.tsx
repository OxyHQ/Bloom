import type { ForwardedRef } from 'react';
import {
  type ColorValue,
  type HostComponent,
  processColor,
  requireNativeComponent,
  UIManager,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import type Svg from 'react-native-svg';

import { gradients } from '../styles/tokens';
import { type GlyphSpec, svgGlyph } from './glyph-svg';
import { type Props, useCommonSVGProps } from './shared';

export type { GlyphSpec } from './glyph-svg';

/** `BloomIconV1` (`android/…/icons/BloomIcon.kt`): the versioned name is the prop contract. */
type NativeIconProps = ViewProps & {
  paths: readonly string[];
  viewBox: string;
  fill: ColorValue | null;
  strokeWidth: number;
  strokeLinecap: GlyphSpec['strokeLinecap'];
  strokeLinejoin: GlyphSpec['strokeLinejoin'];
  /** react-native-svg's stop list: `[offset, ARGB, offset, ARGB, …]`. */
  gradient: readonly number[] | null;
};

let nativeIcon: HostComponent<NativeIconProps> | null | undefined;

/**
 * The native icon view, when the app's binary has it. A JavaScript-only update
 * (an OTA bundle on an older binary, Expo Go, iOS until it has the view) keeps
 * react-native-svg, so every icon still draws.
 */
function loadNativeIcon() {
  if (nativeIcon === undefined) {
    try {
      nativeIcon = UIManager.hasViewManagerConfig?.('BloomIconV1')
        ? requireNativeComponent<NativeIconProps>('BloomIconV1')
        : null;
    } catch {
      nativeIcon = null;
    }
  }
  return nativeIcon;
}

const stopLists = new Map<keyof typeof gradients, readonly number[]>();

/** A gradient token's stops, as react-native-svg's `extractGradient` sends them (opaque stops). */
function stopList(name: keyof typeof gradients): readonly number[] {
  let list = stopLists.get(name);
  if (list === undefined) {
    list = gradients[name].values.flatMap(([offset, color]) => [
      offset,
      ((processColor(color) as number) & 0x00ffffff) | (255 << 24),
    ]);
    stopLists.set(name, list);
  }
  return list;
}

const boxes = new Map<number, ViewStyle>();

/** react-native-svg's root override for a sized `<Svg>`: the side, and `flex: 0`. */
function box(size: number): ViewStyle {
  let style = boxes.get(size);
  if (style === undefined) {
    style = { width: size, height: size, flex: 0 };
    boxes.set(size, style);
  }
  return style;
}

/**
 * Draws a Bloom icon on native: ONE native view that draws the path on the
 * hardware canvas, where react-native-svg mounts three views and rasterises
 * the glyph in software. The paint is resolved exactly as for the SVG
 * (`useCommonSVGProps`): `fill`, else `style.color`, else the theme's primary;
 * a `gradient` token wins over the fill; `currentColor` is the `color` prop or
 * `style.color`, black without either (react-native-svg's default).
 *
 * What the native view draws: fill, stroke, the gradient tokens and `opacity`,
 * with every View prop (layout style, accessibility, testID, onLayout). SVG
 * paint props an icon never needed (`fillOpacity`, `strokeDasharray`, an SVG
 * `transform`…) are not drawn there.
 */
export function useGlyph(glyph: GlyphSpec, props: Props, ref: ForwardedRef<Svg>) {
  const common = useCommonSVGProps(props);
  const NativeIcon = loadNativeIcon();
  if (NativeIcon === null) return svgGlyph(glyph, common, ref);

  const {
    fill,
    size,
    style,
    gradient: _gradientDefs,
    width: _width,
    height: _height,
    color,
    opacity,
    transform: _transform,
    viewBox: _viewBox,
    strokeWidth: _strokeWidth,
    strokeLinecap: _strokeLinecap,
    strokeLinejoin: _strokeLinejoin,
    ...rest
  } = common;
  const token = props.gradient && gradients[props.gradient] ? props.gradient : undefined;
  let paint: ColorValue | null = null;
  if (token === undefined && fill !== 'none' && fill != null) {
    paint =
      fill === 'currentColor'
        ? (color ?? (style as { color?: ColorValue } | null | undefined)?.color ?? 'black')
        : fill;
  }
  const stroked = glyph.kind === 'single' && glyph.strokeWidth > 0;

  return (
    <NativeIcon
      {...(rest as ViewProps)}
      ref={ref as never}
      style={
        opacity == null ? [style, box(size)] : [style, box(size), { opacity: Number(opacity) }]
      }
      paths={glyph.paths}
      viewBox={glyph.viewBox}
      fill={paint}
      strokeWidth={stroked ? glyph.strokeWidth : 0}
      strokeLinecap={glyph.strokeLinecap}
      strokeLinejoin={glyph.strokeLinejoin}
      gradient={token === undefined ? null : stopList(token)}
    />
  );
}
