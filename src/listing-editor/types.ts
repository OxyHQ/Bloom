import type { ComponentType, ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { ListingCardProps } from '../listing-card/types';
import type { PropertyType, PropertyTypeOption } from '../stay-filters/types';
import type { BloomIconComponent } from '../icons/icon-component';

/** The shared property-type vocabulary lives with the filters; re-exported for this family's own modules. */
export type { PropertyType, PropertyTypeOption };

/** An icon component: a Remix icon from `@oxy.so/bloom/icons` or one of the same shape. */
/** @deprecated Use `BloomIconComponent` from `@oxy.so/bloom/icons`; this is an alias of it. */
export type ListingEditorIcon = BloomIconComponent;

// ---------------------------------------------------------------------------
//  OfferingEditor
// ---------------------------------------------------------------------------

/** How a home is offered. A listing can be offered several ways at once. */
export type OfferingKind = 'rent' | 'sale' | 'stay' | 'swap';

/** How a home exchange works: a two-way swap, hosting only, or either. */
export type SwapMode = 'swap' | 'host' | 'both';

export interface RentOffering {
  /** The monthly rent as typed, digits only ("1450"). */
  amount?: string;
  /** Deposit in months of rent; `0` is none. */
  depositMonths?: number | null;
  availableFrom?: Date | null;
  /** Minimum tenancy in months. */
  minimumMonths?: number;
}

export interface SaleOffering {
  /** The asking price as typed ("385000"). */
  price?: string;
}

export interface StayOffering {
  /** The nightly rate as typed ("96"). */
  nightlyRate?: string;
  /** The cleaning fee as typed ("35"). */
  cleaningFee?: string;
  minimumNights?: number;
}

export interface SwapOffering {
  mode?: SwapMode | null;
}

/** The controlled value of an {@link OfferingEditorProps}. */
export interface OfferingValue {
  /** The ways the home is offered, in the order they were picked. */
  kinds: OfferingKind[];
  rent?: RentOffering;
  sale?: SaleOffering;
  stay?: StayOffering;
  swap?: SwapOffering;
}

/** The fields an {@link OfferingErrors} message can sit under. */
export type OfferingField =
  | 'kinds'
  | 'rent.amount'
  | 'rent.depositMonths'
  | 'rent.availableFrom'
  | 'rent.minimumMonths'
  | 'sale.price'
  | 'stay.nightlyRate'
  | 'stay.cleaningFee'
  | 'stay.minimumNights'
  | 'swap.mode';

/** Validation messages the app computed, keyed by field. */
export type OfferingErrors = Partial<Record<OfferingField, string>>;

/** One offering card's copy. */
export interface OfferingCardCopy {
  title: string;
  description: string;
}

/** Every visible string, overridable for localisation. */
export interface OfferingEditorLabels {
  rent: OfferingCardCopy;
  sale: OfferingCardCopy;
  stay: OfferingCardCopy;
  swap: OfferingCardCopy;
  /** Default `"Monthly rent"`. */
  monthlyRent: string;
  /** Default `"Deposit"`. */
  deposit: string;
  /** A deposit chip. Default `0 → "None"`, `n → "n month(s)"`. */
  depositOption: (months: number) => string;
  /** Default `"Available from"`. */
  availableFrom: string;
  /** Default `"Minimum stay"`. */
  minimumStay: string;
  /** The minimum stay's value. Default `n → "n month(s)"`. */
  months: (months: number) => string;
  /** Default `"Asking price"`. */
  askingPrice: string;
  /** Default `"Price per m²"`. */
  pricePerArea: string;
  /** Shown for the per-area price with no price or area. Default `"Add a price"`. */
  pricePerAreaEmpty: string;
  /** Default `"Nightly rate"`. */
  nightlyRate: string;
  /** Default `"Cleaning fee"`. */
  cleaningFee: string;
  /** Default `"Minimum nights"`. */
  minimumNights: string;
  /** The minimum nights' value. Default `n → "n night(s)"`. */
  nights: (nights: number) => string;
  /** Default `"How would you like to exchange?"`. */
  swapMode: string;
  swapModes: Record<SwapMode, string>;
  /** Names the group of cards. Default `"How is the home offered?"`. */
  group: string;
}

export interface OfferingEditorProps {
  value: OfferingValue;
  onValueChange: (value: OfferingValue) => void;
  /** The kinds to offer, in order. Default all four. */
  kinds?: ReadonlyArray<OfferingKind>;
  /** Drawn before every money field ("€"). Default `"€"`. */
  currencySymbol?: string;
  /**
   * The home's floor area. With a sale price it gives the read-only price per
   * area — the one number this component computes.
   */
  area?: number;
  /** The unit `area` is in. Default `"m²"`. */
  areaUnit?: string;
  /** Formats the computed price per area. Default: rounded, thousands spaced, `currencySymbol` first. */
  formatPricePerArea?: (value: number) => string;
  /** The deposit chips, in months. Default `[0, 1, 2, 3]`. */
  depositOptions?: ReadonlyArray<number>;
  /** Messages under fields; `kinds` sits under the cards. */
  errors?: OfferingErrors;
  labels?: Partial<OfferingEditorLabels>;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  PropertyTypeSelector
// ---------------------------------------------------------------------------

export interface PropertyTypeSelectorProps<T extends string = PropertyType> {
  value: T | null;
  onValueChange: (value: T) => void;
  /** The tiles. Default Bloom's nine property types with English labels. */
  options?: ReadonlyArray<PropertyTypeOption<T>>;
  /** A fixed column count. Default: 2 below 400 wide, 3 below 640, 4 from there. */
  columns?: number;
  /** Names the radiogroup. Default `"Property type"`. */
  accessibilityLabel?: string;
  /** A message under the tiles, painted as an error. */
  error?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  AddressPrecisionPicker
// ---------------------------------------------------------------------------

/** How precisely the published listing shows where the home is. */
export type AddressPrecision = 'exact' | 'street' | 'approximate';

export interface AddressPrecisionOption {
  value: AddressPrecision;
  title: string;
  description: string;
}

export interface AddressPrecisionPickerProps {
  value: AddressPrecision;
  onValueChange: (value: AddressPrecision) => void;
  /**
   * Draws a card's map preview. Default: Bloom's placeholder — a street grid
   * with a pin (exact), a highlighted street (street) or a circle
   * (approximate). Return a real static map here.
   */
  renderMap?: (precision: AddressPrecision) => ReactNode;
  /** The three cards' copy, in order. Default English copy. */
  options?: ReadonlyArray<AddressPrecisionOption>;
  /** The line under the cards. Default explains that the choice decides the published location. `null` hides it. */
  footnote?: string | null;
  /** Names the radiogroup. Default `"Address precision"`. */
  accessibilityLabel?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  ListingQualityMeter
// ---------------------------------------------------------------------------

export interface ListingQualityItem {
  key: string;
  /** The task ("Add at least 5 photos"). */
  label: string;
  /** Why it matters or how to do it, under the label while not done. */
  tip?: string;
  done: boolean;
  /** Share of the score. Default `1`. */
  weight?: number;
  /** Makes the row a button that takes the user to the step. */
  onPress?: () => void;
}

export interface ListingQualityMeterProps {
  items: ReadonlyArray<ListingQualityItem>;
  /** 0..100. Default: the done items' share of the total weight. */
  score?: number;
  /** Default `"Listing quality"`. */
  title?: string;
  /** The line under the title. Default by score: under 50 `"Needs work"`, under 80 `"Good"`, else `"Excellent"`. */
  summary?: string;
  /** Short advice drawn in a tips box under the checklist. */
  tips?: ReadonlyArray<string>;
  /** Default `"Tips"`. */
  tipsTitle?: string;
  /** The ring's centre text. Default `` score => `${score}` ``. */
  formatScore?: (score: number) => string;
  /** Names the ring. Default `"Listing quality score"`. */
  accessibilityLabel?: string;
  /** The done/not-done words added to each row's name. Default `"Done"` / `"To do"`. */
  doneLabel?: string;
  todoLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  ListingPreviewPane
// ---------------------------------------------------------------------------

export type ListingPreviewMode = 'card' | 'page';

/** The listing as the preview draws it: `ListingCard`'s data, without its handlers. */
export type ListingPreviewData = Omit<
  ListingCardProps,
  'onPress' | 'href' | 'onFavoriteChange' | 'favorite' | 'onPhotoIndexChange' | 'style' | 'testID' | 'layout'
> & {
  /** The page preview's description paragraph. */
  description?: string;
  /** The page preview's location line. */
  location?: string;
};

export interface ListingPreviewPaneProps {
  listing: ListingPreviewData;
  /** Controlled mode. */
  mode?: ListingPreviewMode;
  /** Uncontrolled starting mode. Default `card`. */
  defaultMode?: ListingPreviewMode;
  onModeChange?: (mode: ListingPreviewMode) => void;
  /** Replaces the built-in page preview. */
  renderPage?: (listing: ListingPreviewData) => ReactNode;
  /** Default `"Preview"`. */
  title?: string;
  /** The line under the title. Default `"This is how guests will see your listing."`. */
  description?: string;
  /** The toggle's words. Default `"Card"` / `"Page"`. */
  cardLabel?: string;
  pageLabel?: string;
  /** Names the toggle. Default `"Preview as"`. */
  toggleLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
