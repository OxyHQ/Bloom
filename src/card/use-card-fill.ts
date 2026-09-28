import { resolveSurfaceMaterial } from '../surface/resolve-surface-material';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useSurfaceLayer } from '../surface/use-surface-layer';

/** Neutral card backing for content palettes resolved before entering the Card. */
export function useCardFill(style?: StyleProp<ViewStyle>): string {
  const layer = useSurfaceLayer();
  return resolveSurfaceMaterial({ fill: String(StyleSheet.flatten(style)?.backgroundColor ?? layer.fill), parentFill: layer.parentFill }).publishedFill;
}
