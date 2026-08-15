import type { StyleProp, ViewStyle } from 'react-native';

export interface AspectRatioProps {
  /**
   * Width divided by height — `16 / 9`, `1`, `4 / 3`. Defaults to `1`.
   *
   * shadcn's web `AspectRatio` takes the same number for the same reason: a
   * ratio is arithmetic the call site already has, and naming presets instead
   * (`'video'`, `'square'`) would need a new name for every ratio anyone wants.
   */
  ratio?: number;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
