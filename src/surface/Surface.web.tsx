import React, { forwardRef, memo } from 'react';
import { StyleSheet, type View } from 'react-native';
import { SurfaceLevelProvider, surfaceFillVars } from '../styles/surface-levels';
import { useSurfaceLayer } from './use-surface-layer';
import { useTheme } from '../theme/use-theme';
import { parseRgba, withAlpha } from '../theme/color-utils';
import { borderRadius } from '../styles/tokens';
import { StyledView } from '../styles/styled-primitives';
import type { WebCssStyle } from '../styles/web-view-style';
import { useInteractiveWebCss } from '../styles/interactive-web-css';
import { resolveSurfaceFill, resolveSurfaceOptics } from './shared';
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
${surfaceMaterialCss('.bloom-surface--solid', 'var(--bloom-surface-fill)')}
${surfaceMaterialCss('.bloom-surface--glass', 'var(--bloom-surface-fill)', 'none', true)}
`;

const SurfaceComponent = forwardRef<View, SurfaceProps>(function SurfaceComponent({
  children, material = 'solid', fill, radius = borderRadius.xl,
  style, className, accessibilityLabel, testID, ...hostProps
}, ref) {
  const theme = useTheme();
  const glass = material === 'glass';
  const layer = useSurfaceLayer();
  const resolvedStyle = StyleSheet.flatten(style);
  useInteractiveWebCss('bloom-surface-web-css', CSS);
  useSurfaceRefraction(glass);
  const tint = fill ?? resolvedStyle?.backgroundColor ?? (glass ? withAlpha(layer.fill, 0.25) : layer.fill);
  const painted = glass || (tint !== 'transparent' && parseRgba(String(tint))?.a !== 0);
  const color = resolveSurfaceFill(String(tint), glass, layer.parentFill);
  const publishedFill = painted ? resolveSurfaceFill(color, false, layer.parentFill) : layer.parentFill;
  const optics = resolveSurfaceOptics(theme.isDark);
  const baseStyle: WebCssStyle = {
    '--bloom-surface-rim': optics.rim,
    '--bloom-surface-sheen': optics.sheenCss,
    borderRadius: radius,
    backgroundColor: 'transparent',
    '--bloom-surface-fill': color,
  };
  return (
    <StyledView
      {...hostProps}
      ref={ref}
      className={['bloom-surface', painted ? glass ? 'bloom-surface--glass' : 'bloom-surface--solid' : '', className].filter(Boolean).join(' ')}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={[baseStyle, style, { backgroundColor: 'transparent', ...surfaceFillVars(painted ? publishedFill : undefined) }]}
    >
      <SurfaceLevelProvider level={painted ? layer.level : layer.parentLevel} fill={publishedFill}>{children}</SurfaceLevelProvider>
    </StyledView>
  );
});

export const Surface = memo(SurfaceComponent);
Surface.displayName = 'Surface';
