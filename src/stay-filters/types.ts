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
  /** Slider granularity. Default `1`. */
  step?: number;
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
