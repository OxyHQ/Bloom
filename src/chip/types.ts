import type { StyleProp, ViewStyle, TextStyle } from 'react-native';

export type ChipVariant = 'solid' | 'outlined' | 'soft';
export type ChipColor = 'default' | 'primary' | 'success' | 'warning' | 'error';
export type ChipSize = 'small' | 'medium' | 'large';

export interface ChipProps {
  /** Text content of the chip. */
  children?: React.ReactNode;
  /** Visual variant. */
  variant?: ChipVariant;
  /** Semantic color. */
  color?: ChipColor;
  /** Size preset. */
  size?: ChipSize;
  /** Icon rendered before the label. */
  startIcon?: React.ReactNode;
  /** Icon or close button rendered after the label. */
  endIcon?: React.ReactNode;
  /** Called when the chip is pressed. Makes the chip interactive. */
  onPress?: () => void;
  /** Called when the close/end icon is pressed. */
  onClose?: () => void;
  /** Whether the chip is in a selected state. */
  selected?: boolean;
  /** Whether the chip is disabled. */
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
  testID?: string;
}
