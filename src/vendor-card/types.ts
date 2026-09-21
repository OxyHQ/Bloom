import type { StyleProp, ViewStyle } from 'react-native';

import type { AccentTone } from '../theme/accent-colors';

/**
 * Whether you can order from this vendor right now.
 *
 * `open` draws nothing at all. `paused` is a vendor that is open but has
 * stopped taking orders for a while (a kitchen that is under water); `closed`
 * is outside its hours. Both wash the cover toward the page and draw a status
 * pill, because the difference the reader acts on is "not now", and the two
 * words are what say which kind of "not now" it is.
 */
export type VendorAvailability = 'open' | 'paused' | 'closed';

/**
 * `comfortable` is the wide card that sits in a shelf of vendors; `compact` is
 * the dense row a search result is drawn as. ONE component, because the DATA is
 * the same and a screen that switches at a breakpoint must not switch
 * components.
 */
export type VendorCardDensity = 'comfortable' | 'compact';

/**
 * The four readings a vendor card can carry, in the order it draws them. Each
 * arrives PRE-FORMATTED — "25–35 min", "€1.90", "Free", "1.2 km", "€12" — and
 * nothing here parses, converts or adds up any of them.
 */
export type VendorFactKey = 'deliveryTime' | 'deliveryFee' | 'distance' | 'minimumOrder';

export interface VendorCardProps {
  /** The vendor's name. One line, truncated. */
  name: string;
  /**
   * The cover: an absolute URL, or an id the app's `ImageResolver` turns into
   * one (resolved with `photoVariant`). One picture — a vendor is not a gallery.
   */
  photo?: string;
  /** The `ImageResolver` rendition for a photo id (e.g. `'medium'`). Ignored for URLs. */
  photoVariant?: string;
  /**
   * What the vendor cooks or sells — "Japanese", "Sushi", "Poke". Drawn as a
   * clipped row of pills under the name; the ones that do not fit drop out
   * whole rather than being cut in half, and the card's accessible name still
   * carries every one of them.
   */
  cuisines?: ReadonlyArray<string>;
  /**
   * The rating on a 5 scale, drawn by Bloom's `Rating` right of the name.
   * `undefined` draws nothing; `null` or `''` draws the "New" label.
   */
  rating?: number | string | null;
  /** The review count, drawn after the rating ("(128)"). */
  reviewCount?: number | string;
  /** The "New" label of an unrated vendor. Default `"New"`. */
  newLabel?: string;
  /** Pre-formatted — "25–35 min". */
  deliveryTime?: string;
  /** Pre-formatted — "€1.90", "Free". */
  deliveryFee?: string;
  /** Pre-formatted — "1.2 km". */
  distance?: string;
  /** Pre-formatted — "€12". */
  minimumOrder?: string;
  /**
   * The WORD said before each reading in the card's accessible name —
   * "Delivery time 25–35 min". Defaults are English ("Delivery time",
   * "Delivery", "Distance", "Minimum order"); a bare "25–35 min" beside a glyph
   * means nothing read aloud, and the glyph is not announced.
   */
  factLabels?: Partial<Record<VendorFactKey, string>>;
  /** The promotion, pre-formatted and short — "2 for 1", "−20% today". */
  promo?: string;
  /** The promo mark's tone. Default `success`, the tone `price-breakdown` gives money coming back. */
  promoTone?: AccentTone;
  /** Default `open`. */
  availability?: VendorAvailability;
  /** Replaces the English status label ("Paused", "Closed"). */
  availabilityLabel?: string;
  /**
   * When the vendor takes orders again, PRE-FORMATTED by the app — "Opens at
   * 19:00", "Opens tomorrow at 12:00". Drawn under the name while the vendor is
   * not open, and ignored while it is: a line that said when an open shop opens
   * is noise.
   */
  opensAt?: string;
  /** Whether the vendor is saved. Omit `onFavoriteChange` too to hide the heart. */
  favorite?: boolean;
  /** Called with the next saved state. The heart is drawn only when this is given. */
  onFavoriteChange?: (favorite: boolean) => void;
  /** Names of the heart, passed to `FavoriteButton`. */
  saveLabel?: string;
  removeLabel?: string;
  /** Called when the card is pressed. */
  onPress?: () => void;
  /**
   * The vendor's URL. On web the card is a real `<a href>` (open in a new tab,
   * copy link); with `onPress` too the default navigation is prevented so a
   * router can take it. On native the card opens it with `Linking` when there is
   * no `onPress`.
   */
  href?: string;
  /** Draws a skeleton in the same geometry instead of the vendor. */
  loading?: boolean;
  /** Default `comfortable`. */
  density?: VendorCardDensity;
  /**
   * Replaces the composed accessible name ("Fig & Ember, Closed, Japanese,
   * Sushi, Rated 4.8 out of 5, 214 reviews, Delivery time 25–35 min"), which is
   * English.
   */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
