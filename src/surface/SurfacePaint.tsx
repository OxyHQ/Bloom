import { surfaceStyle } from '../shapes/surface-style';
import type { SurfaceShape } from '../shapes/corner-types';
import React, { memo, useEffect } from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useSvgIdPrefix } from '../styles/svg-id';
import { StyledView } from '../styles/styled-primitives';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import type { WebCssStyle } from '../styles/web-view-style';
import { surfaceMaterialCss } from './web-material';
import { useSurfaceRefraction } from './web-refraction';
import { useTheme } from '../theme/use-theme';
import { resolveSurfaceFill, resolveSurfaceOptics, surfaceSvgStop } from './shared';

const WEB_PAINT_CSS = `
.bloom-surface-paint { isolation: isolate; overflow: hidden; }
${surfaceMaterialCss('.bloom-surface-paint--solid', 'var(--bloom-surface-paint-fill)')}
${surfaceMaterialCss('.bloom-surface-paint--glass', 'var(--bloom-surface-paint-fill)', 'none', true)}
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
  backdrop,
  radius,
  shape,
  direction = 'ltr',
  glass = false,
  sheen = true,
  testID,
}: {
  glass?: boolean;
  sheen?: boolean;
  testID?: string;
  /** Omit for sheen/rim only on a host that already owns its fill. */
  fill?: string;
  /** Actual parent fill when compositing a solid material. */
  backdrop?: string;
  radius?: NonNullable<ViewStyle['borderRadius']>;
  /** Same policy as the host; radius can remain owned by an animated host. */
  shape?: SurfaceShape;
  direction?: 'ltr' | 'rtl';
}) {
  const geometry = { ...(radius === undefined ? {} : { borderRadius: radius }), ...surfaceStyle(shape ?? { curve: 'round' }, direction) };
  const theme = useTheme();
  const optics = resolveSurfaceOptics(theme.isDark);
  const resolvedFill = fill === undefined ? 'transparent' : resolveSurfaceFill(fill, glass, backdrop ?? theme.colors.card);
  const id = useSvgIdPrefix('bloom-surface');
  const isWeb = Platform.OS === 'web';
  useSurfaceRefraction(isWeb && glass);
  useEffect(() => {
    if (isWeb) adoptStyleSheet('bloom-surface-paint-web-css', WEB_PAINT_CSS);
  }, [isWeb]);
  if (isWeb) {
    const paintStyle: WebCssStyle = {
      position: 'absolute',
      top: 0, right: 0, bottom: 0, left: 0,
      ...geometry,
      backgroundColor: 'transparent',
      '--bloom-surface-paint-fill': resolvedFill,
      '--bloom-surface-rim': optics.rim,
      '--bloom-surface-sheen': optics.sheenCss,
    };
    return <StyledView testID={testID} pointerEvents="none" className={`${glass ? 'bloom-surface-paint bloom-surface-paint--glass' : 'bloom-surface-paint bloom-surface-paint--solid'}${sheen ? '' : ' bloom-surface-paint--no-sheen'}`} style={paintStyle} />;
  }
  const base = surfaceSvgStop(resolvedFill);
  return (
    <View
      testID={testID}
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, geometry, { overflow: 'hidden' }]}
    >
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          {sheen ? <LinearGradient id={`${id}-sheen`} x1="0" y1="0" x2="0" y2="1">
            {optics.sheen.map(stop => <Stop key={stop.offset} offset={String(stop.offset)} stopColor={stop.color} stopOpacity={stop.opacity} />)}
          </LinearGradient> : null}
        </Defs>
        {fill !== undefined ? <Rect x="0" y="0" width="100%" height="100%" fill={base.color} fillOpacity={base.opacity} /> : null}
        {sheen ? <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id}-sheen)`} /> : null}
      </Svg>
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, geometry, { boxShadow: optics.rim }]} />
    </View>
  );
});

