import type { BloomSize } from '../appearance';
import type { StyleProp, ViewStyle, TextStyle } from 'react-native';

import type { BloomAppearance, BloomTone } from '../appearance';

export type BadgeSize = BloomSize;
export type BadgePlacement = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

export interface BadgeProps {
  /** Text or number to display in the badge. */
  content?: string | number;
  /** How loudly the badge is painted. */
  appearance?: BloomAppearance;
  /** Semantic color. */
  tone?: BloomTone;
  /** Size preset. `md` is the counter size: 18 tall, 12/16 semibold. */
  size?: BadgeSize;
  /** If true, renders a dot without content — standalone, a status dot
   * (a solid centre on the tone's tint halo); attached, a plain marker. A dot always paints the
   * tone's fill, whatever the `appearance`. */
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
