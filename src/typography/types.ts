import type { StyleProp, TextProps as RNTextProps, TextStyle, ViewStyle } from 'react-native';

import type { TypeScaleVariant } from './scale';

export type TextProps = RNTextProps & {
  /**
   * A step of the type ramp (`body-medium`, `title-2-semibold`,
   * `caption-1-medium`…) — size, line height, tracking and weight together.
   * A caller's `style` still wins over it.
   */
  variant?: TypeScaleVariant;
};

export interface BlockquoteProps {
  children?: React.ReactNode;
  /** The container — the left rule and its indent. */
  style?: StyleProp<ViewStyle>;
  /** The quotation itself. */
  textStyle?: StyleProp<TextStyle>;
  testID?: string;
}
