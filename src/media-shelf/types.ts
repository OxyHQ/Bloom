import type { ImageSourcePropType, StyleProp, ViewStyle } from 'react-native';

/**
 * `row` — one horizontally scrolling line of items (web: prev/next buttons in
 * the header, snapping, hidden scrollbar). `grid` — the items wrapped into
 * `rows` rows of as many columns as fit the container.
 */
export type ShelfLayout = 'row' | 'grid';

export interface ShelfProps {
  /** The section heading. Also names the region and the prev/next buttons. */
  title: string;
  /** A line under the title. */
  subtitle?: string;
  /** A small line above the title, e.g. "Made for". */
  eyebrow?: string;
  /** A 24px avatar before the eyebrow and title — who the section is for. URL, ImageResolver id or image source. */
  eyebrowAvatar?: string | ImageSourcePropType;
  /** Makes the title itself pressable (it opens the same page as "Show all"). */
  onTitlePress?: () => void;
  /** Shows the "Show all" button on the right of the header. */
  onShowAll?: () => void;
  /** Text of the "Show all" button. Default `"Show all"`. */
  showAllLabel?: string;
  /** Default `row`. */
  layout?: ShelfLayout;
  /**
   * Row: the width every item is laid out at (items keep their own width when
   * omitted). Grid: ignored — see `minItemWidth`.
   */
  itemWidth?: number;
  /** Grid: the narrowest a column may get before one fewer column is used. Default `160`. */
  minItemWidth?: number;
  /** Grid: how many rows are shown; later items are dropped. Default `1`. Pass `Infinity` to show all. */
  rows?: number;
  /** Space between items, both axes. Default `16` on web, `12` on native. */
  gap?: number;
  /**
   * Horizontal padding kept inside the scroll track (row) so the first item
   * lines up with the page gutter while the row still scrolls edge to edge.
   * Default `0`.
   */
  contentInset?: number;
  /** The title's heading level. Default `2`. */
  headingLevel?: number;
  /** Web: the prev/next buttons' names. Default `"Previous"` / `"Next"`, suffixed with the title. */
  previousLabel?: string;
  nextLabel?: string;
  /** The items — any tiles or cards. */
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface ShelfSkeletonProps {
  /** Default `row`. */
  layout?: ShelfLayout;
  /** Number of placeholder tiles. Default `6`. */
  count?: number;
  /** Tile width (row). Default `160`. */
  itemWidth?: number;
  /** Grid: narrowest column. Default `160`. */
  minItemWidth?: number;
  /** Draws a round cover (artists). Default `false`. */
  round?: boolean;
  /** Draws the eyebrow placeholder. Default `false`. */
  eyebrow?: boolean;
  /** Default `16` on web, `12` on native. */
  gap?: number;
  /** The region's name while loading. Default `"Loading"`. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface FilterChipOption {
  value: string;
  label: string;
}

export interface FilterChipsProps {
  options: readonly FilterChipOption[];
  /** The selected option's `value`. `undefined` selects nothing. */
  value?: string;
  /** Called with the pressed option's value, or `undefined` when `allowDeselect` clears it. */
  onValueChange: (value: string | undefined) => void;
  /** Pressing the selected chip clears the selection. Default `false`. */
  allowDeselect?: boolean;
  /** The group's name. Default `"Filters"`. */
  accessibilityLabel?: string;
  /** Horizontal padding inside the scroll track. Default `0`. */
  contentInset?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
