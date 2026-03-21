import type { StyleProp, ViewStyle, TextStyle } from 'react-native';

export type BadgeVariant = 'solid' | 'subtle' | 'outlined';
export type BadgeColor = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
export type BadgeSize = 'small' | 'medium' | 'large';
export type BadgePlacement = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

export interface BadgeProps {
  /** Text or number to display in the badge. */
  content?: string | number;
  /** Visual variant. */
  variant?: BadgeVariant;
  /** Semantic color. */
  color?: BadgeColor;
  /** Size preset. */
  size?: BadgeSize;
  /** If true, renders as a small dot without content. */
  dot?: boolean;
  /** Maximum number to display. Values above this show "{max}+". */
  max?: number;
  /** If true, the badge is hidden. */
  invisible?: boolean;
  /** Where to position the badge relative to its child. */
  placement?: BadgePlacement;
  /** The element the badge is attached to. */
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  testID?: string;
}
