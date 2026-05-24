import type { StyleProp, ViewStyle, TextStyle } from 'react-native';

export type ButtonVariant = 'primary' | 'secondary' | 'inverse' | 'icon' | 'ghost' | 'text';

export type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps {
  onPress?: () => void;
  children?: React.ReactNode;
  disabled?: boolean;

  variant?: ButtonVariant;
  size?: ButtonSize;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;

  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';

  /**
   * When true, displays a centered loading spinner overlay and prevents
   * presses. Children remain in the layout (but visually hidden) so the
   * button preserves its width. Use this for async actions like submit.
   */
  loading?: boolean;
  /**
   * Optional color override for the loading spinner. Defaults to the
   * resolved button text color.
   */
  loadingColor?: string;

  accessibilityLabel?: string;
  accessibilityHint?: string;
  hitSlop?: { top: number; bottom: number; left: number; right: number };
  activeOpacity?: number;
  testID?: string;
  className?: string;
}
