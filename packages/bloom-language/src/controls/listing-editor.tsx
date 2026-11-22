import {
  type ListingPreviewData,
  ListingPreviewPane as BloomListingPreviewPane,
  type ListingPreviewPaneProps,
  ListingQualityMeter as BloomListingQualityMeter,
  type ListingQualityItem,
  type ListingQualityMeterProps,
  PropertyTypeSelector as BloomPropertyTypeSelector,
  type PropertyTypeSelectorProps,
} from '@oxy.so/bloom/listing-editor';
import type { PropertyType } from '@oxy.so/bloom/stay-filters';

import type { Binding } from '../binding';
import { type Child, Node, type ViewModifiers } from '../node';
import type { ControlRenderer } from './draw';
import { product } from './product';

/** A host's listing editor: the preview, the quality meter, the property type. */
export type ListingEditorKind =
  | 'listingPreviewPane'
  | 'listingQualityMeter'
  | 'propertyTypeSelector';

type Drawn = 'style' | 'testID' | 'accessibilityLabel';

/** Bloom `ListingPreviewPane`'s words and mode; `renderPage` draws the page preview as a view. */
export type ListingPreviewPaneOptions = Omit<
  ListingPreviewPaneProps,
  'style' | 'testID' | 'listing' | 'renderPage'
> & { readonly renderPage?: (listing: ListingPreviewData) => Child };
export type ListingQualityMeterOptions = Omit<ListingQualityMeterProps, Drawn | 'items'>;
export type PropertyTypeSelectorOptions<T extends string = PropertyType> = Omit<
  PropertyTypeSelectorProps<T>,
  Drawn | 'value' | 'onValueChange' | 'columns' | 'disabled'
>;

/** Bloom `ListingPreviewPane`: the listing as guests see it, as a card or a page. */
export type ListingPreviewPaneView = ViewModifiers<ListingPreviewPaneView>;
/** Bloom `ListingQualityMeter`: how complete a listing is, and what to add. */
export type ListingQualityMeterView = ViewModifiers<ListingQualityMeterView>;
/** Bloom `PropertyTypeSelector`: one property type, as its binding holds. */
export interface PropertyTypeSelectorView extends ViewModifiers<PropertyTypeSelectorView> {
  /** Tiles per row; by default as many as fit. */
  columns(value: number): PropertyTypeSelectorView;
  disabled(value?: boolean): PropertyTypeSelectorView;
}

/** Bloom `ListingPreviewPane` of `listing` (Bloom's `ListingPreviewData`). */
export function ListingPreviewPane(
  listing: ListingPreviewData,
  options: ListingPreviewPaneOptions = {},
): ListingPreviewPaneView {
  return new Node('listingPreviewPane', { listing, options }, []);
}
/** Bloom `ListingQualityMeter` of `items`; its score is theirs unless the options give one. */
export function ListingQualityMeter(
  items: readonly ListingQualityItem[],
  options: ListingQualityMeterOptions = {},
): ListingQualityMeterView {
  return new Node('listingQualityMeter', { items, options }, []);
}
/** Bloom `PropertyTypeSelector`: `type` is the selected one (`null` before one is chosen). */
export function PropertyTypeSelector<T extends string = PropertyType>(
  type: Binding<T | null>,
  options: PropertyTypeSelectorOptions<T> = {},
): PropertyTypeSelectorView {
  return new Node('propertyTypeSelector', { binding: type, options }, []);
}

export const LISTING_EDITORS: Record<ListingEditorKind, ControlRenderer> = {
  listingPreviewPane: product(BloomListingPreviewPane, {
    own: (d) => {
      const { renderPage } = (d.node.props as { options: ListingPreviewPaneOptions }).options;
      return {
        renderPage:
          renderPage === undefined
            ? undefined
            : (listing: ListingPreviewData) => d.render(renderPage(listing)),
      };
    },
  }),
  listingQualityMeter: product(BloomListingQualityMeter),
  propertyTypeSelector: product(BloomPropertyTypeSelector, {
    binding: ['value', 'onValueChange'],
    own: (d) => ({ columns: d.own('columns')?.value, disabled: d.own('disabled')?.value }),
  }),
};
