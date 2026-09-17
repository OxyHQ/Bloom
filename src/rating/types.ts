import type { StyleProp, ViewStyle } from 'react-native';

/** `small` is body-2 text with a 14px star; `medium` (default) body text with a 16px star. */
export type RatingSize = 'small' | 'medium';

/** `parenthesis` draws "(128)"; `reviews` draws "· 128 reviews". */
export type RatingCountStyle = 'parenthesis' | 'reviews';

export interface RatingProps {
  /**
   * The rating on a 5 scale. A number is drawn with up to two decimals (4.9,
   * 4.92, 5.0); a string is drawn as given. `null`, `undefined` or `''` means
   * no rating yet, and `newLabel` is drawn instead.
   */
  value?: number | string | null;
  /** The number of reviews. A string is drawn as given ("1.2k"). */
  count?: number | string;
  /** Default `parenthesis`. */
  countStyle?: RatingCountStyle;
  /** The word after the count in the `reviews` style and in the accessible name. Default `"reviews"`. */
  reviewsLabel?: string;
  /** Drawn (and announced) when there is no rating yet. Default `"New"`. */
  newLabel?: string;
  /** Default `medium`. */
  size?: RatingSize;
  /**
   * Overrides the composed accessible name ("Rated 4.92 out of 5, 128
   * reviews"), which is English — pass a translated sentence here.
   */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface RatingBarProps {
  /** What the row measures ("Cleanliness", "5 stars"). Also the bar's accessible name. */
  label: string;
  /** Position on the scale, `0..max`; clamped. */
  value: number;
  /** The scale. Default `5`; pass `1` for a fraction. */
  max?: number;
  /** Text on the right ("4.9", "72%"). Omitted when not given. */
  display?: string;
  /**
   * A fixed label width. Without it the label takes the free space and the bar
   * is 96 wide (a category list); with it the bar takes the free space (a
   * distribution).
   */
  labelWidth?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
