import { ConcentricProvider } from '../concentric/ConcentricProvider';
import { useConcentricGeometry } from '../concentric/use-concentric-geometry';
import { resolveSurfaceGeometry } from './resolve-surface-geometry';
import { SURFACE_SHAPES } from '../design-tokens/shapes';
import { forwardRef, memo } from 'react';
import type { ComponentRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { borderRadius } from '../styles/tokens';
import { SurfaceLevelProvider } from '../styles/surface-levels';
import { useResolvedSurface } from './use-resolved-surface';
import { SurfacePaint } from './SurfacePaint';
import { useLensFrame, withLens } from '../floating/lens/lens-frame';
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
      // The web's backdrop frost: native draws no backdrop filter.
      frost: _frost,
      material: materialProp = 'surface',
      radius,
      cornerCurve = SURFACE_SHAPES.panel.curve,
      style,
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
      radius:
        radius === 'concentric'
          ? 'concentric'
          : typeof baseGeometry.radius === 'number'
            ? baseGeometry.radius
            : undefined,
      style: resolvedStyle ?? undefined,
    });
    const geometry =
      radius === 'concentric'
        ? {
            radius: undefined,
            shape: {
              radius: concentric.radii,
              curve: 'round' as const,
            },
            style: concentric.radiusStyle,
          }
        : baseGeometry;

    const override = fill ?? resolvedStyle?.backgroundColor;
    const material = useResolvedSurface({
      fill: override === undefined ? undefined : String(override),
    });
    // On the lens (`material="lens"` where the device has it) the native lens is the material: it
    // draws behind the content. In the page's content it is drawn in its place, so it scrolls and
    // clips with the page; drawn by the window, a feed's compose prompt slid over the header and the
    // status bar as the feed scrolled (Mention's Home, Pixel 8a).
    const frame = useLensFrame(materialProp === 'lens', style);
    const surface = (
      <View
        {...hostProps}
        ref={ref}
        accessibilityLabel={accessibilityLabel}
        testID={testID}
        style={[
          { position: 'relative' },
          frame.style,
          {
            backgroundColor: 'transparent',
            ...material.vars,
            ...geometry.style,
            ...concentric.variables,
          },
        ]}
      >
        {material.painted && !frame.lens ? (
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
          <ConcentricProvider value={concentric.context}>{children}</ConcentricProvider>
        </SurfaceLevelProvider>
      </View>
    );
    return withLens(frame, surface, {
      radius: typeof geometry.radius === 'number' ? geometry.radius : undefined,
    });
  },
);

export const Surface: MemoRefComponent<SurfaceProps> = memo(SurfaceComponent);
Surface.displayName = 'Surface';
