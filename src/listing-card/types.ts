import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

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
   * The stay's URL. On web the card is a real `<a href>` (open in a new tab,
   * copy link); with `onPress` too the default navigation is prevented so a
   * router can take it. On native the card opens it with `Linking` when there is
   * no `onPress`.
   */
  href?: string;
  /** Draws a skeleton in the same geometry instead of the stay. */
  loading?: boolean;
  /** Default `vertical`. */
  layout?: ListingCardLayout;
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
  /** Replaces the composed name ("Coast weekends, 12 saved"). */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
