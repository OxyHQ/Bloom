import {
  type StyleProp,
  type TextProps as RNTextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import type { TypeScaleVariant } from './scale';

export type TextProps = RNTextProps & {
  className?: string;
  /**
   * A step of the type ramp (`body-medium`, `title-2-semibold`,
   * `caption-1-medium`…) — size, line height, tracking and weight together.
   * Like every typography default it applies only when `className` is absent,
   * so a caller's `text-*` utility still wins.
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
