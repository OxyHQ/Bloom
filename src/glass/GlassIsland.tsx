import { resolveSurfaceGeometry } from '../surface/resolve-surface-geometry';
import { surfaceStyle } from '../shapes/surface-style';
import { SURFACE_SHAPES } from '../design-tokens/shapes';
import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useDirectionProps, useIsRtl } from '../hooks/use-is-rtl';
import { BloomScope } from "../appearance";
import { bloomShadowStyle } from '../design-tokens/shadows';
import { SurfaceLevelProvider } from '../styles/surface-levels';
import { useSurfaceLayer } from '../surface/use-surface-layer';
import { resolveSurfaceMaterial } from '../surface/resolve-surface-material';
import { borderRadius } from '../styles/tokens';
import { SurfacePaint } from '../surface/SurfacePaint';
import type { GlassIslandProps } from './types';

/** Floating control container using the shared glass material.
 * Paint clips itself so the host can preserve its external shadow.
 */
const GlassIslandComponent: React.FC<GlassIslandProps> = ({
  children,
  radius,
  cornerCurve = SURFACE_SHAPES.glass.curve,
  role,
  accessibilityLabel,
  sheen = true,
  style,
  testID,
}) => {
  const directionProps = useDirectionProps();
  const direction = useIsRtl() ? 'rtl' : 'ltr';
  const layer = useSurfaceLayer();
  const customStyle = StyleSheet.flatten(style);
  const material = resolveSurfaceMaterial({ fill: String(customStyle?.backgroundColor ?? layer.fill), parentFill: layer.parentFill, parentLevel: layer.parentLevel });
  const { paintFill: fill, publishedFill: publishedFill } = material;
  const geometry = resolveSurfaceGeometry(radius, style, borderRadius.full, cornerCurve);
  const shape = geometry.shape;

  return (
    <BloomScope>
      <View
        {...directionProps}
        role={role}
        accessibilityLabel={accessibilityLabel}
        testID={testID}
        style={[
          styles.island,
          {
            ...geometry.style, ...surfaceStyle(shape, direction),
          },
          bloomShadowStyle('glass'),
          style,
          { backgroundColor: 'transparent', ...material.vars, ...geometry.style, ...surfaceStyle(shape, direction) },
        ]}
      >
        <SurfacePaint
          fill={fill}
          radius={geometry.radius}
          shape={shape}
          direction={direction}
          sheen={sheen}
          testID={testID ? `${testID}-material` : undefined}
        />
        <SurfaceLevelProvider level={material.level} fill={publishedFill}>{children}</SurfaceLevelProvider>
      </View>
    </BloomScope>
  );
};

const styles = StyleSheet.create({
  island: {
    flexDirection: 'row',
    alignItems: 'stretch',
    alignSelf: 'flex-start',
    position: 'relative',
  },
});

export const GlassIsland = memo(GlassIslandComponent);
GlassIsland.displayName = 'GlassIsland';
