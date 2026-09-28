import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useSurfaceLayer } from '../surface/use-surface-layer';
import { resolveSurfaceFill } from '../surface/shared';

/** Neutral card backing for content palettes resolved before entering the Card. */
export function useCardFill(style?: StyleProp<ViewStyle>): string {
  const layer = useSurfaceLayer();
  return resolveSurfaceFill(String(StyleSheet.flatten(style)?.backgroundColor ?? layer.fill), false, layer.parentFill);
}
