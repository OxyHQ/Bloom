import { resolveSurfaceGeometry } from './resolve-surface-geometry';
import { SURFACE_SHAPES } from '../design-tokens/shapes';
import React, { forwardRef, memo } from 'react';
import { styled } from 'react-native-css';
import { Platform, StyleSheet, type View } from 'react-native';
import { StyledView } from '../styles/styled-primitives';
import { borderRadius } from '../styles/tokens';
import { SurfaceLevelProvider } from '../styles/surface-levels';
import { useResolvedSurface } from './use-resolved-surface';
import { SurfacePaint } from './SurfacePaint';
import type { SurfaceProps } from './types';

/** Layout-neutral container: callers supply their own padding and content. */
const SurfaceComponent = forwardRef<View, SurfaceProps>(function SurfaceComponent(
  {
    children,
    fill,
    radius,
    cornerCurve = SURFACE_SHAPES.panel.curve,
    style,
    className,
    accessibilityLabel,
    testID,
    ...hostProps
  },
  ref,
) {
  const resolvedStyle = StyleSheet.flatten(style);
  const geometry = resolveSurfaceGeometry(radius, style, borderRadius.xl, cornerCurve);

  const override = fill ?? resolvedStyle?.backgroundColor;
  const material = useResolvedSurface({
    fill: override === undefined ? undefined : String(override),
  });
  return (
    <StyledView
      {...hostProps}
      ref={ref}
      className={className}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={[
        { position: 'relative' },
        style,
        { backgroundColor: 'transparent', ...material.vars, ...geometry.style },
      ]}
    >
      {material.painted ? (
        <SurfacePaint fill={material.paintFill} radius={geometry.radius} shape={geometry.shape} />
      ) : null}
      <SurfaceLevelProvider level={material.level} fill={material.publishedFill}>
        {children}
      </SurfaceLevelProvider>
    </StyledView>
  );
});

// Only these two props participate in the interop map; traversing ViewProps'
// event/ref graph exceeds styled()'s dot-path union (TS2590). Runtime forwarding
// still belongs to the original component, including its host ref.
const NativeSurface = styled(
  SurfaceComponent as React.ComponentType<Pick<SurfaceProps, 'className' | 'style'>>,
  { className: 'style' },
) as typeof SurfaceComponent;
export const Surface = memo(Platform.OS === 'web' ? SurfaceComponent : NativeSurface);
Surface.displayName = 'Surface';
