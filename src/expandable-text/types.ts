import type { StyleProp, TextStyle, ViewStyle } from 'react-native';

import type { TypeScaleVariant } from '../typography/scale';

/**
 * - `below` a "Show more" / "Show less" link under the text (a review, a bio).
 * - `inline` a "more" at the end of the last visible line, over the text's
 *   fade, that opens the rest for good (a product's description).
 */
export type ExpandableTextToggle = 'below' | 'inline';

export interface ExpandableTextProps {
  /** The text. */
  children: string;
  /** Lines shown while collapsed. Default `3`. `0` never clamps. */
  numberOfLines?: number;
  /** Default `below`. */
  toggle?: ExpandableTextToggle;
  /** The type-ramp step. Default `body-regular`. */
  variant?: TypeScaleVariant;
  /** The text's colour. Default text-primary. */
  color?: string;
  /** Controlled expansion. */
  expanded?: boolean;
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  /** The expand control's text. Default "Show more" (`below`) or "More" (`inline`). */
  moreLabel?: string;
  /** `below`: the collapse control's text. Default "Show less". */
  lessLabel?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  /** On the text. */
  testID?: string;
  /** On the toggle. Default `${testID}-toggle`. */
  toggleTestID?: string;
}
