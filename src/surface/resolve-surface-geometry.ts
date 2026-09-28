import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { surfaceStyle } from '../shapes/surface-style';
import type { CornerCurve, SurfaceShape } from '../shapes/corner-types';

/** Explicit axis > resolved caller style/class > family default, on both paint and host. */
export function resolveSurfaceGeometry(
  radius: ViewStyle['borderRadius'] | undefined,
  style: StyleProp<ViewStyle> | undefined,
  fallback: number,
  curve: CornerCurve,
) {
  const effectiveRadius = radius ?? StyleSheet.flatten(style)?.borderRadius ?? fallback;
  const shape: SurfaceShape = {
    ...(typeof effectiveRadius === 'number' ? { radius: effectiveRadius } : {}),
    curve: effectiveRadius === 9999 ? 'round' : curve,
  };
  return { radius: effectiveRadius, shape, style: { ...surfaceStyle(shape), borderRadius: effectiveRadius } };
}
