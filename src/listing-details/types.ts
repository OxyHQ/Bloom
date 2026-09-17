import type { ComponentType, ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { BloomIconComponent } from '../icons/icon-component';

/**
 * An icon COMPONENT (`RiWifiLine`, not `<RiWifiLine />`). The part sizes and
 * colours it, so a caller cannot pass the wrong size or a colour that ignores
 * the theme.
 */
/** @deprecated Use `BloomIconComponent` from `@oxy.so/bloom/icons`; this is an alias of it. */
export type ListingIcon = BloomIconComponent;

// ---------------------------------------------------------------------------
//  ListingPhotoGrid
// ---------------------------------------------------------------------------

export interface ListingPhoto {
  /** A URL, or an image id handed to the app's `ImageResolver`. */
  source: string;
  /** What the photo shows. Names the photo's button ("Living room, photo 1 of 24"). */
  alt?: string;
}

/** `auto` measures the grid's own width: `carousel` below 744, `grid` from 744. */
export type ListingPhotoGridLayout = 'auto' | 'grid' | 'carousel';

export interface ListingPhotoGridProps {
  photos: readonly ListingPhoto[];
  /** Pressed photo, by its index in `photos`. */
  onPressPhoto?: (index: number) => void;
  /** Draws the "Show all photos" button (grid layout) when set. */
  onShowAll?: () => void;
  /** Default `"Show all photos"`. */
  showAllLabel?: string;
  /** Default `auto`. */
  layout?: ListingPhotoGridLayout;
  /** Grid width / height. Default `2`. */
  aspectRatio?: number;
  /** Carousel slide width / height. Default `4 / 3`. */
  carouselAspectRatio?: number;
  /** Names the photos region. Default `"Listing photos"`. */
  accessibilityLabel?: string;
  /** Default `(n, total) => \`${n} / ${total}\``, the carousel's counter pill. */
  formatCounter?: (position: number, total: number) => string;
  /** A photo's accessible name. Default `"<alt>, photo 3 of 24"` (or `"Photo 3 of 24"`). */
  photoLabel?: (photo: ListingPhoto, position: number, total: number) => string;
  /** Rendition forwarded to the `ImageResolver` for an id `source`. Default `"large"`. */
  imageVariant?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  ListingHeader
// ---------------------------------------------------------------------------

export type ListingHeaderSize = 'large' | 'medium';

export interface ListingHeaderProps {
  title: string;
  /** Default `large` (title-1); `medium` is title-2. */
  size?: ListingHeaderSize;
  /** The heading level announced on web. Default `1`. */
  headingLevel?: number;
  /** One string, or parts joined with " · " ("Entire rental unit in Porto", "4 guests"). */
  subtitle?: string | readonly string[];
  /** The rating on a 5 scale; `null` draws `Rating`'s "New". Omitted: no rating in the meta row. */
  rating?: number | string | null;
  /** Drawn as a link after the rating ("128 reviews"). */
  reviewsLabel?: string;
  onPressReviews?: () => void;
  /** Drawn as a link at the end of the meta row ("Porto, Portugal"). */
  location?: string;
  onPressLocation?: () => void;
  /** Extra node at the start of the meta row, e.g. a `Badge`. */
  badge?: ReactNode;
  /** Right of the title on wide screens, under the meta row on narrow ones. Use `ListingHeaderAction`s. */
  actions?: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface ListingHeaderActionProps {
  label: string;
  icon?: ListingIcon;
  onPress?: () => void;
  /** A toggled action ("Saved"): `aria-pressed` on web, `selected` on native. */
  pressed?: boolean;
  /** Overrides `label` as the accessible name. */
  accessibilityLabel?: string;
  /** Draws the icon only (a narrow header); `label` still names it. */
  iconOnly?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  ListingHighlights
// ---------------------------------------------------------------------------

export interface ListingHighlight {
  icon: ListingIcon;
  title: string;
  description?: string;
}

export interface ListingHighlightsProps {
  items: readonly ListingHighlight[];
  /** Icon size, 24–32. Default `28`. */
  iconSize?: 24 | 28 | 32;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  AmenityList
// ---------------------------------------------------------------------------

export interface Amenity {
  label: string;
  icon?: ListingIcon;
  /** A second line ("Available in the building"). */
  description?: string;
  /** `false` strikes the label through and mutes the icon. Default `true`. */
  available?: boolean;
}

export interface AmenityListProps {
  items: readonly Amenity[];
  /** `auto` (default) is 2 columns from 560 wide, 1 below. */
  columns?: 1 | 2 | 'auto';
  /** Draw only the first `limit` items. */
  limit?: number;
  /** Draws the "Show all" button when set and some items are hidden, or `total` exceeds the drawn count. */
  onShowAll?: () => void;
  /** The full amenity count for the button, when `items` is already a subset. Default `items.length`. */
  total?: number;
  /** Default `(n) => \`Show all ${n} amenities\``. */
  showAllLabel?: (total: number) => string;
  /** Prefixed to an unavailable amenity's accessible name. Default `"Unavailable"`. */
  unavailableLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  HostCard
// ---------------------------------------------------------------------------

export interface HostStat {
  /** Pre-formatted ("214", "4.92", "7"). */
  value: string;
  /** "Reviews", "Rating", "Years hosting". */
  label: string;
  /** Draws a small star after the value. */
  star?: boolean;
}

export interface HostDetail {
  icon: ListingIcon;
  text: string;
}

export interface HostCardProps {
  name: string;
  /** A URL or an `ImageResolver` id. */
  avatar?: string;
  /** Draws the check badge on the avatar. */
  verified?: boolean;
  /** The badge's accessible name. Default `"Verified"`. */
  verifiedLabel?: string;
  /** A short label under the name ("Top host"). */
  label?: string;
  labelIcon?: ListingIcon;
  /** The column on the card's right, separated by hairlines. */
  stats?: readonly HostStat[];
  /** Lines with icons under the card ("Speaks English and Portuguese"). */
  details?: readonly HostDetail[];
  /** Plain lines ("Response rate: 100%", "Responds within an hour"). */
  responseLines?: readonly string[];
  /** Draws the message button when set. */
  onMessage?: () => void;
  /** Default `"Message host"`. */
  messageLabel?: string;
  /** Makes the card pressable. */
  onPressProfile?: () => void;
  /** Rendition forwarded to the `ImageResolver`. Default `"medium"`. */
  avatarVariant?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  ReviewSummary
// ---------------------------------------------------------------------------

export interface ReviewCategory {
  label: string;
  /** 0..5. */
  value: number;
  /** Default `value.toFixed(1)`. */
  display?: string;
  icon?: ListingIcon;
}

export interface ReviewDistributionRow {
  /** "5", "4" … */
  label: string;
  /** Share of reviews, 0..1. */
  value: number;
  /** Text on the right, e.g. "86%". */
  display?: string;
}

export interface ReviewSummaryProps {
  /** The overall rating; a number is drawn with `Rating`'s formatting (4.92, 5.0). */
  rating: number | string;
  /** A line beside the number ("Loved by guests"). */
  title?: string;
  /** A second line ("128 reviews"). */
  description?: string;
  categories?: readonly ReviewCategory[];
  distribution?: readonly ReviewDistributionRow[];
  /** The distribution's heading. Default `"Overall rating"`. */
  distributionLabel?: string;
  /** Overrides the composed name of the big number ("Rated 4.92 out of 5"). */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  ReviewCard
// ---------------------------------------------------------------------------

export interface ReviewHostResponse {
  /** "Response from Marta". */
  title: string;
  date?: string;
  text: string;
}

export interface ReviewCardProps {
  name: string;
  avatar?: string;
  /** "3 years on the platform", "Lisbon, Portugal". */
  subtitle?: string;
  /** 1..5, rounded to whole stars. */
  rating?: number;
  /** Pre-formatted ("March 2026", "2 weeks ago"). */
  date?: string;
  text: string;
  /** Clamp the text to this many lines until expanded. Default `4`; `0` never clamps. */
  numberOfLines?: number;
  /** Default `"Show more"`. */
  showMoreLabel?: string;
  /** Default `"Show less"`. */
  showLessLabel?: string;
  /** Controlled expansion. */
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  hostResponse?: ReviewHostResponse;
  avatarVariant?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  ListingSection
// ---------------------------------------------------------------------------

export type ListingSectionSize = 'medium' | 'small';

export interface ListingSectionProps {
  title?: string;
  subtitle?: string;
  /** `medium` (default) title-3; `small` headline. */
  size?: ListingSectionSize;
  /** Default `2`. */
  headingLevel?: number;
  /** Right of the title (a link, a button). */
  action?: ReactNode;
  /** The top hairline. Default `true`. */
  divider?: boolean;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  PropertyFacts
// ---------------------------------------------------------------------------

export interface PropertyFact {
  icon?: ListingIcon;
  /** "Built area", "Bedrooms", "Energy rating". */
  label: string;
  /** Pre-formatted ("96 m²", "3", "2nd of 5", "Yes"). */
  value: string;
}

export interface PropertyFactsProps {
  items: readonly PropertyFact[];
  /** `auto` (default): 2 below 480 wide, 3 from 480, 4 from 720. */
  columns?: 2 | 3 | 4 | 'auto';
  /** Draw only the first `limit` facts. */
  limit?: number;
  /** Draws "Show all" when set and some facts are hidden, or `total` exceeds the drawn count. */
  onShowAll?: () => void;
  /** The full fact count, when `items` is already a subset. Default `items.length`. */
  total?: number;
  /** Default `(n) => \`Show all ${n} features\``. */
  showAllLabel?: (total: number) => string;
  /** Names the list. Default `"Property features"`. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  ContactCard
// ---------------------------------------------------------------------------

/** Who the contact is to the listing. Picks the default role label and message label. */
export type ContactRole = 'host' | 'landlord' | 'agent' | 'agency';

export interface ContactCardProps extends Omit<HostCardProps, 'messageLabel'> {
  /** Default `host`. */
  role?: ContactRole;
  /**
   * The line under the name when `label` is not set. Default: nothing for a
   * host (`HostCard`'s look), `"Landlord"`, `"Agent"`, `"Agency"` otherwise.
   */
  roleLabel?: string;
  /** The agency an agent works for ("Harbourline Homes"), drawn with `logo`. */
  agency?: string;
  /**
   * The agency's logo: a URL / `ImageResolver` id drawn in a 40px rounded
   * tile, or any node. For `role="agency"` without an `avatar` it also
   * replaces the avatar.
   */
  logo?: string | ReactNode;
  /** "Usually responds within an hour" — a row with a clock. */
  responseTime?: string;
  /** Active listings, counted ("12 active listings"). */
  activeListings?: number;
  /** Default `(n) => n === 1 ? '1 active listing' : \`${n} active listings\``. */
  activeListingsLabel?: (count: number) => string;
  /** Pressing the active-listings row (open the contact's other listings). */
  onPressListings?: () => void;
  /** The phone number, pre-formatted. Hidden behind "Show phone" until revealed. */
  phone?: string;
  /** Controlled reveal. */
  phoneRevealed?: boolean;
  /** Called with `true` when "Show phone" is pressed (log the lead). */
  onPhoneRevealedChange?: (revealed: boolean) => void;
  /** Default `"Show phone"`. */
  showPhoneLabel?: string;
  /** Draws the "Call" button when set. */
  onCall?: () => void;
  /** Default `"Call"`. */
  callLabel?: string;
  /** Default `"Message"` (`"Message host"` for a host). */
  messageLabel?: string;
}

// ---------------------------------------------------------------------------
//  FloorPlan
// ---------------------------------------------------------------------------

export interface FloorPlanItem {
  /** A URL, or an image id handed to the app's `ImageResolver`. */
  source: string;
  /** "Ground floor", "Upper floor · 42 m²". Drawn under the tile. */
  label: string;
  /** A second line ("2 bedrooms, 1 bath"). */
  description?: string;
  /** What the plan shows, for a screen reader. Default `label`. */
  alt?: string;
}

export interface FloorPlanProps {
  plans: readonly FloorPlanItem[];
  /** Pressed plan, by index — open `ZoomableMediaGallery` here. Tiles are images without it. */
  onPressPlan?: (index: number) => void;
  /** `auto` (default): 1 below 560 wide, 2 from 560. A single plan always takes the full width. */
  columns?: 1 | 2 | 'auto';
  /** Tile width / height. Default `4 / 3`. */
  aspectRatio?: number;
  /** A tile's accessible name. Default `"<alt>, floor plan 1 of 2"`. */
  planLabel?: (plan: FloorPlanItem, position: number, total: number) => string;
  /** Rendition forwarded to the `ImageResolver` for an id `source`. Default `"large"`. */
  imageVariant?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
