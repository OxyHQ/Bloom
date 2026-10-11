import { surfaceStyle } from '../shapes/surface-style';
import type { SurfaceShape } from '../shapes/corner-types';
import React, { memo, useCallback, useEffect, useState } from 'react';
import { Platform, StyleSheet, View, type LayoutChangeEvent, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useSvgIdPrefix } from '../styles/svg-id';
import { StyledView } from '../styles/styled-primitives';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import type { WebCssStyle } from '../styles/web-view-style';
import { surfaceMaterialCss } from './web-material';
import { useSurfaceRefraction } from './web-refraction';
import { useTheme } from '../theme/use-theme';
import { resolveSurfaceTint, resolveSurfaceOptics, surfaceSvgStop } from './shared';

const WEB_PAINT_CSS = `
.bloom-surface-paint { isolation: isolate; overflow: hidden; }
${surfaceMaterialCss('.bloom-surface-paint', 'var(--bloom-surface-paint-fill)')}
.bloom-surface-paint--no-sheen::after { background-image: none; }
`;

/**
 * The filled variants' top-to-bottom gradient, painted under the label.
 *
 * Tint and sheen share one SVG. Alpha is explicitly split into stopOpacity,
 * because react-native-svg drops alpha embedded in stopColor.
 */
export const SurfacePaint = memo(function SurfacePaint({
  fill,
  radius,
  shape,
  direction = 'ltr',
  sheen = true,
  testID,
}: {
  sheen?: boolean;
  testID?: string;
  /** Omit for sheen/rim only on a host that already owns its fill. */
  fill?: string;
  radius?: NonNullable<ViewStyle['borderRadius']>;
  /** Same policy as the host; radius can remain owned by an animated host. */
  shape?: SurfaceShape;
  direction?: 'ltr' | 'rtl';
}) {
  const geometry = {
    ...(radius === undefined ? {} : { borderRadius: radius }),
    ...surfaceStyle(shape ?? { curve: 'round' }, direction),
  };
  const theme = useTheme();
  const optics = resolveSurfaceOptics(theme.isDark);
  const resolvedFill = resolveSurfaceTint(fill ?? 'transparent');
  const id = useSvgIdPrefix('bloom-surface');
  const isWeb = Platform.OS === 'web';
  const [nativeSize, setNativeSize] = useState<{ width: number; height: number } | null>(null);
  const onNativeLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return;
    setNativeSize((previous) =>
      previous?.width === width && previous.height === height ? previous : { width, height },
    );
  }, []);
  useSurfaceRefraction(isWeb);
  useEffect(() => {
    if (isWeb) adoptStyleSheet('bloom-surface-paint-web-css', WEB_PAINT_CSS);
  }, [isWeb]);
  if (isWeb) {
    const paintStyle: WebCssStyle = {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      ...geometry,
      backgroundColor: 'transparent',
      '--bloom-surface-paint-fill': resolvedFill,
      '--bloom-surface-rim': optics.rim,
      '--bloom-surface-sheen': optics.sheenCss,
    };
    return (
      <StyledView
        testID={testID}
        pointerEvents="none"
        className={`bloom-surface-paint${sheen ? '' : ' bloom-surface-paint--no-sheen'}`}
        style={paintStyle}
      />
    );
  }
  const base = surfaceSvgStop(resolvedFill);
  return (
    <View
      testID={testID}
      onLayout={onNativeLayout}
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, geometry, { overflow: 'hidden' }]}
    >
      {/* Android SVG percentage paths cache canvas dimensions after first paint.
          Update the actual Rect geometry when this backing View changes size. */}
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          {sheen ? (
            <LinearGradient id={`${id}-sheen`} x1="0" y1="0" x2="0" y2="1">
              {optics.sheen.map((stop) => (
                <Stop
                  key={stop.offset}
                  offset={String(stop.offset)}
                  stopColor={stop.color}
                  stopOpacity={stop.opacity}
                />
              ))}
            </LinearGradient>
          ) : null}
        </Defs>
        {fill !== undefined ? (
          <Rect
            x="0"
            y="0"
            width={nativeSize?.width ?? '100%'}
            height={nativeSize?.height ?? '100%'}
            fill={base.color}
            fillOpacity={base.opacity}
          />
        ) : null}
        {sheen ? (
          <Rect
            x="0"
            y="0"
            width={nativeSize?.width ?? '100%'}
            height={nativeSize?.height ?? '100%'}
            fill={`url(#${id}-sheen)`}
          />
        ) : null}
      </Svg>
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, geometry, { boxShadow: optics.rim }]}
      />
    </View>
  );
});
