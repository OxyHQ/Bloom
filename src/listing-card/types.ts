import type { ComponentType, ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { BloomIconComponent } from '../icons/icon-component';

/**
 * How a home is offered. A listing may carry several at once (a flat for rent
 * AND for sale). A room, a house or a studio is the property's TYPE, not an
 * offering.
 *
 *   long_term_rent    a lease — "For rent"
 *   short_term_rent   nights or weeks — "Vacation rental"
 *   sale              "For sale"
 *   exchange          a home swap — "Swap"
 */
export type Offering = 'long_term_rent' | 'short_term_rent' | 'sale' | 'exchange';

/**
 * Where a listing stands. `available` draws nothing; every other status washes
 * the photo toward the page and draws a status pill.
 */
export type ListingStatus = 'available' | 'reserved' | 'sold' | 'rented' | 'unavailable';

/** `comfortable` is the full card; `compact` a dense list row with a small thumbnail. */
export type ListingCardDensity = 'comfortable' | 'compact';

/** One price, pre-formatted by the app. */
export interface ListingPriceLine {
  /** The amount, semibold ("€950", "€240,000"). */
  price: string;
  /** After the amount in regular weight ("/ month", "night"). */
  unit?: string;
  /** After the line in secondary text, past a middle dot ("€3,200/m²"). */
  secondary?: string;
  /** Struck through before the amount ("€1,050"). */
  originalPrice?: string;
}

/** An icon component a fact draws at 16px in the secondary text colour (`RiHotelBedLine`). */
/** @deprecated Use `BloomIconComponent` from `@oxy.so/bloom/icons`; this is an alias of it. */
export type ListingFactIcon = BloomIconComponent;

/** One compact fact about the home ("3" beside a bed, "110 m²"). */
export interface ListingFact {
  icon?: ListingFactIcon;
  /** As drawn, short ("3", "110 m²", "Floor 4"). */
  label: string;
  /**
   * The fact in words for the card's accessible name ("3 bedrooms") — a bare
   * "3" beside an icon means nothing read aloud. Defaults to `label`.
   */
  accessibilityLabel?: string;
}

/** `vertical` stacks the photo over the text (a results grid); `horizontal` puts a 40% photo left (a list, a map sheet). */
export type ListingCardLayout = 'vertical' | 'horizontal';

export interface ListingCardProps {
  /**
   * The photos, in order. Each is an absolute URL or an id the app's
   * `ImageResolver` turns into one (resolved with `photoVariant`). The first is
   * the cover; the card pages through the rest.
   */
  photos: ReadonlyArray<string>;
  /** The `ImageResolver` rendition for a photo id (e.g. `'medium'`). Ignored for URLs. */
  photoVariant?: string;
  /** The headline ("Lisbon, Portugal"). One line, truncated. */
  title: string;
  /** The first secondary line ("Hosted by Marta", "Sea view"). */
  subtitle?: string;
  /** The second secondary line ("12 – 17 Oct"). */
  dates?: string;
  /**
   * The rating on a 5 scale, drawn by Bloom's `Rating` right of the title.
   * `undefined` draws nothing; `null` or `''` draws the "New" label.
   */
  rating?: number | string | null;
  /** The review count, drawn after the rating ("(128)"). */
  reviewCount?: number | string;
  /** The "New" label of an unrated stay. Default `"New"`. */
  newLabel?: string;
  /**
   * The price lines, stacked ("€950 / month"; "€240,000 · €3,200/m²"). When
   * given it replaces `price`, `priceUnit` and `originalPrice`, which are its
   * single-line case.
   */
  priceLines?: ReadonlyArray<ListingPriceLine>;
  /** The pre-formatted price ("€120"), bold. */
  price?: string;
  /** The unit after the price ("night"). */
  priceUnit?: string;
  /** The pre-formatted price before a discount ("€150"), struck through before `price`. */
  originalPrice?: string;
  /**
   * A pre-formatted total ("€840 total"). Under the price line when `price` is
   * given; otherwise it IS the price line, bold.
   */
  total?: string;
  /**
   * Compact facts with icons, one row ("3 · 2 · 110 m² · Floor 4"). Facts that
   * do not fit are left out whole, never cut in half.
   */
  facts?: ReadonlyArray<ListingFact>;
  /**
   * How the home is offered. Drawn as `OfferingBadge`s in the top-left slot over
   * the photo (after `badge`); in the compact density, as a row above the title.
   */
  offerings?: ReadonlyArray<Offering>;
  /** Replaces the English offering labels ("For rent", …). */
  offeringLabels?: Partial<Record<Offering, string>>;
  /** The address or area line, with a pin ("Calle Mayor, Old Town"). */
  address?: string;
  /** Adds "Approximate location" to the address line — or is the line, without `address`. */
  approximateLocation?: boolean;
  /** Default `"Approximate location"`. */
  approximateLocationLabel?: string;
  /** Default `available`. Anything else washes the photo out and draws a status pill. */
  status?: ListingStatus;
  /** Replaces the English status label ("Reserved", "Sold", "Rented", "Unavailable"). */
  statusLabel?: string;
  /**
   * The top-left slot over the photo. A string draws Bloom's white pill
   * ("Guest favourite"); any other node is placed as given.
   */
  badge?: ReactNode;
  /** Whether the stay is saved. Omit `onFavoriteChange` too to hide the heart. */
  favorite?: boolean;
  /** Called with the next saved state. The heart is drawn only when this is given. */
  onFavoriteChange?: (favorite: boolean) => void;
  /** Called when the card is pressed. */
  onPress?: () => void;
  /**
   * A long press on the card — a shortcut to a sheet or a menu ("save to a
   * folder"). A long press has no keyboard equivalent and no name to announce,
   * so whatever it reaches must be reachable another way too.
   */
  onLongPress?: () => void;
  /**
   * Web only — right-click, the pointer's spelling of the same shortcut. The
   * event is defaulted for you, so the browser's own menu ("open in a new tab")
   * does not appear on the card while this is set. Same contract as
   * `MessageBubble`'s.
   */
  onContextMenu?: () => void;
  /**
   * Zooms the photo a little while the pointer is over the card (WEB ONLY —
   * there is no hover on a touch screen, and no reduced-motion-safe way to do
   * it on native). Default `false`. Skipped under
   * `prefers-reduced-motion: reduce`.
   */
  hoverZoom?: boolean;
  /**
   * The stay's URL. On web the card is a real `<a href>` (open in a new tab,
   * copy link); with `onPress` too the default navigation is prevented so a
   * router can take it. On native the card opens it with `Linking` when there is
   * no `onPress`.
   */
  href?: string;
  /** Draws a skeleton in the same geometry instead of the stay. */
  loading?: boolean;
  /** Default `vertical`. Ignored by the compact density. */
  layout?: ListingCardLayout;
  /** Default `comfortable`. `compact` is a dense list row: a 112 thumbnail beside the text. */
  density?: ListingCardDensity;
  /**
   * Replaces the composed accessible name ("Lisbon, Portugal, Guest favourite,
   * Rated 4.92 out of 5, €120 night"), which is English.
   */
  accessibilityLabel?: string;
  /** Default `"Previous photo"`. */
  previousPhotoLabel?: string;
  /** Default `"Next photo"`. */
  nextPhotoLabel?: string;
  /** Names of the heart, passed to `FavoriteButton`. */
  saveLabel?: string;
  removeLabel?: string;
  /** Called when the photo in view changes. */
  onPhotoIndexChange?: (index: number) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface FavoriteButtonProps {
  /** Whether the item is saved. */
  favorite: boolean;
  /** Called with the next saved state. */
  onFavoriteChange: (favorite: boolean) => void;
  /** Heart size in px. Default `24`; the touch target is at least 32. */
  size?: number;
  /** Name while not saved. Default `"Save to wishlist"`. */
  saveLabel?: string;
  /** Name while saved. Default `"Remove from wishlist"`. */
  removeLabel?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface ListingCardGridProps {
  /** The cards. Each child becomes one cell. */
  children: ReactNode;
  /**
   * A fixed column count. Without it the grid measures its OWN width:
   * 1 column below 640, 2 below 950, 3 below 1280, 4 from there.
   */
  columns?: number;
  /** Horizontal gap between cells. Default `24`. */
  columnGap?: number;
  /** Vertical gap between rows. Default `40`. */
  rowGap?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface WishlistCardProps {
  /** The collection's name ("Coast weekends"). */
  name: string;
  /** The line under the name, pre-formatted ("12 saved"). */
  description?: string;
  /**
   * Up to four cover photos (URLs or `ImageResolver` ids). One fills the tile;
   * two sit side by side; three put one tall photo left of two; four make a 2×2.
   */
  photos: ReadonlyArray<string>;
  /** The `ImageResolver` rendition for a photo id. */
  photoVariant?: string;
  onPress?: () => void;
  /** The collection's URL; a real `<a href>` on web, like `ListingCard`. */
  href?: string;
  /**
   * A glyph left of the name, 16px — what the collection IS ("Coast weekends"
   * beside a heart, "Viewings booked" beside a calendar). Decorative: the name
   * beside it is what a screen reader reads.
   */
  icon?: BloomIconComponent;
  /**
   * The `icon`'s colour, and the tint of the cover while the collection is
   * empty. Default: the secondary text colour, and the plain placeholder.
   */
  color?: string;
  /**
   * What the cover shows while `photos` is empty — a glyph, a line of text, an
   * "Add your first save" affordance. Without it an empty collection draws the
   * plain placeholder square it draws today.
   */
  empty?: ReactNode;
  /** Replaces the composed name ("Coast weekends, 12 saved"). */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
