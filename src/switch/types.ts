import type { StyleProp, ViewStyle } from 'react-native';

export interface SwitchProps {
  /** Current on/off state */
  value: boolean;
  /** Called when the user toggles the switch */
  onValueChange: (value: boolean) => void;
  /** Whether the switch is disabled */
  disabled?: boolean;
  /** Container style */
  style?: StyleProp<ViewStyle>;
  /** Size variant */
  size?: 'default' | 'sm';
  testID?: string;
}
