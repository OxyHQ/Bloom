import { type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

export interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  /** Scale applied while pressed. Defaults to `0.98`. */
  targetScale?: number;
  /**
   * Utility classes for the pressable itself — the node that scales, so a
   * layout class and the transform cannot land on different boxes.
   */
  className?: string;
  /** Style applied to the pressable itself — the node that scales. */
  style?: StyleProp<ViewStyle>;
}
