import type { StyleProp, ViewStyle } from 'react-native';

import type { ListingFact, ListingPriceLine, Offering } from '../listing-card/types';

/**
 * `default` at rest; `active` for the marker whose listing is open (inverted
 * and raised); `visited` for one already opened (muted).
 */
export type MapMarkerState = 'default' | 'active' | 'visited';

/** `default` is 28 tall; `compact` is 22 tall, for a dense map. */
export type MapPriceMarkerSize = 'default' | 'compact';

export interface MapPriceMarkerProps {
  /**
   * The price as drawn, pre-formatted and SHORT — the app abbreviates it
   * ("€120", "€950/mo", "€240K", "€1.2M"); the pill never truncates.
   */
  price: string;
  /** Default `default`. */
  state?: MapMarkerState;
  /** Default `default`. */
  size?: MapPriceMarkerSize;
  /** Draws a small heart before the price. */
  saved?: boolean;
  onPress?: () => void;
  /**
   * The marker's accessible name — a sentence, since the pill only shows a
   * number ("€120 per night, Lisbon"). Defaults to `price`.
   */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface MapClusterMarkerProps {
  /** How many listings the bubble stands for; a string is drawn as given ("99+"). */
  count: number | string;
  /** `visited` draws as `default`. Default `default`. */
  state?: MapMarkerState;
  onPress?: () => void;
  /** Defaults to `"<count> stays"` — pass a translated sentence. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** `vertical` puts the photo on top (327 wide); `compact` puts it on the left. */
export type MapListingPreviewLayout = 'vertical' | 'compact';

export interface MapListingPreviewProps {
  /** The photo: a URL, or an id the app's `ImageResolver` turns into one. */
  image?: string;
  /** The variant handed to the `ImageResolver` with an id. */
  imageVariant?: string;
  title: string;
  /** Handed to `Rating` (`null` draws "New"); omit to hide the rating. */
  rating?: number | string | null;
  reviewCount?: number | string;
  /** The secondary line ("Entire cabin · 2 beds"). */
  subtitle?: string;
  /** Pre-formatted ("€120"). Optional when `priceLines` is given. */
  price?: string;
  /** Drawn after the price in secondary text ("night", "total"). */
  priceDetail?: string;
  /** A struck-through earlier price before `price` ("€150"). */
  originalPrice?: string;
  /**
   * Stacked price lines, as on `ListingCard` ("€950 / month"; "€240,000 ·
   * €3,200/m²"). Replaces `price`, `priceDetail` and `originalPrice`.
   */
  priceLines?: ReadonlyArray<ListingPriceLine>;
  /** The facts row, as on `ListingCard` (bed 3 · bath 2 · 110 m²). */
  facts?: ReadonlyArray<ListingFact>;
  /** Offering badges, a small tinted row above the title. */
  offerings?: ReadonlyArray<Offering>;
  /** Replaces the English offering labels. */
  offeringLabels?: Partial<Record<Offering, string>>;
  /** Whether the listing is saved. The heart shows only with `onFavoriteChange`. */
  favorite?: boolean;
  onFavoriteChange?: (favorite: boolean) => void;
  /** The close button shows only with this. */
  onClose?: () => void;
  /** Opens the listing — the whole card is the target. */
  onPress?: () => void;
  /** Default `vertical`. */
  layout?: MapListingPreviewLayout;
  /** Default `327`. */
  width?: number;
  /** Default `"Close"`. */
  closeLabel?: string;
  /** The heart's name; its pressed state says whether it is saved. Default `"Save"`. */
  favoriteLabel?: string;
  /** The card target's name. Defaults to `title`. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** Parts get `<testID>-open`, `-close`, `-favorite`, `-image`. */
  testID?: string;
}

export interface MapAreaCircleProps {
  /**
   * The circle's radius in PIXELS. The app computes it from its map projection
   * (metres at this latitude and zoom → pixels) and re-renders on zoom.
   */
  radius: number;
  /** A small pill at the centre ("Approximate area", "~500 m"). */
  label?: string;
  /**
   * The circle's name, which makes it an image to assistive technology
   * ("Approximate location, within 500 metres"). Without it the circle is
   * decorative and only its `label` is read.
   */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** Parts get `<testID>-fill`, `-label`. */
  testID?: string;
}

interface MapSearchAreaBase {
  /** Defaults to the variant's own sentence. */
  label?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface MapSearchAreaToggleProps extends MapSearchAreaBase {
  /** A checkbox pill, "Search as I move the map". */
  variant: 'toggle';
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export interface MapSearchAreaActionProps extends MapSearchAreaBase {
  /** A button pill, "Search this area". Default. */
  variant?: 'button';
  onPress?: () => void;
}

export type MapSearchAreaButtonProps = MapSearchAreaToggleProps | MapSearchAreaActionProps;
