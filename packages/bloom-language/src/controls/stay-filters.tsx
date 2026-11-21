import {
  AmenityFilter as BloomAmenityFilter,
  type AmenityFilterProps,
  AreaRangeFilter as BloomAreaRangeFilter,
  type AreaRangeFilterProps,
  AvailabilityFilter as BloomAvailabilityFilter,
  type AvailabilityFilterProps,
  CountFilter as BloomCountFilter,
  type CountFilterProps,
  FeatureFilter as BloomFeatureFilter,
  type FeatureFilterProps,
  FilterFooter as BloomFilterFooter,
  type FilterFooterProps,
  FilterSection as BloomFilterSection,
  type FilterSectionProps,
  FilterTriggerButton as BloomFilterTriggerButton,
  type FilterTriggerButtonProps,
  FloorFilter as BloomFloorFilter,
  type FloorFilterProps,
  PriceRangeFilter as BloomPriceRangeFilter,
  type PriceRangeFilterProps,
  SwitchFilterRow as BloomSwitchFilterRow,
  type SwitchFilterRowProps,
  ToggleChipGroup as BloomToggleChipGroup,
  type ToggleChipGroupProps,
  type ToggleChipOption,
} from '@oxy.so/bloom/stay-filters';

import type { Binding } from '../binding';
import { type Child, Node, type ViewModifiers } from '../node';
import type { FeatureFilterStyle, FilterTriggerSize, PriceScale, SpaceToken } from '../tokens';
import type { ControlRenderer } from './draw';
import { product } from './product';

/** A stay search's filters: their sections, ranges, counts, chips and footer. */
export type StayFilterKind =
  | 'filterSection'
  | 'priceRangeFilter'
  | 'countFilter'
  | 'toggleChipGroup'
  | 'amenityFilter'
  | 'switchFilterRow'
  | 'filterFooter'
  | 'filterTriggerButton'
  | 'areaRangeFilter'
  | 'availabilityFilter'
  | 'featureFilter'
  | 'floorFilter';

type Drawn = 'style' | 'testID' | 'accessibilityLabel' | 'disabled';
type Edited = 'value' | 'onValueChange';
/** A filter of chips: its choices are Bloom's `options`, which the language names `choices`. */
type Choices<P extends { options?: unknown }> = Omit<P, 'options'> & {
  readonly choices?: P['options'];
};

export type FilterSectionOptions = Omit<
  FilterSectionProps,
  Drawn | 'title' | 'description' | 'children' | 'divider'
> & { readonly description?: string };
export type PriceRangeFilterOptions = Omit<
  PriceRangeFilterProps,
  Drawn | Edited | 'scale' | 'histogramHeight'
> & { readonly histogramHeight?: SpaceToken };
export type CountFilterOptions = Omit<CountFilterProps, Drawn | Edited | 'title'>;
export type ToggleChipGroupOptions = Omit<ToggleChipGroupProps, Drawn | Edited | 'options'>;
export type AmenityFilterOptions = Omit<AmenityFilterProps, Drawn | Edited | 'options'>;
export type SwitchFilterRowOptions = Omit<
  SwitchFilterRowProps,
  Drawn | Edited | 'title' | 'description'
> & { readonly description?: string };
export type FilterFooterOptions = Omit<FilterFooterProps, Drawn | 'resultsLabel' | 'loading'>;
export type FilterTriggerButtonOptions = Omit<
  FilterTriggerButtonProps,
  Drawn | 'count' | 'onPress' | 'size'
>;
export type AreaRangeFilterOptions = Omit<AreaRangeFilterProps, Drawn | Edited>;
export type AvailabilityFilterOptions = Omit<
  AvailabilityFilterProps,
  Drawn | 'availableNow' | 'onAvailableNowChange' | 'date' | 'onDateChange'
>;
export type FeatureFilterOptions = Choices<
  Omit<FeatureFilterProps<string>, Drawn | Edited | 'variant'>
>;
export type FloorFilterOptions = Choices<Omit<FloorFilterProps<string>, Drawn | Edited>>;

/** Bloom `FilterSection`: a heading over its controls, a hairline under it. */
export interface FilterSectionView extends ViewModifiers<FilterSectionView> {
  /** `false` draws no hairline under the section (the last one). */
  dividers(value?: boolean): FilterSectionView;
}
/** Bloom `PriceRangeFilter`: a price histogram over a range slider and two fields. */
export interface PriceRangeFilterView extends ViewModifiers<PriceRangeFilterView> {
  /** How the slider spreads its prices: `linear` (default) or `log`. */
  style(value: PriceScale): PriceRangeFilterView;
  disabled(value?: boolean): PriceRangeFilterView;
}
export interface CountFilterView extends ViewModifiers<CountFilterView> {
  disabled(value?: boolean): CountFilterView;
}
/** Bloom `ToggleChipGroup`; name it with `.label()` (each chip names only itself). */
export interface ToggleChipGroupView extends ViewModifiers<ToggleChipGroupView> {
  disabled(value?: boolean): ToggleChipGroupView;
}
/** Bloom `AmenityFilter`; name it with `.label()`. */
export interface AmenityFilterView extends ViewModifiers<AmenityFilterView> {
  disabled(value?: boolean): AmenityFilterView;
}
export interface SwitchFilterRowView extends ViewModifiers<SwitchFilterRowView> {
  disabled(value?: boolean): SwitchFilterRowView;
}
export interface FilterFooterView extends ViewModifiers<FilterFooterView> {
  /** The result count is being fetched: the apply button's loading state. */
  loading(value?: boolean): FilterFooterView;
}
/** Bloom `FilterTriggerButton`; `.onPress()` opens the filters. */
export interface FilterTriggerButtonView extends ViewModifiers<FilterTriggerButtonView> {
  /** `sm`, `md` (default) or `lg`. */
  size(value: FilterTriggerSize): FilterTriggerButtonView;
  disabled(value?: boolean): FilterTriggerButtonView;
}
export interface AreaRangeFilterView extends ViewModifiers<AreaRangeFilterView> {
  disabled(value?: boolean): AreaRangeFilterView;
}
export interface AvailabilityFilterView extends ViewModifiers<AvailabilityFilterView> {
  disabled(value?: boolean): AvailabilityFilterView;
}
export interface FeatureFilterView extends ViewModifiers<FeatureFilterView> {
  /** `chips` (default): pills with icons; `checkboxes`: a two-column list. */
  style(value: FeatureFilterStyle): FeatureFilterView;
  disabled(value?: boolean): FeatureFilterView;
}
export interface FloorFilterView extends ViewModifiers<FloorFilterView> {
  disabled(value?: boolean): FloorFilterView;
}

/** A chip filter's options as Bloom takes them: its `choices` are Bloom's `options`. */
function chips<O extends { readonly choices?: unknown }>({ choices, ...options }: O) {
  return { ...options, options: choices };
}

/** Bloom `FilterSection` titled `title`, its controls the content. */
export function FilterSection(
  title: string,
  content: Child,
  options: FilterSectionOptions = {},
): FilterSectionView {
  return new Node('filterSection', { title, options }, [content]);
}
/** Bloom `PriceRangeFilter`, its range the binding holds. */
export function PriceRangeFilter(
  range: Binding<[number, number]>,
  options: PriceRangeFilterOptions,
): PriceRangeFilterView {
  return new Node('priceRangeFilter', { binding: range, options }, []);
}
/** Bloom `CountFilter` titled `title`, its count (`null` for any) the binding holds. */
export function CountFilter(
  title: string,
  count: Binding<number | null>,
  options: CountFilterOptions = {},
): CountFilterView {
  return new Node('countFilter', { title, binding: count, options }, []);
}
/** Bloom `ToggleChipGroup` of `choices`, the chosen values the binding holds. */
export function ToggleChipGroup(
  choices: readonly ToggleChipOption[],
  selection: Binding<string[]>,
  options: ToggleChipGroupOptions = {},
): ToggleChipGroupView {
  return new Node(
    'toggleChipGroup',
    { binding: selection, options: { ...options, options: choices } },
    [],
  );
}
/** Bloom `AmenityFilter` of `choices`, folded after its first few. */
export function AmenityFilter(
  choices: readonly ToggleChipOption[],
  selection: Binding<string[]>,
  options: AmenityFilterOptions = {},
): AmenityFilterView {
  return new Node(
    'amenityFilter',
    { binding: selection, options: { ...options, options: choices } },
    [],
  );
}
/** Bloom `SwitchFilterRow` titled `title`, on as the binding holds. */
export function SwitchFilterRow(
  title: string,
  on: Binding<boolean>,
  options: SwitchFilterRowOptions = {},
): SwitchFilterRowView {
  return new Node('switchFilterRow', { title, binding: on, options }, []);
}
/** Bloom `FilterFooter`: clear all, and apply with the results' label. */
export function FilterFooter(resultsLabel: string, options: FilterFooterOptions): FilterFooterView {
  return new Node('filterFooter', { resultsLabel, options }, []);
}
/** Bloom `FilterTriggerButton`, a badge with `count` while filters apply. */
export function FilterTriggerButton(
  count?: number,
  options: FilterTriggerButtonOptions = {},
): FilterTriggerButtonView {
  return new Node('filterTriggerButton', { count, options }, []);
}
/** Bloom `AreaRangeFilter`, its range (`null` open-ended) the binding holds. */
export function AreaRangeFilter(
  range: Binding<[number | null, number | null]>,
  options: AreaRangeFilterOptions = {},
): AreaRangeFilterView {
  return new Node('areaRangeFilter', { binding: range, options }, []);
}
/** Bloom `AvailabilityFilter`: available now, else from the date its second binding holds. */
export function AvailabilityFilter(
  availableNow: Binding<boolean>,
  date: Binding<Date | null>,
  options: AvailabilityFilterOptions = {},
): AvailabilityFilterView {
  return new Node(
    'availabilityFilter',
    { binding: availableNow, options: { ...options, date: date[0], onDateChange: date[1] } },
    [],
  );
}
/** Bloom `FeatureFilter`, the chosen features the binding holds. */
export function FeatureFilter(
  selection: Binding<string[]>,
  options: FeatureFilterOptions = {},
): FeatureFilterView {
  return new Node('featureFilter', { binding: selection, options: chips(options) }, []);
}
/** Bloom `FloorFilter`, the chosen floors the binding holds. */
export function FloorFilter(
  selection: Binding<string[]>,
  options: FloorFilterOptions = {},
): FloorFilterView {
  return new Node('floorFilter', { binding: selection, options: chips(options) }, []);
}

const disabled = (d: Parameters<ControlRenderer>[0]) => ({ disabled: d.own('disabled')?.value });
const edited = ['value', 'onValueChange'] as const;

export const STAY_FILTERS: Record<StayFilterKind, ControlRenderer> = {
  filterSection: product(BloomFilterSection, {
    own: (d) => ({ divider: d.own('dividers')?.value }),
  }),
  priceRangeFilter: product(BloomPriceRangeFilter, {
    binding: edited,
    lengths: ['histogramHeight'],
    own: (d) => ({ scale: d.own('style')?.value, ...disabled(d) }),
  }),
  countFilter: product(BloomCountFilter, { binding: edited, own: disabled }),
  toggleChipGroup: product(BloomToggleChipGroup, { binding: edited, own: disabled }),
  amenityFilter: product(BloomAmenityFilter, { binding: edited, own: disabled }),
  switchFilterRow: product(BloomSwitchFilterRow, { binding: edited, own: disabled }),
  filterFooter: product(BloomFilterFooter, {
    own: (d) => ({ loading: d.own('loading')?.value }),
  }),
  filterTriggerButton: product(BloomFilterTriggerButton, {
    press: true,
    own: (d) => ({ size: d.own('size')?.value, ...disabled(d) }),
  }),
  areaRangeFilter: product(BloomAreaRangeFilter, { binding: edited, own: disabled }),
  availabilityFilter: product(BloomAvailabilityFilter, {
    binding: ['availableNow', 'onAvailableNowChange'],
    own: disabled,
  }),
  featureFilter: product(BloomFeatureFilter, {
    binding: edited,
    own: (d) => ({ variant: d.own('style')?.value, ...disabled(d) }),
  }),
  floorFilter: product(BloomFloorFilter, { binding: edited, own: disabled }),
};
