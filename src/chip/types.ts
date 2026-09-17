import type { StyleProp, ViewStyle, TextStyle } from 'react-native';

import type { AccentFill, AccentTone } from '../theme/accent-colors';

export type ChipSize = 'small' | 'medium' | 'large';

/**
 * Data hues: a category, a department, an objective — colours that carry
 * data rather than a status role.
 */
export type ChipHue = 'lime' | 'rose' | 'yellow' | 'cyan' | 'blue' | 'purple' | 'neutral' | 'gray' | 'soft';

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
  /**
   * Paints the chip in one of the data hues instead of `color` +
   * `variant` (both are ignored while it is set; `selected` still promotes the
   * chip to the brand tone). Pair it with a size for the right emphasis:
   * `bold` is `medium`, `subtle` is `large`, `caption` is `small`.
   */
  hue?: ChipHue;
  /**
   * The colour the chip sits on. A hue's dark fill is translucent,
   * so it is mixed over this. Defaults to the page background.
   */
  surface?: string;
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
