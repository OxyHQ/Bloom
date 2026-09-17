import type { ComponentType, ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { Props as SVGIconProps } from '../icons/shared';

/** A Bloom icon COMPONENT (`RiWifiLine`), sized and coloured by the chip that draws it. */
export type FilterIconComponent = ComponentType<SVGIconProps>;

export interface FilterSectionProps {
  /** The section heading ("Price range"), drawn `headline-semibold`. */
  title: ReactNode;
  /** A secondary line under the heading ("Nightly prices before fees"). */
  description?: ReactNode;
  children?: ReactNode;
  /** Draws a 1px hairline under the section. Default `true`; pass `false` on the last one. */
  divider?: boolean;
  /**
   * Names the section's `group`. Defaults to a string `title`; give one when the
   * title is a node.
   */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface PriceHistogramProps {
  /** Listing counts per price bucket, lowest price first. The buckets split `min`..`max` evenly. */
  buckets: number[];
  /** The price the first bucket starts at. */
  min: number;
  /** The price the last bucket ends at. */
  max: number;
  /** The selected range; a bucket whose midpoint falls inside it draws in the text colour. */
  value: [number, number];
  /** Height of the tallest bar, in px. Default `64`. */
  height?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** `PriceRangeFilter`'s slider scale. */
export type PriceScale = 'linear' | 'log';

export interface PriceRangeFilterProps {
  /** Listing counts per price bucket for the histogram. Omit (or pass `[]`) to draw no histogram. */
  buckets?: number[];
  /** Lowest selectable price. */
  min: number;
  /** Highest selectable price. */
  max: number;
  /** The selected `[low, high]` (controlled). */
  value: [number, number];
  /** Called with the next range from the slider, or from a field when it is committed. */
  onValueChange: (value: [number, number]) => void;
  /** Called once when a slider drag ends, or when a field is committed. */
  onValueCommit?: (value: [number, number]) => void;
  /**
   * Formats a price for the two fields at rest, e.g.
   * `(n) => \`$${n}\``. The component computes prices (bucket bounds, clamping,
   * snapping), so they arrive as numbers; the app owns currency and locale here.
   * Default `String(n)`.
   */
  formatPrice?: (price: number) => string;
  /**
   * Price granularity. Default `1`. On a `log` scale every value the slider
   * reports is snapped to it in price space — pass a round sale step (5,000).
   */
  step?: number;
  /**
   * How the slider spreads `min`..`max`. `linear` (default): equal distance is
   * an equal amount. `log`: equal distance is an equal RATIO, for sale prices
   * that span orders of magnitude; the histogram buckets then split the log
   * span evenly. See `PriceRangeFilter`.
   */
  scale?: PriceScale;
  /** Label of the lower field and the lower thumb's name. Default `"Minimum"`. */
  minLabel?: string;
  /** Label of the upper field and the upper thumb's name. Default `"Maximum"`. */
  maxLabel?: string;
  /** Names the slider. Default `"Price range"`. */
  accessibilityLabel?: string;
  /** Height of the tallest histogram bar. Default `64`. */
  histogramHeight?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Derives `-histogram`, `-slider`, `-min` and `-max`. */
  testID?: string;
}

export interface FilterOption<T extends string = string> {
  value: T;
  label: string;
}

export interface SegmentedFilterProps<T extends string = string> {
  /** The segments, in order ("Any type", "Room", "Entire home"). */
  options: FilterOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
  /** Names the radio group. Required: segments name themselves, not the choice. */
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface CountFilterProps {
  /** The row title ("Bedrooms"); also the radio group's name unless one is given. */
  title: ReactNode;
  /** The selected count, or `null` for "Any" (controlled). */
  value: number | null;
  onValueChange: (value: number | null) => void;
  /** The highest count; its chip reads `8+` and means "at least". Default `8`. */
  max?: number;
  /** The lowest count after "Any". Default `1`. */
  min?: number;
  /** Label of the no-preference chip. Default `"Any"`. */
  anyLabel?: string;
  /** Formats a count chip. Default: the number, with `+` on `max`. */
  formatCount?: (count: number, isMax: boolean) => string;
  /** Overrides the group's name; required when `title` is not a string. */
  accessibilityLabel?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Derives `-any` and `-<n>` per chip. */
  testID?: string;
}

export interface ToggleChipOption<T extends string = string> extends FilterOption<T> {
  /** An icon component drawn before the label. */
  icon?: FilterIconComponent;
  disabled?: boolean;
}

export interface ToggleChipGroupProps<T extends string = string> {
  options: ToggleChipOption<T>[];
  /** The selected values, in any order (controlled). */
  value: T[];
  /** Called with the next selection, kept in `options` order. */
  onValueChange: (value: T[]) => void;
  /** Names the group ("Amenities"). Required: each chip names only itself. */
  accessibilityLabel: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Derives `-<value>` per chip. */
  testID?: string;
}

export interface AmenityFilterProps<T extends string = string> extends ToggleChipGroupProps<T> {
  /** How many options show before "Show more". Default `6`; a list no longer than this has no link. */
  collapsedCount?: number;
  /** Default `"Show more"`. */
  showMoreLabel?: string;
  /** Default `"Show less"`. */
  showLessLabel?: string;
  /** Start expanded. Uncontrolled after mount. Default `false`. */
  defaultExpanded?: boolean;
}

export interface SwitchFilterRowProps {
  title: ReactNode;
  description?: ReactNode;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  /** Overrides the switch's name; defaults to a string `title`. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface FilterFooterProps {
  /** The apply button's label, pre-formatted by the app ("Show 1,000+ places"). */
  resultsLabel: string;
  onApply: () => void;
  onClear: () => void;
  /** Default `"Clear all"`. */
  clearLabel?: string;
  /** Disables "Clear all" — nothing is applied. */
  clearDisabled?: boolean;
  /** The result count is being fetched: the apply button shows `Button`'s loading state. */
  loading?: boolean;
  /** Disables the apply button. */
  applyDisabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Derives `-clear` and `-apply`. */
  testID?: string;
}

export interface FilterTriggerButtonProps {
  /** How many filters are applied; a badge shows while it is above `0`. */
  count?: number;
  onPress?: () => void;
  /** Default `"Filters"`. */
  label?: string;
  /**
   * The button's name. Default: `label`, plus `", 3 applied"` while `count > 0`
   * (the badge is a drawn number, so the name has to say it).
   */
  accessibilityLabel?: string;
  /** `Button` size. Default `medium`. */
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface AreaRangeFilterProps {
  /** Smallest selectable area. Default `0`. */
  min?: number;
  /** Largest selectable area. Default `500`. */
  max?: number;
  /** The selected `[low, high]`; `null` is open-ended ("no minimum") (controlled). */
  value: [number | null, number | null];
  /** Called with the next range when a field is committed, or as the slider moves. */
  onValueChange: (value: [number | null, number | null]) => void;
  /** Called once when a slider drag ends, or when a field is committed. */
  onValueCommit?: (value: [number | null, number | null]) => void;
  /** Granularity. Default `5`. */
  step?: number;
  /** Draws a `RangeSlider` above the fields. Default `false`. */
  slider?: boolean;
  /** Formats an area for the fields at rest. Default `` (n) => `${n} m²` ``. */
  formatArea?: (area: number) => string;
  /** Default `"Minimum"`. */
  minLabel?: string;
  /** Default `"Maximum"`. */
  maxLabel?: string;
  /** Names the group and the slider. Default `"Area"`. */
  accessibilityLabel?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Derives `-slider`, `-min` and `-max`. */
  testID?: string;
}

/** The built-in property types. Any string works as a custom one. */
export type PropertyType =
  | 'apartment'
  | 'house'
  | 'room'
  | 'studio'
  | 'duplex'
  | 'coliving'
  | 'hostel'
  | 'other';

export interface PropertyTypeOption<T extends string = PropertyType> {
  value: T;
  label: string;
  icon: FilterIconComponent;
}

export interface PropertyTypeTilesProps<T extends string = PropertyType> {
  /** The selected types (controlled). Empty means any type. */
  value: T[];
  /** Called with the next selection, kept in `options` order. */
  onValueChange: (value: T[]) => void;
  /** The tiles, in order. Default the eight built-in types. */
  options?: readonly PropertyTypeOption<T>[];
  /** Override the built-in labels by value. */
  labels?: Partial<Record<T, string>>;
  /**
   * Tiles per row. Default: as many as fit (at least 2, at most 4) at the
   * tile's minimum width.
   */
  columns?: number;
  /** Names the group. Default `"Property type"`. */
  accessibilityLabel?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Derives `-<value>` per tile. */
  testID?: string;
}

export type PropertyTypeFilterProps<T extends string = PropertyType> = PropertyTypeTilesProps<T>;

/** The built-in housing features. */
export type HousingFeature =
  | 'elevator'
  | 'parking'
  | 'terrace'
  | 'garden'
  | 'pool'
  | 'furnished'
  | 'pets'
  | 'airConditioning'
  | 'heating'
  | 'accessible'
  | 'storage';

export interface FeatureFilterProps<T extends string = HousingFeature>
  extends Omit<ToggleChipGroupProps<T>, 'options' | 'accessibilityLabel'> {
  /** The features, in order. Default the eleven built-in ones, with icons. */
  options?: ToggleChipOption<T>[];
  /** Override built-in labels by value. */
  labels?: Partial<Record<T, string>>;
  /** `chips` (default): filter pills with icons. `checkboxes`: a two-column list of `Checkbox`es. */
  variant?: 'chips' | 'checkboxes';
  /** Names the group. Default `"Features"`. */
  accessibilityLabel?: string;
}

/** An EU-style energy rating, A (best) to G (worst). */
export type EnergyRating = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';

export interface EnergyRatingFilterProps {
  /**
   * The WORST rating accepted, or `null` for any rating (controlled). `'C'`
   * means "C and better": A, B and C match.
   */
  value: EnergyRating | null;
  /** Pressing the selected letter again clears it (`null`). */
  onValueChange: (value: EnergyRating | null) => void;
  /** Formats the line under the letters. Default `"C and better"`, `"A only"`, `"Any rating"`. */
  formatSummary?: (value: EnergyRating | null) => string;
  /** Names the radio group. Default `"Energy rating"`. */
  accessibilityLabel?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Derives `-<letter>` per pill and `-summary`. */
  testID?: string;
}

export interface AvailabilityFilterProps {
  /** Only places free to move into today. */
  availableNow: boolean;
  onAvailableNowChange: (value: boolean) => void;
  /** Available from this day at the latest; ignored (and the picker disabled) while `availableNow`. */
  date: Date | null;
  onDateChange: (date: Date | null) => void;
  /** Default `"Available now"`. */
  availableNowLabel?: string;
  /** Default `"Ready to move in today"`. */
  availableNowDescription?: string;
  /** The date row's title. Default `"Available from"`. */
  dateLabel?: string;
  /** The picker trigger with no day chosen. Default `"Any date"`. */
  datePlaceholder?: string;
  /** Days before this can not be picked. */
  minDate?: Date | null;
  /** BCP 47 locale for the picker. */
  locale?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Derives `-now` and `-date`. */
  testID?: string;
}

/** The built-in floor choices. */
export type FloorOption = 'ground' | 'middle' | 'top' | 'elevator';

export interface FloorFilterProps<T extends string = FloorOption>
  extends Omit<ToggleChipGroupProps<T>, 'options' | 'accessibilityLabel'> {
  /** Default Ground, Middle, Top, With elevator. */
  options?: ToggleChipOption<T>[];
  /** Override built-in labels by value. */
  labels?: Partial<Record<T, string>>;
  /** Names the group. Default `"Floor"`. */
  accessibilityLabel?: string;
}
