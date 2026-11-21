import {
  type Amenity,
  AmenityList as BloomAmenityList,
  type AmenityListProps,
  HostCard as BloomHostCard,
  type HostCardProps,
  ListingHeader as BloomListingHeader,
  ListingHeaderAction as BloomListingHeaderAction,
  type ListingHeaderActionProps,
  type ListingHeaderProps,
  type ListingPhoto,
  ListingPhotoGrid as BloomListingPhotoGrid,
  type ListingPhotoGridProps,
  ReviewCard as BloomReviewCard,
  type ReviewCardProps,
} from '@oxy.so/bloom/listing-details';
import {
  MapClusterMarker as BloomMapClusterMarker,
  type MapClusterMarkerProps,
  MapPriceMarker as BloomMapPriceMarker,
  type MapPriceMarkerProps,
  MapSearchAreaButton as BloomMapSearchAreaButton,
  type MapSearchAreaButtonProps,
} from '@oxy.so/bloom/map-marker';

import { type Child, Node, type ViewModifiers } from '../node';
import type {
  ListingHeaderSize,
  ListingPhotoLayout,
  MapMarkerState,
  MapPriceMarkerSize,
} from '../tokens';
import type { ControlRenderer } from './draw';
import { product } from './product';

/** A listing's details and the markers of a map of listings. */
export type ListingKind =
  | 'amenityList'
  | 'hostCard'
  | 'listingHeader'
  | 'listingHeaderAction'
  | 'listingPhotoGrid'
  | 'reviewCard'
  | 'mapClusterMarker'
  | 'mapPriceMarker'
  | 'mapSearchAreaButton';

type Drawn = 'style' | 'testID' | 'accessibilityLabel';

export type AmenityListOptions = Omit<AmenityListProps, Drawn | 'items'>;
export type HostCardOptions = Omit<HostCardProps, Drawn | 'name'>;
export type ListingHeaderOptions = Omit<
  ListingHeaderProps,
  Drawn | 'title' | 'size' | 'badge' | 'actions'
> & { readonly badge?: Child; readonly actions?: Child };
export type ListingHeaderActionOptions = Omit<
  ListingHeaderActionProps,
  Drawn | 'label' | 'onPress'
>;
export type ListingPhotoGridOptions = Omit<ListingPhotoGridProps, Drawn | 'photos' | 'layout'>;
export type ReviewCardOptions = Omit<ReviewCardProps, Drawn | 'name' | 'text' | 'numberOfLines'>;
export type MapClusterMarkerOptions = Omit<
  MapClusterMarkerProps,
  Drawn | 'count' | 'state' | 'onPress'
>;
export type MapPriceMarkerOptions = Omit<
  MapPriceMarkerProps,
  Drawn | 'price' | 'state' | 'size' | 'onPress'
>;
/** A toggle (`variant: 'toggle'`, its `checked` and `onCheckedChange`) or a button (`.onPress()`). */
export type MapSearchAreaButtonOptions = MapSearchAreaButtonProps extends infer P
  ? P extends unknown
    ? Omit<P, 'style' | 'testID' | 'disabled' | 'onPress'>
    : never
  : never;

export type AmenityListView = ViewModifiers<AmenityListView>;
export type HostCardView = ViewModifiers<HostCardView>;
export interface ListingHeaderView extends ViewModifiers<ListingHeaderView> {
  /** `large` (default) or `medium`. */
  size(value: ListingHeaderSize): ListingHeaderView;
}
/** Bloom `ListingHeaderAction`; `.onPress()` is what it does. */
export type ListingHeaderActionView = ViewModifiers<ListingHeaderActionView>;
export interface ListingPhotoGridView extends ViewModifiers<ListingPhotoGridView> {
  /** `auto` (default), `grid` or `carousel`. */
  style(value: ListingPhotoLayout): ListingPhotoGridView;
}
export interface ReviewCardView extends ViewModifiers<ReviewCardView> {
  /** The review's text folds after this many lines. */
  lines(value: number): ReviewCardView;
}
/** Bloom `MapClusterMarker`; `.onPress()` zooms in. */
export interface MapClusterMarkerView extends ViewModifiers<MapClusterMarkerView> {
  /** `default`, `active` or `visited`. */
  style(value: MapMarkerState): MapClusterMarkerView;
}
/** Bloom `MapPriceMarker`; `.onPress()` selects the listing. */
export interface MapPriceMarkerView extends ViewModifiers<MapPriceMarkerView> {
  style(value: MapMarkerState): MapPriceMarkerView;
  /** `default` or `compact`. */
  size(value: MapPriceMarkerSize): MapPriceMarkerView;
}
export interface MapSearchAreaButtonView extends ViewModifiers<MapSearchAreaButtonView> {
  disabled(value?: boolean): MapSearchAreaButtonView;
}

export function AmenityList(
  items: readonly Amenity[],
  options: AmenityListOptions = {},
): AmenityListView {
  return new Node('amenityList', { items, options }, []);
}
export function HostCard(name: string, options: HostCardOptions = {}): HostCardView {
  return new Node('hostCard', { name, options }, []);
}
export function ListingHeader(
  title: string,
  options: ListingHeaderOptions = {},
): ListingHeaderView {
  return new Node('listingHeader', { title, options }, []);
}
export function ListingHeaderAction(
  label: string,
  options: ListingHeaderActionOptions = {},
): ListingHeaderActionView {
  return new Node('listingHeaderAction', { label, options }, []);
}
export function ListingPhotoGrid(
  photos: readonly ListingPhoto[],
  options: ListingPhotoGridOptions = {},
): ListingPhotoGridView {
  return new Node('listingPhotoGrid', { photos, options }, []);
}
export function ReviewCard(
  name: string,
  text: string,
  options: ReviewCardOptions = {},
): ReviewCardView {
  return new Node('reviewCard', { name, text, options }, []);
}
export function MapClusterMarker(
  count: number | string,
  options: MapClusterMarkerOptions = {},
): MapClusterMarkerView {
  return new Node('mapClusterMarker', { count, options }, []);
}
export function MapPriceMarker(
  price: string,
  options: MapPriceMarkerOptions = {},
): MapPriceMarkerView {
  return new Node('mapPriceMarker', { price, options }, []);
}
export function MapSearchAreaButton(
  options: MapSearchAreaButtonOptions = {},
): MapSearchAreaButtonView {
  return new Node('mapSearchAreaButton', { options }, []);
}

export const LISTINGS: Record<ListingKind, ControlRenderer> = {
  amenityList: product(BloomAmenityList),
  hostCard: product(BloomHostCard),
  listingHeader: product(BloomListingHeader, {
    slots: ['badge', 'actions'],
    own: (d) => ({ size: d.own('size')?.value }),
  }),
  listingHeaderAction: product(BloomListingHeaderAction, { press: true }),
  listingPhotoGrid: product(BloomListingPhotoGrid, {
    own: (d) => ({ layout: d.own('style')?.value }),
  }),
  reviewCard: product(BloomReviewCard, {
    own: (d) => ({ numberOfLines: d.own('lines')?.value }),
  }),
  mapClusterMarker: product(BloomMapClusterMarker, {
    press: true,
    own: (d) => ({ state: d.own('style')?.value }),
  }),
  mapPriceMarker: product(BloomMapPriceMarker, {
    press: true,
    own: (d) => ({ state: d.own('style')?.value, size: d.own('size')?.value }),
  }),
  mapSearchAreaButton: product(BloomMapSearchAreaButton, {
    press: true,
    own: (d) => ({ disabled: d.own('disabled')?.value }),
  }),
};
