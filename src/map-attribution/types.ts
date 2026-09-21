import type { StyleProp, ViewStyle } from 'react-native';

/**
 * One bar of the scale: how WIDE it is on screen, and what that width is worth.
 *
 * Both come from the app, because only the app knows its projection — the
 * width in pixels for a round number of metres at this latitude and zoom, and
 * the formatted words for that number. Bloom converts nothing and rounds
 * nothing: a scale bar that guessed its own units would be a measuring
 * instrument that measures the component rather than the map.
 */
export interface MapScale {
  /** The bar's drawn length, in pixels. */
  width: number;
  /** What that length is worth, pre-formatted — "500 m", "1000 ft". */
  label: string;
  /** Stable key. Defaults to the index. */
  id?: string;
}

/**
 * `island` floats the small print over tiles Bloom does not own and gives it
 * the one material priced for that. `inline` draws the words and nothing else,
 * for a strip that is already inside a surface the app painted.
 */
export type MapAttributionVariant = 'island' | 'inline';

export interface MapScaleBarProps {
  /**
   * One bar, or two — a metric bar and an imperial one, in that order. Two is
   * the case this takes a list for: they are the same measurement in two
   * vocabularies and must line up under each other rather than appear as two
   * separate instruments.
   */
  scales: readonly MapScale[];
  /** Default `island`. */
  variant?: MapAttributionVariant;
  /** The word before the readings in the announcement. Default `"Scale"`. */
  scaleLabel?: string;
  /** Defaults to `"Scale, 500 m, 1000 ft"`. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** Parts get `<testID>-bar-<n>`, `<testID>-rule-<n>`. */
  testID?: string;
}

export interface MapAttributionProps {
  /**
   * The credit the data's licence requires, as the licence words it. NOT
   * optional and NOT defaulted: a component that invented a default credit
   * would put a wrong attribution on a map, which is the one failure in this
   * family that is a legal problem rather than a visual one.
   */
  credit: string;
  /**
   * Opens the provider's own attribution page. With it the credit becomes a
   * link; without it, plain text.
   */
  onPressCredit?: () => void;
  /** The link's announced name. Defaults to `credit`. */
  creditLabel?: string;
  /** The scale bar, drawn before the credit. Without it none is drawn. */
  scales?: readonly MapScale[];
  /** The word before the readings in the scale's announcement. Default `"Scale"`. */
  scaleLabel?: string;
  /**
   * When the tiles were last refreshed, pre-formatted by the app — "Updated 12
   * March", "Updated 3 days ago". Never computed here: this component does not
   * read a clock.
   */
  updated?: string;
  /** Default `island`. */
  variant?: MapAttributionVariant;
  /** Names the strip. Default `"Map data"`. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** Parts get `<testID>-scale`, `-credit`, `-updated`. */
  testID?: string;
}
