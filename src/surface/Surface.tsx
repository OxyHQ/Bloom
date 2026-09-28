import React, { forwardRef, memo } from 'react';
import { styled } from 'react-native-css';
import { Platform, StyleSheet, type View } from 'react-native';
import { parseRgba, withAlpha } from '../theme/color-utils';
import { StyledView } from '../styles/styled-primitives';
import { borderRadius } from '../styles/tokens';
import { SurfaceLevelProvider, surfaceFillVars } from '../styles/surface-levels';
import { useSurfaceLayer } from './use-surface-layer';
import { resolveSurfaceFill } from './shared';
import { SurfacePaint } from './SurfacePaint';
import type { SurfaceProps } from './types';

/** Layout-neutral container: callers supply their own padding and content. */
const SurfaceComponent = forwardRef<View, SurfaceProps>(function SurfaceComponent({
  children, material = 'solid', fill, radius = borderRadius.xl,
  style, className, accessibilityLabel, testID, ...hostProps
}, ref) {
  const glass = material === 'glass';
  const layer = useSurfaceLayer();
  const resolvedStyle = StyleSheet.flatten(style);
  const effectiveRadius = resolvedStyle?.borderRadius ?? radius;
  const tint = fill ?? resolvedStyle?.backgroundColor ?? (glass ? withAlpha(layer.fill, 0.25) : layer.fill);
  const painted = glass || (tint !== 'transparent' && parseRgba(String(tint))?.a !== 0);
  const color = resolveSurfaceFill(String(tint), glass, layer.parentFill);
  const publishedFill = painted ? resolveSurfaceFill(color, false, layer.parentFill) : layer.parentFill;
  return (
    <StyledView
      {...hostProps}
      ref={ref}
      className={className}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={[{ position: 'relative', borderRadius: effectiveRadius }, style, { backgroundColor: 'transparent', ...surfaceFillVars(painted ? publishedFill : undefined) }]}
    >
      {painted ? <SurfacePaint fill={color} backdrop={layer.parentFill} radius={effectiveRadius} glass={glass} /> : null}
      <SurfaceLevelProvider level={painted ? layer.level : layer.parentLevel} fill={publishedFill}>{children}</SurfaceLevelProvider>
    </StyledView>
  );
});

// Only these two props participate in the interop map; traversing ViewProps'
// event/ref graph exceeds styled()'s dot-path union (TS2590). Runtime forwarding
// still belongs to the original component, including its host ref.
const NativeSurface = styled(SurfaceComponent as React.ComponentType<Pick<SurfaceProps, 'className' | 'style'>>, { className: 'style' }) as typeof SurfaceComponent;
export const Surface = memo(Platform.OS === 'web' ? SurfaceComponent : NativeSurface);
Surface.displayName = 'Surface';
