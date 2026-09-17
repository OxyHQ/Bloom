import { DEFAULT_STAY_SEARCH_BAR_LABELS } from '../stay-search/constants';
import type {
  BudgetPeriod,
  BudgetPreset,
  HomeSearchMode,
  HomeSearchSegment,
  HomeSearchSegmentKeys,
  HomeSearchSegmentOverrides,
  MoveInOption,
  MoveInPickerLabels,
} from './types';

/** Every mode, in the default tab order. */
export const HOME_SEARCH_MODES: readonly HomeSearchMode[] = ['rent', 'buy', 'stays', 'swap'];

export const DEFAULT_HOME_SEARCH_MODE_LABELS: Record<HomeSearchMode, string> = {
  rent: 'Rent',
  buy: 'Buy',
  stays: 'Vacation rentals',
  swap: 'Swap',
};

type SegmentPresets = { readonly [M in HomeSearchMode]: readonly HomeSearchSegment<HomeSearchSegmentKeys[M]>[] };

/**
 * Each mode's segments with their labels, placeholders and widths, and no
 * values. `homeSearchSegments()` fills the values in.
 *
 *   rent    Location · Move-in · Budget
 *   buy     Location · Price · Property type
 *   stays   Where · Check in · Check out · Who   (what `StaySearchBar` draws)
 *   swap    Where · Dates · Home size
 */
export const HOME_SEARCH_SEGMENTS: SegmentPresets = {
  rent: [
    { key: 'location', label: 'Location', placeholder: 'Search city or area', flex: 1.6 },
    { key: 'moveIn', label: 'Move-in', placeholder: 'Add date', flex: 1 },
    { key: 'budget', label: 'Budget', placeholder: 'Add budget', flex: 1.5 },
  ],
  buy: [
    { key: 'location', label: 'Location', placeholder: 'Search city or area', flex: 1.6 },
    { key: 'price', label: 'Price', placeholder: 'Any price', flex: 1.1 },
    { key: 'propertyType', label: 'Property type', placeholder: 'Any type', flex: 1.5 },
  ],
  stays: [
    { key: 'destination', label: DEFAULT_STAY_SEARCH_BAR_LABELS.where, placeholder: DEFAULT_STAY_SEARCH_BAR_LABELS.destinationPlaceholder, flex: 1.4 },
    { key: 'checkIn', label: DEFAULT_STAY_SEARCH_BAR_LABELS.checkIn, placeholder: DEFAULT_STAY_SEARCH_BAR_LABELS.datesPlaceholder, flex: 1 },
    { key: 'checkOut', label: DEFAULT_STAY_SEARCH_BAR_LABELS.checkOut, placeholder: DEFAULT_STAY_SEARCH_BAR_LABELS.datesPlaceholder, flex: 1 },
    { key: 'guests', label: DEFAULT_STAY_SEARCH_BAR_LABELS.who, placeholder: DEFAULT_STAY_SEARCH_BAR_LABELS.guestsPlaceholder, flex: 1.5 },
  ],
  swap: [
    { key: 'destination', label: 'Where', placeholder: 'Search destinations', flex: 1.5 },
    { key: 'dates', label: 'Dates', placeholder: 'Add dates', flex: 1.2 },
    { key: 'homeSize', label: 'Home size', placeholder: 'Any size', flex: 1.5 },
  ],
};

/**
 * A mode's preset segments with `values` filled in and any per-key
 * `overrides` (label, placeholder, flex, panelAlign) applied.
 *
 * ```ts
 * homeSearchSegments('rent', { location: 'Old Halden', budget: '€800 – €1,200' });
 * ```
 */
export function homeSearchSegments<M extends HomeSearchMode>(
  mode: M,
  values?: Partial<Record<HomeSearchSegmentKeys[M], string>>,
  overrides?: HomeSearchSegmentOverrides<HomeSearchSegmentKeys[M]>,
): HomeSearchSegment<HomeSearchSegmentKeys[M]>[] {
  const preset = HOME_SEARCH_SEGMENTS[mode] as readonly HomeSearchSegment<HomeSearchSegmentKeys[M]>[];
  return preset.map((segment) => ({
    ...segment,
    ...overrides?.[segment.key],
    value: values?.[segment.key] ?? overrides?.[segment.key]?.value,
  }));
}

export const DEFAULT_BUDGET_PRESETS: Record<BudgetPeriod, readonly BudgetPreset[]> = {
  month: [
    { min: null, max: 800 },
    { min: 800, max: 1200 },
    { min: 1200, max: 1800 },
    { min: 1800, max: null },
  ],
  total: [
    { min: null, max: 150000 },
    { min: 150000, max: 300000 },
    { min: 300000, max: 600000 },
    { min: 600000, max: null },
  ],
};

export const DEFAULT_CONTRACT_LENGTHS: readonly MoveInOption[] = [
  { value: 'any', label: 'Any' },
  { value: 'short', label: '1–6 months' },
  { value: 'medium', label: '6–12 months' },
  { value: 'long', label: '1+ year' },
];

export const DEFAULT_MOVE_IN_LABELS: MoveInPickerLabels = {
  date: 'Move-in date',
  flexible: 'Flexible',
  asap: 'As soon as possible',
  contractLength: 'Contract length',
};
