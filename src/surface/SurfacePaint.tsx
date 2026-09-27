import React, { memo, useMemo, useEffect } from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { StyledView } from '../styles/styled-primitives';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import type { WebCssStyle } from '../styles/web-view-style';
import { surfaceMaterialCss } from './web-material';
import { useSurfaceRefraction } from './web-refraction';
import { SURFACE_SHEEN, SURFACE_RIM, surfaceSvgStop } from './shared';

const WEB_PAINT_CSS = `
.bloom-surface-paint { isolation: isolate; overflow: hidden; }
${surfaceMaterialCss('.bloom-surface-paint--glass', 'var(--bloom-surface-paint-fill)')}
`;

let surfaceGradientIdCounter = 0;

/**
 * The filled variants' top-to-bottom gradient, painted under the label.
 *
 * Tint and sheen share one SVG. Alpha is explicitly split into stopOpacity,
 * because react-native-svg drops alpha embedded in stopColor.
 */
export const SurfacePaint = memo(function SurfacePaint({
  fill,
  radius,
  glass = true,
}: {
  glass?: boolean;
  fill: string;
  radius: NonNullable<ViewStyle['borderRadius']>;
}) {
  const id = useMemo(() => `bloom-surface-gradient${surfaceGradientIdCounter++}`, []);
  const isWeb = Platform.OS === 'web';
  useSurfaceRefraction(isWeb && glass);
  useEffect(() => {
    if (isWeb) adoptStyleSheet('bloom-surface-paint-web-css', WEB_PAINT_CSS);
  }, [isWeb]);
  const stops = [fill, fill].map(surfaceSvgStop);
  if (isWeb) {
    const paintStyle: WebCssStyle = {
      ...StyleSheet.absoluteFillObject,
      borderRadius: radius,
      backgroundColor: glass ? 'transparent' : fill,
      '--bloom-surface-paint-fill': fill,
    };
    return <StyledView pointerEvents="none" className={glass ? 'bloom-surface-paint bloom-surface-paint--glass' : 'bloom-surface-paint'} style={paintStyle} />;
  }
  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { borderRadius: radius, overflow: 'hidden' }]}
    >
      <Svg style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={stops[0]!.color} stopOpacity={stops[0]!.opacity} />
            <Stop offset="1" stopColor={stops[1]!.color} stopOpacity={stops[1]!.opacity} />
          </LinearGradient>
          {glass ? <LinearGradient id={`${id}-sheen`} x1="0" y1="0" x2="0" y2="1">
            {SURFACE_SHEEN.map(stop => <Stop key={stop.offset} offset={String(stop.offset)} stopColor={stop.color} stopOpacity={stop.opacity} />)}
          </LinearGradient> : null}
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
        {glass ? <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id}-sheen)`} /> : null}
      </Svg>
      {glass ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radius, boxShadow: SURFACE_RIM }]} /> : null}
    </View>
  );
});

