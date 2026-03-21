import type { StyleProp, ViewStyle, TextStyle } from 'react-native';

export type CheckboxSize = 'small' | 'medium' | 'large';

export interface CheckboxProps {
  /** Whether the checkbox is checked. */
  checked: boolean;
  /** Called when the checked state changes. */
  onCheckedChange: (checked: boolean) => void;
  /** Optional label text. */
  label?: string;
  /** Optional description shown below the label. */
  description?: string;
  /** Size preset. */
  size?: CheckboxSize;
  /** Whether the checkbox is disabled. */
  disabled?: boolean;
  /** Whether the checkbox is in an indeterminate state. */
  indeterminate?: boolean;
  /** Semantic color when checked. Uses theme primary by default. */
  color?: string;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
  testID?: string;
}
