import { ConcentricProvider } from '../concentric/ConcentricProvider';
import { useConcentricGeometry } from '../concentric/use-concentric-geometry';
import { resolveSurfaceGeometry } from './resolve-surface-geometry';
import { SURFACE_SHAPES } from '../design-tokens/shapes';
import type React from 'react';
import { forwardRef, memo } from 'react';
import type { ComponentRef } from 'react';
import { styled } from 'react-native-css';
import { Platform, StyleSheet, type View } from 'react-native';
import { StyledView } from '../styles/styled-primitives';
import { borderRadius } from '../styles/tokens';
import { SurfaceLevelProvider } from '../styles/surface-levels';
import { useResolvedSurface } from './use-resolved-surface';
import { SurfacePaint } from './SurfacePaint';
import { LensButtonHost, splitLensStyle } from '../floating/lens/lens-button-host';
import { LensMaterialProvider, useLensAvailable } from '../floating/lens/lens-material';
import type { SurfaceProps } from './types';
import type { MemoRefComponent } from '../styles/native-refs';

/** Layout-neutral container: callers supply their own padding and content. */
const SurfaceComponent = forwardRef<ComponentRef<typeof View>, SurfaceProps>(
  function SurfaceComponent(
    {
      children,
      fill,
      rim = true,
      sheen = true,
      material: materialProp = 'surface',
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

    const override = fill ?? resolvedStyle?.backgroundColor;
    const material = useResolvedSurface({
      fill: override === undefined ? undefined : String(override),
    });
    const lensAvailable = useLensAvailable();
    const lens = materialProp === 'lens' && lensAvailable;
    const split = lens ? splitLensStyle(style) : null;
    const surface = (
      <StyledView
        {...hostProps}
        ref={ref}
        className={className}
        accessibilityLabel={accessibilityLabel}
        testID={testID}
        style={[
          { position: 'relative' },
          split ? split.control : style,
          {
            backgroundColor: 'transparent',
            ...material.vars,
            ...geometry.style,
            ...concentric.variables,
          },
        ]}
      >
        {material.painted && !lens ? (
          <SurfacePaint
            rim={rim}
            sheen={sheen}
            fill={material.paintFill}
            radius={geometry.radius}
            shape={geometry.shape}
            geometryStyle={geometry.style}
          />
        ) : null}
        <SurfaceLevelProvider level={material.level} fill={material.publishedFill}>
          <ConcentricProvider value={concentric.context} variables={concentric.nativeVariables}>
            {children}
          </ConcentricProvider>
        </SurfaceLevelProvider>
      </StyledView>
    );
    if (!split) return surface;
    // The native lens is the material: it draws behind the content, and what it holds takes the
    // surface paint, so a lens is never drawn inside a lens.
    return (
      <LensButtonHost
        radius={typeof geometry.radius === 'number' ? geometry.radius : undefined}
        style={split.host}
      >
        <LensMaterialProvider value="surface">{surface}</LensMaterialProvider>
      </LensButtonHost>
    );
  },
);

// Only these two props participate in the interop map; traversing ViewProps'
// event/ref graph exceeds styled()'s dot-path union (TS2590). Runtime forwarding
// still belongs to the original component, including its host ref.
const NativeSurface = styled(
  SurfaceComponent as React.ComponentType<Pick<SurfaceProps, 'className' | 'style'>>,
  { className: 'style' },
) as typeof SurfaceComponent;
export const Surface: MemoRefComponent<SurfaceProps> = memo(
  Platform.OS === 'web' ? SurfaceComponent : NativeSurface,
);
Surface.displayName = 'Surface';
