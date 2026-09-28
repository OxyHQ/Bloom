import { pickMessages } from '../locale/messages';
import { STAY_SEARCH_MESSAGES, type StaySearchMessages } from '../stay-search/messages';
import { HOME_SEARCH_MESSAGES, type HomeSearchMessages } from './messages';
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

/** The modes' tab labels in English; `SearchModeTabs` reads the locale's catalog. */
export const DEFAULT_HOME_SEARCH_MODE_LABELS: Record<HomeSearchMode, string> = HOME_SEARCH_MESSAGES.en.modes;

type SegmentPresets = { readonly [M in HomeSearchMode]: readonly HomeSearchSegment<HomeSearchSegmentKeys[M]>[] };

/**
 * Each mode's segments with their labels, placeholders and widths, and no
 * values, in one language. `homeSearchSegments()` fills the values in.
 *
 *   rent    Location · Move-in · Budget
 *   buy     Location · Price · Property type
 *   stays   Where · Check in · Check out · Who   (what `StaySearchBar` draws)
 *   swap    Where · Dates · Home size
 */
export function homeSearchSegmentPresets(home: HomeSearchMessages, stay: StaySearchMessages): SegmentPresets {
  return {
    rent: [
      { key: 'location', label: home.location, placeholder: home.locationPlaceholder, flex: 1.6 },
      { key: 'moveIn', label: home.moveIn, placeholder: home.datePlaceholder, flex: 1 },
      { key: 'budget', label: home.budget, placeholder: home.budgetPlaceholder, flex: 1.5 },
    ],
    buy: [
      { key: 'location', label: home.location, placeholder: home.locationPlaceholder, flex: 1.6 },
      { key: 'price', label: home.price, placeholder: home.pricePlaceholder, flex: 1.1 },
      { key: 'propertyType', label: home.propertyType, placeholder: home.propertyTypePlaceholder, flex: 1.5 },
    ],
    stays: [
      { key: 'destination', label: stay.where, placeholder: stay.destinationPlaceholder, flex: 1.4 },
      { key: 'checkIn', label: stay.checkIn, placeholder: stay.datesPlaceholder, flex: 1 },
      { key: 'checkOut', label: stay.checkOut, placeholder: stay.datesPlaceholder, flex: 1 },
      { key: 'guests', label: stay.who, placeholder: stay.guestsPlaceholder, flex: 1.5 },
    ],
    swap: [
      { key: 'destination', label: stay.where, placeholder: stay.destinationPlaceholder, flex: 1.5 },
      { key: 'dates', label: home.dates, placeholder: stay.datesPlaceholder, flex: 1.2 },
      { key: 'homeSize', label: home.homeSize, placeholder: home.homeSizePlaceholder, flex: 1.5 },
    ],
  };
}

/** The presets in English. `homeSearchSegments(mode, values, overrides, locale)` gives another language. */
export const HOME_SEARCH_SEGMENTS: SegmentPresets = homeSearchSegmentPresets(HOME_SEARCH_MESSAGES.en, STAY_SEARCH_MESSAGES.en);

/**
 * A mode's preset segments with `values` filled in and any per-key
 * `overrides` (label, placeholder, flex, panelAlign) applied.
 *
 * ```ts
 * homeSearchSegments('rent', { location: 'Old Halden', budget: '€800 – €1,200' });
 * ```
 *
 * `locale` picks the labels' language (the app's, e.g. `i18n.language`);
 * without it they follow the runtime's.
 */
export function homeSearchSegments<M extends HomeSearchMode>(
  mode: M,
  values?: Partial<Record<HomeSearchSegmentKeys[M], string>>,
  overrides?: HomeSearchSegmentOverrides<HomeSearchSegmentKeys[M]>,
  locale?: string,
): HomeSearchSegment<HomeSearchSegmentKeys[M]>[] {
  const presets = homeSearchSegmentPresets(
    pickMessages(HOME_SEARCH_MESSAGES, locale),
    pickMessages(STAY_SEARCH_MESSAGES, locale),
  );
  const preset = presets[mode] as readonly HomeSearchSegment<HomeSearchSegmentKeys[M]>[];
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

/** The four contract lengths in one language. */
export function contractLengthOptions(messages: HomeSearchMessages): MoveInOption[] {
  const { any, short, medium, long } = messages.contractLengths;
  return [
    { value: 'any', label: any },
    { value: 'short', label: short },
    { value: 'medium', label: medium },
    { value: 'long', label: long },
  ];
}

/** English; `MoveInPicker` reads the locale's catalog. */
export const DEFAULT_CONTRACT_LENGTHS: readonly MoveInOption[] = contractLengthOptions(HOME_SEARCH_MESSAGES.en);

/** English; `MoveInPicker` reads the locale's catalog. */
export const DEFAULT_MOVE_IN_LABELS: MoveInPickerLabels = HOME_SEARCH_MESSAGES.en.moveInLabels;
