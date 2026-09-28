import { StyleSheet, type ColorValue, type StyleProp, type ViewStyle } from 'react-native';
import { useSurfaceFill, useSurfaceLevelValue, surfaceFillVars } from '../styles/surface-levels';
import { parseRgba } from '../theme/color-utils';
import { resolveSurfaceFill } from './shared';

/** Docked chrome publishes its backing without adding depth or material. */
export function useSurfaceBacking(defaultFill: ColorValue | undefined, style?: StyleProp<ViewStyle>, known = true) {
  const parentFill = useSurfaceFill();
  const level = useSurfaceLevelValue();
  const background = known ? StyleSheet.flatten(style)?.backgroundColor ?? defaultFill : undefined;
  const painted = typeof background === 'string' && background !== 'transparent' && parseRgba(background)?.a !== 0;
  const fill = painted ? resolveSurfaceFill(background, false, parentFill) : parentFill;
  return { fill, level, vars: surfaceFillVars(painted ? fill : undefined) };
}
