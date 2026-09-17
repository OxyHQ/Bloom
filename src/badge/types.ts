import type { ComponentType } from 'react';
import type { StyleProp, ViewStyle, TextStyle } from 'react-native';

import type { AccentFill, AccentTone } from '../theme/accent-colors';

/**
 * The counter rungs (`small`/`medium`/`large`, sized to a digit) and the label
 * rungs (`label-small`/`label-medium`, 20 and 24 tall, sized to a word and
 * carrying an optional leading icon). `shared.ts` has the table and why the two
 * families differ in more than height.
 */
export type BadgeSize = 'small' | 'medium' | 'large' | 'label-small' | 'label-medium';

/**
 * The three accent fills, plus `onMedia`: a light pill with a shadow that reads
 * over a photograph, identical in both modes. `onMedia` ignores `color`.
 */
export type BadgeVariant = AccentFill | 'onMedia';

/** An icon component the badge draws at its own rung's size and label colour. */
export type BadgeIcon = ComponentType<{ width?: number; height?: number; fill?: string }>;

export type BadgePlacement = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

export interface BadgeProps {
  /** Text or number to display in the badge. */
  content?: string | number;
  /** How loudly the badge is painted. */
  variant?: BadgeVariant;
  /** Semantic color. Ignored by `onMedia`, which is a fixed neutral pill. */
  color?: AccentTone;
  /** Size preset. `medium` is the counter size: 18 tall, 12/16 semibold. */
  size?: BadgeSize;
  /**
   * An icon before the label, drawn at the rung's icon size in the label's own
   * colour and hidden from assistive technology — the badge reads as its text.
   * Its testID is `<testID>-icon`.
   */
  icon?: BadgeIcon;
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
