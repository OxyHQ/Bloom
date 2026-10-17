import { Platform } from 'react-native';
import type { SurfaceShape, SurfaceStyle } from './corner-types';

function radius(value: number = 0): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError('A surface radius must be a finite, non-negative number.');
  }
  return value;
}

/**
 * Styles the existing layout node: no wrapper, measurement, effects or registry.
 * Radius describes the corner's extent; curve describes its platform-native shape.
 * Does not clip children or paint a background, border, shadow or focus indicator.
 */
export function surfaceStyle(shape: SurfaceShape, direction: 'ltr' | 'rtl' = 'ltr'): SurfaceStyle {
  const rtl = direction === 'rtl';
  const corners: SurfaceStyle =
    typeof shape.radius === 'number'
      ? { borderRadius: radius(shape.radius) }
      : shape.radius
        ? // RNW resolves RN logical radii using its own dir prop, not the document's
          // direction. Resolve once here so the same policy works on raw DOM and RNW.
          {
            borderTopLeftRadius: radius(rtl ? shape.radius.topEnd : shape.radius.topStart),
            borderTopRightRadius: radius(rtl ? shape.radius.topStart : shape.radius.topEnd),
            borderBottomLeftRadius: radius(rtl ? shape.radius.bottomEnd : shape.radius.bottomStart),
            borderBottomRightRadius: radius(
              rtl ? shape.radius.bottomStart : shape.radius.bottomEnd,
            ),
          }
        : {};
  const smooth = shape.curve === 'smooth';
  if (Platform.OS === 'web') return { ...corners, cornerShape: smooth ? 'squircle' : 'round' };
  if (Platform.OS === 'ios') return { ...corners, borderCurve: smooth ? 'continuous' : 'circular' };
  return corners;
}
