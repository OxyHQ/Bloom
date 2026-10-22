import { ConcentricProvider } from '../concentric/ConcentricProvider';
import { useConcentricGeometry } from '../concentric/use-concentric-geometry';
import { resolveSurfaceGeometry } from './resolve-surface-geometry';
import { SURFACE_SHAPES } from '../design-tokens/shapes';
import React, { forwardRef, memo } from 'react';
import type { ComponentRef } from 'react';
import { StyleSheet, type View } from 'react-native';
import { SurfaceLevelProvider } from '../styles/surface-levels';
import { useResolvedSurface } from './use-resolved-surface';
import { useThemeRecipe } from '../theme/use-theme-paint';
import { useSurfaceFillRecipe, useSurfaceLevelValue } from '../styles/surface-levels';
import { resolveSurfaceLayer } from './use-surface-layer';
import { resolveSurfaceMaterial } from './resolve-surface-material';
import { ServerStyleSheet } from '../styles/ServerStyleSheet';
import { borderRadius } from '../styles/tokens';
import { StyledView } from '../styles/styled-primitives';
import type { WebCssStyle } from '../styles/web-view-style';
import { useInteractiveWebCss } from '../styles/interactive-web-css';
import { resolveSurfaceOptics } from './shared';
import { surfaceMaterialCss } from './web-material';
import type { SurfaceProps } from './types';
import type { MemoRefComponent } from '../styles/native-refs';

const CSS = `
.bloom-surface {
  position: relative;
  isolation: isolate;
  box-sizing: border-box;
}
.bloom-surface { overflow: hidden; }
${surfaceMaterialCss('.bloom-surface--material', 'var(--bloom-surface-fill)')}
`;

const SurfaceComponent = forwardRef<ComponentRef<typeof View>, SurfaceProps>(
  function SurfaceComponent(
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
    const parent = useSurfaceFillRecipe();
    const parentLevel = useSurfaceLevelValue();
    const resolvedStyle = StyleSheet.flatten(style);
    const baseGeometry = resolveSurfaceGeometry(
      radius === 'concentric' ? undefined : radius,
      style,
      borderRadius.xl,
      cornerCurve,
    );
    const concentric = useConcentricGeometry({
      allowClassRadius: radius === undefined,
      webClasses: Boolean(className) && resolvedStyle?.borderRadius === undefined,
      radius:
        radius === 'concentric'
          ? 'concentric'
          : typeof baseGeometry.radius === 'number'
            ? baseGeometry.radius
            : undefined,
      style: resolvedStyle ?? undefined,
    });
    const geometry =
      radius === 'concentric' || concentric.hasClassRadius
        ? {
            radius: undefined,
            shape: {
              radius: concentric.radii,
              curve: radius === 'concentric' ? ('round' as const) : cornerCurve,
            },
            style: concentric.radiusStyle,
          }
        : baseGeometry;
    useInteractiveWebCss('bloom-surface-web-css', CSS);
    const override = fill ?? resolvedStyle?.backgroundColor;
    const material = useResolvedSurface({
      fill: override === undefined ? undefined : String(override),
    });
    const opticsRecipe = useThemeRecipe((theme, documentMode) =>
      resolveSurfaceOptics(theme.isDark),
    );
    const optics = opticsRecipe.paint;
    const materialRecipe = useThemeRecipe((theme, documentMode) => {
      const layer = resolveSurfaceLayer(theme, parent[documentMode], parentLevel);
      return resolveSurfaceMaterial({
        fill: override === undefined ? layer.fill : String(override),
        parentFill: layer.parentFill,
        parentLevel,
      });
    });
    const baseStyle: WebCssStyle = {
      '--bloom-surface-rim': optics.rim,
      '--bloom-surface-sheen': optics.sheenCss,
      ...geometry.style,
      backgroundColor: 'transparent',
      '--bloom-surface-fill': materialRecipe.paint.paintFill,
    };
    return (
      <>
        {opticsRecipe.sheet}
        {materialRecipe.sheet}
        <ServerStyleSheet id="bloom-surface-web-css" css={CSS} />
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
            {
              backgroundColor: 'transparent',
              ...materialRecipe.paint.vars,
              ...geometry.style,
              ...concentric.variables,
            },
          ]}
        >
          <SurfaceLevelProvider
            level={material.level}
            fill={material.publishedFill}
            fillModes={{
              light: materialRecipe.light.publishedFill,
              dark: materialRecipe.dark.publishedFill,
            }}
          >
            <ConcentricProvider value={concentric.context} variables={concentric.nativeVariables}>
              {children}
            </ConcentricProvider>
          </SurfaceLevelProvider>
        </StyledView>
      </>
    );
  },
);

export const Surface: MemoRefComponent<SurfaceProps> = memo(SurfaceComponent);
Surface.displayName = 'Surface';
