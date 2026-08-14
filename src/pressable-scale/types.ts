import { type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

export interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  /** Scale applied while pressed. Defaults to `0.98`. */
  targetScale?: number;
  /** Style applied to the pressable itself — the node that scales. */
  style?: StyleProp<ViewStyle>;
}
