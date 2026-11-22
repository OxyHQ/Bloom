import { PlaceCard as BloomPlaceCard, type PlaceCardProps } from '@oxy.so/bloom/place-card';
import {
  PlaceHours as BloomPlaceHours,
  type PlaceHoursDay,
  type PlaceHoursProps,
  PlaceInfoList as BloomPlaceInfoList,
  type PlaceInfoItem,
  type PlaceInfoListProps,
  PlaceTransit as BloomPlaceTransit,
  type PlaceTransitProps,
  type PlaceTransitStop,
} from '@oxy.so/bloom/place-details';
import {
  PlaceList as BloomPlaceList,
  type PlaceListCardProps,
  PlaceListCard as BloomPlaceListCard,
  type PlaceListPlace,
  type PlaceListProps,
} from '@oxy.so/bloom/place-list';
import {
  DirectionsSteps as BloomDirectionsSteps,
  type DirectionsLeg,
  type DirectionsStepsProps,
} from '@oxy.so/bloom/directions';
import {
  PlacePicker as BloomPlacePicker,
  type PlacePickerOption,
  type PlacePickerProps,
} from '@oxy.so/bloom/place-picker';

import type { Binding } from '../binding';
import { type Child, Node, type ViewModifiers } from '../node';
import type { BloomSize } from '@oxy.so/bloom/appearance';
import type { ColorToken, DirectionsDensity, PlaceCardStyle } from '../tokens';
import type { ControlRenderer } from './draw';
import { product, slot } from './product';

/** A place, its details, a saved list of places, the steps to one, and the field that picks one. */
export type PlaceKind =
  | 'placeCard'
  | 'placeHours'
  | 'placeInfoList'
  | 'placeTransit'
  | 'placeListCard'
  | 'placeList'
  | 'directionsSteps'
  | 'placePicker';

type Drawn = 'style' | 'testID' | 'accessibilityLabel';

/**
 * Bloom `PlaceCard`'s facts and handlers. Its `badge` is a word (Bloom draws
 * its quiet badge) or a language child.
 */
export type PlaceCardOptions = Omit<
  PlaceCardProps,
  Drawn | 'name' | 'density' | 'loading' | 'onPress' | 'badge'
> & { readonly badge?: string | Child };
export type PlaceHoursOptions = Omit<PlaceHoursProps, Drawn | 'days'>;
export type PlaceInfoListOptions = Omit<PlaceInfoListProps, Drawn | 'items'>;
/** Bloom `PlaceTransit`'s handlers and words; its `footer` is a language child. */
export type PlaceTransitOptions = Omit<PlaceTransitProps, Drawn | 'stops' | 'footer'> & {
  readonly footer?: Child;
};
/** Bloom `PlaceListCard`'s list; what its strip shows with no photos (`empty`) is a language child. */
export type PlaceListCardOptions = Omit<
  PlaceListCardProps,
  Drawn | 'name' | 'onPress' | 'color' | 'empty'
> & { readonly empty?: Child };
/** Bloom `PlaceList`'s handlers and words; what it shows with no places (`empty`) is a language child. */
export type PlaceListOptions = Omit<PlaceListProps, Drawn | 'places' | 'disabled' | 'empty'> & {
  readonly empty?: Child;
};
export type DirectionsStepsOptions = Omit<DirectionsStepsProps, Drawn | 'legs' | 'density'>;
/** Bloom `PlacePicker`'s answer for the text, its status and its words. */
export type PlacePickerOptions<Option extends PlacePickerOption = PlacePickerOption> = Omit<
  PlacePickerProps<Option>,
  Drawn | 'label' | 'value' | 'onValueChange' | 'query' | 'onQueryChange' | 'size' | 'disabled'
>;

/** Bloom `PlaceCard`; `.onPress()` opens the place (a row). */
export interface PlaceCardView extends ViewModifiers<PlaceCardView> {
  /** `row` (default): a result over the map; `detail`: the header of the place's sheet. */
  style(value: PlaceCardStyle): PlaceCardView;
  /** A skeleton in the same geometry. */
  loading(value?: boolean): PlaceCardView;
}
export type PlaceHoursView = ViewModifiers<PlaceHoursView>;
export type PlaceInfoListView = ViewModifiers<PlaceInfoListView>;
export type PlaceTransitView = ViewModifiers<PlaceTransitView>;
/** Bloom `PlaceListCard`; `.onPress()` opens the list. */
export interface PlaceListCardView extends ViewModifiers<PlaceListCardView> {
  /** The list's own colour: its glyph and its empty strip. */
  tint(value: ColorToken): PlaceListCardView;
}
export interface PlaceListView extends ViewModifiers<PlaceListView> {
  /** Stops reordering and removing, keeping the controls. */
  disabled(value?: boolean): PlaceListView;
}
export interface DirectionsStepsView extends ViewModifiers<DirectionsStepsView> {
  /** `comfortable` (default) or `compact`. */
  size(value: DirectionsDensity): DirectionsStepsView;
}
export interface PlacePickerView extends ViewModifiers<PlacePickerView> {
  /** The field's rung; with none, the nearest scope's (`md`). */
  size(value: BloomSize): PlacePickerView;
  disabled(value?: boolean): PlacePickerView;
}

/** Bloom `PlaceCard` of the place `name`. */
export function PlaceCard(name: string, options: PlaceCardOptions = {}): PlaceCardView {
  return new Node('placeCard', { name, options }, []);
}
/** Bloom `PlaceHours`: the week's hours, folded under today's line. */
export function PlaceHours(
  days: readonly PlaceHoursDay[],
  options: PlaceHoursOptions = {},
): PlaceHoursView {
  return new Node('placeHours', { days, options }, []);
}
/** Bloom `PlaceInfoList`: the rows a reader acts on (address, phone, site). */
export function PlaceInfoList(
  items: readonly PlaceInfoItem[],
  options: PlaceInfoListOptions = {},
): PlaceInfoListView {
  return new Node('placeInfoList', { items, options }, []);
}
/** Bloom `PlaceTransit`: the stops near a place and what leaves them. */
export function PlaceTransit(
  stops: readonly PlaceTransitStop[],
  options: PlaceTransitOptions = {},
): PlaceTransitView {
  return new Node('placeTransit', { stops, options }, []);
}
/** Bloom `PlaceListCard` of the saved list `name`. */
export function PlaceListCard(name: string, options: PlaceListCardOptions = {}): PlaceListCardView {
  return new Node('placeListCard', { name, options }, []);
}
/** Bloom `PlaceList`: the places of a saved list, reorderable and removable by its handlers. */
export function PlaceList(
  places: readonly PlaceListPlace[],
  options: PlaceListOptions = {},
): PlaceListView {
  return new Node('placeList', { places, options }, []);
}
/** Bloom `DirectionsSteps`: a route's legs, step by step. */
export function DirectionsSteps(
  legs: readonly DirectionsLeg[],
  options: DirectionsStepsOptions = {},
): DirectionsStepsView {
  return new Node('directionsSteps', { legs, options }, []);
}
/**
 * Bloom `PlacePicker` named `label`: it searches as `query` holds the text,
 * and holds the chosen place in `place`.
 */
export function PlacePicker<Option extends PlacePickerOption = PlacePickerOption>(
  label: string,
  place: Binding<Option | null>,
  query: Binding<string>,
  options: PlacePickerOptions<Option>,
): PlacePickerView {
  return new Node('placePicker', { label, binding: place, query, options }, []);
}

export const PLACES: Record<PlaceKind, ControlRenderer> = {
  placeCard: product(BloomPlaceCard, {
    press: true,
    own: (d) => {
      const { badge } = (d.node.props as { options: PlaceCardOptions }).options;
      return {
        density: d.own('style')?.value,
        loading: d.own('loading')?.value,
        // A word is Bloom's own badge; a view is drawn where it goes.
        badge: typeof badge === 'string' ? badge : slot(d, badge),
      };
    },
  }),
  placeHours: product(BloomPlaceHours),
  placeInfoList: product(BloomPlaceInfoList),
  placeTransit: product(BloomPlaceTransit, { slots: ['footer'] }),
  placeListCard: product(BloomPlaceListCard, {
    press: true,
    slots: ['empty'],
    colors: (d) => ({ color: d.own('tint')?.value as ColorToken | undefined }),
  }),
  placeList: product(BloomPlaceList, {
    slots: ['empty'],
    own: (d) => ({ disabled: d.own('disabled')?.value }),
  }),
  directionsSteps: product(BloomDirectionsSteps, {
    own: (d) => ({ density: d.own('size')?.value }),
  }),
  placePicker: product(BloomPlacePicker, {
    binding: ['value', 'onValueChange'],
    own: (d) => {
      const [query, onQueryChange] = (d.node.props as { query: Binding<string> }).query;
      return {
        query,
        onQueryChange,
        size: d.own('size')?.value,
        disabled: d.own('disabled')?.value,
      };
    },
  }),
};
