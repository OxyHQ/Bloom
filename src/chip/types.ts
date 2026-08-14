import type { StyleProp, ViewStyle, TextStyle } from 'react-native';

import type { AccentFill, AccentTone } from '../theme/accent-colors';

export type ChipSize = 'small' | 'medium' | 'large';

export interface ChipProps {
  /** Text content of the chip. */
  children?: React.ReactNode;
  /**
   * How loudly the chip is painted. `subtle` used to be spelled `soft` here and
   * `subtle` on `Badge` — one concept, two names, resolved by the shared
   * {@link AccentFill}.
   */
  variant?: AccentFill;
  /** Semantic color. */
  color?: AccentTone;
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
