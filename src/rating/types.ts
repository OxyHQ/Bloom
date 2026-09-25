import type { StyleProp, ViewStyle } from 'react-native';

/** `small` is body-2 text with a 14px star; `medium` (default) body text with a 16px star. */
export type RatingSize = 'small' | 'medium';

/** `parenthesis` draws "(128)"; `reviews` draws "· 128 reviews". */
export type RatingCountStyle = 'parenthesis' | 'reviews';

/**
 * `compact` (default) is one star and the value; `stars` a full row of `max`
 * stars (five) filled to the value — fractionally, so 4.3 fills the fifth star
 * 30% — before the value.
 */
export type RatingVariant = 'compact' | 'stars';

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
  /** Default `compact` — one star. `stars` draws a row of five, filled fractionally. */
  variant?: RatingVariant;
  /**
   * Paints the star(s) and the value — and the count, unless `countColor` is
   * given — e.g. white over a brand-coloured hero, where text-primary and
   * text-secondary are illegible. Default: text-primary (count text-secondary).
   */
  color?: string;
  /** The filled star(s) alone, e.g. a gold star beside neutral text. Default `color`. */
  starColor?: string;
  /** The count alone. Default `color` when given, else text-secondary. */
  countColor?: string;
  /** `stars` variant: the unfilled part of each star. Default the theme's border colour. */
  emptyStarColor?: string;
  /**
   * Overrides the composed accessible name ("Rated 4.92 out of 5, 128
   * reviews"), which is English — pass a translated sentence here.
   */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** `small` is a 24px star, `medium` (default) 32, `large` 40. */
export type RatingInputSize = 'small' | 'medium' | 'large';

export interface RatingInputProps {
  /**
   * The chosen rating, `1..max`, or `null` while nothing is chosen. Fully
   * controlled — the component keeps no value of its own.
   */
  value: number | null;
  /** Called with the chosen rating. Never called with the value already chosen. */
  onChange: (value: number) => void;
  /** How many stars. Default `5`. */
  max?: number;
  /** Default `medium`. */
  size?: RatingInputSize;
  /** Disables the whole group: no press, no keyboard, dimmed. */
  disabled?: boolean;
  /**
   * The NAME of what is being rated ("Overall rating", "Cleanliness").
   *
   * The group draws nothing but stars, so this or an enclosing `Field`'s label
   * is the only thing that can tell a screen reader which of several ratings
   * this one is. With neither it warns once in development
   * (`hooks/use-accessible-name-warning.ts`).
   */
  accessibilityLabel?: string;
  /**
   * Each star's own name, which is English by default (`"1 star"`,
   * `"4 stars"`). Pass a translated formatter.
   */
  formatStarLabel?: (value: number, max: number) => string;
  style?: StyleProp<ViewStyle>;
  /** Derives `-star-<n>` for each star. */
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
