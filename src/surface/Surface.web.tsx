import { resolveSurfaceGeometry } from './resolve-surface-geometry';
import { SURFACE_SHAPES } from '../design-tokens/shapes';
import React, { forwardRef, memo } from 'react';
import { StyleSheet, type View } from 'react-native';
import { SurfaceLevelProvider } from '../styles/surface-levels';
import { useResolvedSurface } from './use-resolved-surface';
import { useTheme } from '../theme/use-theme';
import { borderRadius } from '../styles/tokens';
import { StyledView } from '../styles/styled-primitives';
import type { WebCssStyle } from '../styles/web-view-style';
import { useInteractiveWebCss } from '../styles/interactive-web-css';
import { resolveSurfaceOptics } from './shared';
import { surfaceMaterialCss } from './web-material';
import { useSurfaceRefraction } from './web-refraction';
import type { SurfaceProps } from './types';

const CSS = `
.bloom-surface {
  position: relative;
  isolation: isolate;
  box-sizing: border-box;
}
.bloom-surface { overflow: hidden; }
${surfaceMaterialCss('.bloom-surface--material', 'var(--bloom-surface-fill)')}
`;

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
  const theme = useTheme();
  const resolvedStyle = StyleSheet.flatten(style);
  const geometry = resolveSurfaceGeometry(radius, style, borderRadius.xl, cornerCurve);
  useInteractiveWebCss('bloom-surface-web-css', CSS);
  const override = fill ?? resolvedStyle?.backgroundColor;
  const material = useResolvedSurface({
    fill: override === undefined ? undefined : String(override),
  });
  useSurfaceRefraction(material.painted);
  const optics = resolveSurfaceOptics(theme.isDark);
  const baseStyle: WebCssStyle = {
    '--bloom-surface-rim': optics.rim,
    '--bloom-surface-sheen': optics.sheenCss,
    ...geometry.style,
    backgroundColor: 'transparent',
    '--bloom-surface-fill': material.paintFill,
  };
  return (
    <StyledView
      {...hostProps}
      ref={ref}
      className={['bloom-surface', material.painted ? 'bloom-surface--material' : '', className]
        .filter(Boolean)
        .join(' ')}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={[
        baseStyle,
        style,
        { backgroundColor: 'transparent', ...material.vars, ...geometry.style },
      ]}
    >
      <SurfaceLevelProvider level={material.level} fill={material.publishedFill}>
        {children}
      </SurfaceLevelProvider>
    </StyledView>
  );
});

export const Surface = memo(SurfaceComponent);
Surface.displayName = 'Surface';
