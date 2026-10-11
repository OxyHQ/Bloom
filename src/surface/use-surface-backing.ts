import { StyleSheet, type ColorValue, type StyleProp, type ViewStyle } from 'react-native';
import { useSurfaceFill, useSurfaceLevelValue } from '../styles/surface-levels';
import { resolveSurfaceMaterial } from './resolve-surface-material';

/** Docked chrome publishes its backing without adding depth or material. */
export function useSurfaceBacking(
  defaultFill: ColorValue | undefined,
  style?: StyleProp<ViewStyle>,
  known = true,
) {
  const parentFill = useSurfaceFill();
  const level = useSurfaceLevelValue();
  const background = known
    ? (StyleSheet.flatten(style)?.backgroundColor ?? defaultFill)
    : undefined;
  const material = resolveSurfaceMaterial({
    fill: typeof background === 'string' ? background : 'transparent',
    parentFill,
    parentLevel: level,
    paint: false,
  });
  return { fill: material.publishedFill, level: material.level, vars: material.vars };
}
