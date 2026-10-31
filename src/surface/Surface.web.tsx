import { resolvePaintMode } from '../theme/paint';
import { ConcentricProvider } from '../concentric/ConcentricProvider';
import { useConcentricGeometry } from '../concentric/use-concentric-geometry';
import { resolveSurfaceGeometry } from './resolve-surface-geometry';
import { SURFACE_SHAPES } from '../design-tokens/shapes';
import React, { forwardRef, memo, useCallback, useRef } from 'react';
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
import { resolveSurfaceOptics, surfaceContrastEdge, surfaceOpticsVars } from './shared';
import { SURFACE_HAIRLINE_VAR, surfaceMaterialCss } from './web-material';
import { useBakedMaterial } from './baked-material';
import type { SurfaceProps } from './types';
import type { MemoRefComponent } from '../styles/native-refs';

const CSS = `
.bloom-surface {
  position: relative;
  isolation: isolate;
  box-sizing: border-box;
}
.bloom-surface { overflow: hidden; }
.bloom-surface--material { overflow: clip; overflow-clip-margin: 1px; }
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
    const localRef = useRef<HTMLElement | null>(null);
    const hostRef = useCallback(
      (node: ComponentRef<typeof View> | null) => {
        localRef.current = node as unknown as HTMLElement | null;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      },
      [ref],
    );
    const override = fill ?? resolvedStyle?.backgroundColor;
    const material = useResolvedSurface({
      fill: override === undefined ? undefined : String(override),
    });
    const opticsRecipe = useThemeRecipe((theme) => resolveSurfaceOptics(theme.isDark), []);
    const optics = opticsRecipe.paint;
    const materialRecipe = useThemeRecipe(
      (theme, documentMode, documentPreset) => {
        const layer = resolveSurfaceLayer(
          theme,
          resolvePaintMode(parent, documentMode, documentPreset),
          parentLevel,
        );
        const resolved = resolveSurfaceMaterial({
          fill: override === undefined ? layer.fill : String(override),
          parentFill: layer.parentFill,
          parentLevel,
        });
        return {
          ...resolved,
          hairline: surfaceContrastEdge(resolved.solidFill, theme.colors.text),
        };
      },
      [parentLevel, parent, override],
    );
    useBakedMaterial(localRef, material.painted, [materialRecipe.paint.paintFill, optics]);
    const baseStyle: WebCssStyle = {
      ...surfaceOpticsVars(optics, geometry.radius ?? resolvedStyle?.borderRadius),
      ...geometry.style,
      backgroundColor: 'transparent',
      '--bloom-surface-fill': materialRecipe.paint.paintFill,
      '--bloom-surface-solid': materialRecipe.paint.solidFill,
      [SURFACE_HAIRLINE_VAR]: materialRecipe.paint.hairline,
    };
    return (
      <>
        {opticsRecipe.sheet}
        {materialRecipe.sheet}
        <ServerStyleSheet id="bloom-surface-web-css" css={CSS} />
        <StyledView
          {...hostProps}
          ref={hostRef}
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
              resolvePreset: (preset, mode) =>
                materialRecipe.resolvePreset(preset, mode).publishedFill,
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
