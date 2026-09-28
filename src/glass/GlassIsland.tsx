import { surfaceStyle } from '../shapes/surface-style';
import { SURFACE_SHAPES } from '../design-tokens/shapes';
import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useDirectionProps, useIsRtl } from '../hooks/use-is-rtl';
import { ControlSurface } from '../control-surface';
import { bloomShadowStyle } from '../design-tokens/shadows';
import { SurfaceLevelProvider, surfaceFillVars, hairlineOn } from '../styles/surface-levels';
import { useSurfaceLayer } from '../surface/use-surface-layer';
import { resolveSurfaceFill } from '../surface/shared';
import { borderRadius } from '../styles/tokens';
import { withAlpha } from '../theme/color-utils';
import { BORDER_WIDTH } from '../design-tokens/scales';
import { useTheme } from '../theme/use-theme';
import { SurfacePaint } from '../surface/SurfacePaint';
import type { GlassIslandProps } from './types';

/** Floating control container using shared material; glass is an explicit opt-in.
 * Paint clips itself so the host can preserve its external shadow.
 */
const GlassIslandComponent: React.FC<GlassIslandProps> = ({
  children,
  material = 'solid',
  radius = borderRadius.full,
  cornerCurve = SURFACE_SHAPES.glass.curve,
  role,
  accessibilityLabel,
  sheen = true,
  style,
  testID,
}) => {
  const theme = useTheme();
  const directionProps = useDirectionProps();
  const direction = useIsRtl() ? 'rtl' : 'ltr';
  const layer = useSurfaceLayer();
  const customStyle = StyleSheet.flatten(style);
  const glass = material === 'glass';
  const tint = String(customStyle?.backgroundColor ?? (glass ? withAlpha(layer.fill, 0.25) : layer.fill));
  const fill = resolveSurfaceFill(tint, glass, layer.parentFill);
  const publishedFill = resolveSurfaceFill(fill, false, layer.parentFill);
  const shape = { radius, curve: radius === borderRadius.full ? 'round' as const : cornerCurve };

  return (
    <ControlSurface material={material}>
      <View
        {...directionProps}
        role={role}
        accessibilityLabel={accessibilityLabel}
        testID={testID}
        style={[
          styles.island,
          {
            ...surfaceStyle(shape, direction),
            borderWidth: BORDER_WIDTH.hairline,
            borderColor: hairlineOn(theme, publishedFill),
          },
          bloomShadowStyle('glass'),
          style,
          { backgroundColor: 'transparent', ...surfaceFillVars(publishedFill), ...surfaceStyle(shape, direction), borderWidth: BORDER_WIDTH.hairline },
        ]}
      >
        <SurfacePaint
          fill={fill}
          backdrop={layer.parentFill}
          glass={glass}
          radius={radius}
          shape={shape}
          direction={direction}
          sheen={sheen}
          testID={testID ? `${testID}-material` : undefined}
        />
        <SurfaceLevelProvider level={layer.level} fill={publishedFill}>{children}</SurfaceLevelProvider>
      </View>
    </ControlSurface>
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
