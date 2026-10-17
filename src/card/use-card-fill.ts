import { resolveSurfaceMaterial } from '../surface/resolve-surface-material';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useSurfaceLayer } from '../surface/use-surface-layer';

/** Neutral card backing for content palettes resolved before entering the Card. */
export function useCardFill(style?: StyleProp<ViewStyle>): string {
  const layer = useSurfaceLayer();
  return resolveCardFill(layer, style);
}

/** Canonical neutral card material, including its tint/composite. */
export function resolveCardFill(
  layer: ReturnType<typeof useSurfaceLayer>,
  style?: StyleProp<ViewStyle>,
): string {
  return resolveSurfaceMaterial({
    fill: String(StyleSheet.flatten(style)?.backgroundColor ?? layer.fill),
    parentFill: layer.parentFill,
  }).publishedFill;
}
