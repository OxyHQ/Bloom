import {
  type HomeSearchBarProps,
  HomeSearchBar as BloomHomeSearchBar,
  type HomeSearchMode,
  type HomeSearchSegment,
  type PropertyTypePickerProps,
  PropertyTypePicker as BloomPropertyTypePicker,
  type SavedSearchCardProps,
  SavedSearchCard as BloomSavedSearchCard,
  type SearchModeTabsProps,
  SearchModeTabs as BloomSearchModeTabs,
} from '@oxy.so/bloom/home-search';
import type { PropertyType } from '@oxy.so/bloom/stay-filters';

import type { Binding } from '../binding';
import { type Child, Node, type ViewModifiers } from '../node';
import type { SearchModeTabsStyle } from '../tokens';
import type { ControlRenderer } from './draw';
import { product } from './product';

/** A home search: the segmented bar, the mode tabs, the type tiles, a saved search. */
export type HomeSearchKind =
  | 'homeSearchBar'
  | 'searchModeTabs'
  | 'propertyTypePicker'
  | 'savedSearchCard';

type Drawn = 'style' | 'testID' | 'accessibilityLabel';

export type HomeSearchBarOptions<K extends string = string> = Omit<
  HomeSearchBarProps<K>,
  'style' | 'testID' | 'segments' | 'activeSegment' | 'onActiveSegmentChange' | 'panel'
> & { readonly panel?: Child };
export type SearchModeTabsOptions<K extends string = HomeSearchMode> = Omit<
  SearchModeTabsProps<K>,
  Drawn | 'value' | 'onValueChange' | 'variant'
>;
export type PropertyTypePickerOptions<T extends string = PropertyType> = Omit<
  PropertyTypePickerProps<T>,
  Drawn | 'value' | 'onValueChange' | 'columns' | 'disabled'
>;
export type SavedSearchCardOptions = Omit<
  SavedSearchCardProps,
  'style' | 'testID' | 'title' | 'onPress'
>;

/** Bloom `HomeSearchBar`: the segments of a search, one open as its binding holds. */
export type HomeSearchBarView = ViewModifiers<HomeSearchBarView>;
/** Bloom `SearchModeTabs`: rent, buy, stays or swap, as its binding holds. */
export interface SearchModeTabsView extends ViewModifiers<SearchModeTabsView> {
  /** `tabs` (default): text tabs with an underline; `segmented`: a pill, for a phone. */
  style(value: SearchModeTabsStyle): SearchModeTabsView;
}
/** Bloom `PropertyTypePicker`: the property types a search takes, as its binding holds. */
export interface PropertyTypePickerView extends ViewModifiers<PropertyTypePickerView> {
  /** Tiles per row; by default as many as fit. */
  columns(value: number): PropertyTypePickerView;
  disabled(value?: boolean): PropertyTypePickerView;
}
/** Bloom `SavedSearchCard`; `.onPress()` opens the search's results. */
export type SavedSearchCardView = ViewModifiers<SavedSearchCardView>;

/** Bloom `HomeSearchBar` of `segments`; `active` is the open segment, `null` at rest. */
export function HomeSearchBar<K extends string = string>(
  segments: readonly HomeSearchSegment<K>[],
  active: Binding<K | null>,
  options: HomeSearchBarOptions<K> = {},
): HomeSearchBarView {
  return new Node('homeSearchBar', { segments, binding: active, options }, []);
}
/** Bloom `SearchModeTabs`: `mode` is the selected one. */
export function SearchModeTabs<K extends string = HomeSearchMode>(
  mode: Binding<K>,
  options: SearchModeTabsOptions<K> = {},
): SearchModeTabsView {
  return new Node('searchModeTabs', { binding: mode, options }, []);
}
/** Bloom `PropertyTypePicker`: `types` are the selected ones (none is any type). */
export function PropertyTypePicker<T extends string = PropertyType>(
  types: Binding<T[]>,
  options: PropertyTypePickerOptions<T> = {},
): PropertyTypePickerView {
  return new Node('propertyTypePicker', { binding: types, options }, []);
}
/** Bloom `SavedSearchCard` of the search named `title`. */
export function SavedSearchCard(
  title: string,
  options: SavedSearchCardOptions = {},
): SavedSearchCardView {
  return new Node('savedSearchCard', { title, options }, []);
}

export const HOME_SEARCHES: Record<HomeSearchKind, ControlRenderer> = {
  homeSearchBar: product(BloomHomeSearchBar, {
    binding: ['activeSegment', 'onActiveSegmentChange'],
    slots: ['panel'],
  }),
  searchModeTabs: product(BloomSearchModeTabs, {
    binding: ['value', 'onValueChange'],
    own: (d) => ({ variant: d.own('style')?.value }),
  }),
  propertyTypePicker: product(BloomPropertyTypePicker, {
    binding: ['value', 'onValueChange'],
    own: (d) => ({ columns: d.own('columns')?.value, disabled: d.own('disabled')?.value }),
  }),
  savedSearchCard: product(BloomSavedSearchCard, { press: true }),
};
