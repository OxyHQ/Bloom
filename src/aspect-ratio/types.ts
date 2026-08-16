import type { StyleProp, ViewStyle } from 'react-native';

export interface AspectRatioProps {
  /**
   * Width divided by height — `16 / 9`, `1`, `4 / 3`. Defaults to `1`.
   *
   * shadcn's web `AspectRatio` takes the same number for the same reason: a
   * ratio is arithmetic the call site already has, and naming presets instead
   * (`'video'`, `'square'`) would need a new name for every ratio anyone wants.
   *
   * Any value that is not a positive finite number takes the default too — `0`,
   * `NaN`, `Infinity` and negatives all come out of `w / h` on an image that has
   * not loaded, and none of them names a box.
   */
  ratio?: number;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
