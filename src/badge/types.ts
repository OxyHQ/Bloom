import type { StyleProp, ViewStyle, TextStyle } from 'react-native';

import type { AccentFill, AccentTone } from '../theme/accent-colors';

export type BadgeSize = 'small' | 'medium' | 'large';
export type BadgePlacement = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

export interface BadgeProps {
  /** Text or number to display in the badge. */
  content?: string | number;
  /** How loudly the badge is painted. */
  variant?: AccentFill;
  /** Semantic color. */
  color?: AccentTone;
  /** Size preset. `medium` is the counter size: 18 tall, 12/16 semibold. */
  size?: BadgeSize;
  /** If true, renders a dot without content — standalone, a status dot
   * (a solid centre on the tone's tint halo); attached, a plain marker. A dot always paints the
   * tone's fill, whatever the `variant`. */
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
