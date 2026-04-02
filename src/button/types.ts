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

  accessibilityLabel?: string;
  accessibilityHint?: string;
  hitSlop?: { top: number; bottom: number; left: number; right: number };
  activeOpacity?: number;
  testID?: string;
}
