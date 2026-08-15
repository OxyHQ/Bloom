import {
  type StyleProp,
  type TextProps as RNTextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

export type TextProps = RNTextProps & {
  className?: string;
};

export interface BlockquoteProps {
  children?: React.ReactNode;
  /** The container — the left rule and its indent. */
  style?: StyleProp<ViewStyle>;
  /** The quotation itself. */
  textStyle?: StyleProp<TextStyle>;
  testID?: string;
}
