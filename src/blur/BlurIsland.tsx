import { resolveSurfaceGeometry } from '../surface/resolve-surface-geometry';
import { surfaceStyle } from '../shapes/surface-style';
import { SURFACE_SHAPES } from '../design-tokens/shapes';
import type React from 'react';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useDirectionProps, useIsRtl } from '../hooks/use-is-rtl';
import { BloomScope } from '../appearance';
import { bloomShadowStyle } from '../design-tokens/shadows';
import { SurfaceLevelProvider } from '../styles/surface-levels';
import { useSurfaceLayer } from '../surface/use-surface-layer';
import { resolveSurfaceMaterial } from '../surface/resolve-surface-material';
import { borderRadius } from '../styles/tokens';
import { SurfacePaint } from '../surface/SurfacePaint';
import { useLensFrame, withLens } from '../floating/lens/lens-frame';
import type { BlurIslandProps } from './types';

/** Floating control container using the shared surface material.
 * Paint clips itself so the host can preserve its external shadow.
 */
const BlurIslandComponent: React.FC<BlurIslandProps> = ({
  children,
  radius,
  cornerCurve = SURFACE_SHAPES.island.curve,
  role,
  accessibilityLabel,
  sheen = true,
  material: variant = 'lens',
  style,
  testID,
}) => {
  const frame = useLensFrame(variant === 'lens', style);
  const directionProps = useDirectionProps();
  const direction = useIsRtl() ? 'rtl' : 'ltr';
  const layer = useSurfaceLayer();
  const customStyle = StyleSheet.flatten(style);
  const material = resolveSurfaceMaterial({
    fill: String(customStyle?.backgroundColor ?? layer.fill),
    parentFill: layer.parentFill,
    parentLevel: layer.parentLevel,
  });
  const { paintFill: fill, publishedFill } = material;
  const geometry = resolveSurfaceGeometry(radius, style, borderRadius.full, cornerCurve);
  const shape = geometry.shape;

  if (frame.lens) {
    // The island is the native lens: the engine draws the material, its shadow and its light, and the
    // controls inside draw their content. Placement stays on the host, the look on the inner view.
    // It floats over what moves behind (a map, a feed), so the window draws its lens.
    return (
      <BloomScope>
        {withLens(
          frame,
          <View
            collapsable={false}
            {...directionProps}
            role={role}
            accessibilityLabel={accessibilityLabel}
            testID={testID}
            style={[
              styles.island,
              { borderRadius: geometry.radius, overflow: 'hidden' },
              frame.style,
            ]}
          >
            <SurfaceLevelProvider level={material.level} fill={publishedFill}>
              {children}
            </SurfaceLevelProvider>
          </View>,
          {
            radius: typeof geometry.radius === 'number' ? geometry.radius : undefined,
            floating: true,
          },
        )}
      </BloomScope>
    );
  }

  return (
    <BloomScope>
      <View
        collapsable={false}
        {...directionProps}
        role={role}
        accessibilityLabel={accessibilityLabel}
        testID={testID}
        style={[
          styles.island,
          {
            ...geometry.style,
            ...surfaceStyle(shape, direction),
          },
          bloomShadowStyle('floating'),
          style,
          {
            backgroundColor: 'transparent',
            ...material.vars,
            ...geometry.style,
            ...surfaceStyle(shape, direction),
          },
        ]}
      >
        <SurfacePaint
          floating
          fill={fill}
          radius={geometry.radius}
          shape={shape}
          direction={direction}
          sheen={sheen}
          testID={testID ? `${testID}-material` : undefined}
        />
        <SurfaceLevelProvider level={material.level} fill={publishedFill}>
          {children}
        </SurfaceLevelProvider>
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

export const BlurIsland = memo(BlurIslandComponent);
BlurIsland.displayName = 'BlurIsland';
