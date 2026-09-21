import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { BloomIconComponent } from '../icons/icon-component';
import type { ListingFact } from '../listing-card/types';

/**
 * The two things a maps app does with one place, drawn by ONE component.
 *
 *   row      a result in a list over the map — a 112 thumbnail beside the text
 *   detail   the header of the sheet that opens when the result is picked — a
 *            cover photo, the name at title weight, the figure block and the
 *            actions
 *
 * They are one component because they carry the same facts in the same order.
 * A second component would be a second place for "a place is open until eight"
 * to be spelled, and the two spellings drift.
 */
export type PlaceCardDensity = 'row' | 'detail';

/**
 * Whether the place is open NOW — the one fact a reader looks for first.
 *
 * Four members rather than a boolean because "closes in fifteen minutes" is a
 * different answer from "open", and an app that can only say `true` says the
 * reassuring one. The word and the tone of each are in
 * {@link PLACE_OPEN_LABELS} and `OPEN_STATE_TONE`; the HOURS line beside it
 * ("Open until 20:00") is separate copy the app formats.
 */
export type PlaceOpenState = 'open' | 'closing-soon' | 'closed' | 'opening-soon';

/** One tile under the figure — "€€" over "Price", "318" over "Reviews". */
export interface PlaceStat {
  /** The reading, pre-formatted. */
  value: string;
  /** What it measures. */
  label: string;
}

/**
 * One thing you can do with a place. `Directions`, `Call`, `Save` and `Share`
 * are the four a maps app draws; the list is the app's, not Bloom's.
 */
export interface PlaceAction {
  /** Identifies the action; keys the button. */
  id: string;
  /** The VISIBLE word ("Directions"). */
  label: string;
  /** A glyph before the label, sized and coloured by the button. */
  icon?: BloomIconComponent;
  onPress?: () => void;
  /**
   * The action's URL. On web it renders a real anchor (`tel:`, a share link, a
   * route deep link), so middle-click and copy-link work.
   */
  href?: string;
  disabled?: boolean;
  /**
   * The announced name, when the label alone is not a sentence ("Call
   * Forner de la Plaça"). Defaults to `label`.
   */
  accessibilityLabel?: string;
}

export interface PlaceActionsProps {
  actions: readonly PlaceAction[];
  /** Default `small` — the rung `ai-profile-card` draws its header actions at. */
  size?: 'small' | 'medium';
  /** Names the row, which is a `group`. Default `"Actions"`. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** Each button gets `<testID>-<action id>`. */
  testID?: string;
}

export interface PlaceCardProps {
  /** The place's name ("Forner de la Plaça"). */
  name: string;
  /** What it is, pre-formatted and short ("Bakery · €€"). */
  category?: string;
  /**
   * The photo — an absolute URL, or an id the app's `ImageResolver` turns into
   * one. `row` crops it square; `detail` uses it as the cover.
   */
  photo?: string;
  /** The `ImageResolver` rendition for a photo id. Ignored for URLs. */
  photoVariant?: string;
  /**
   * The rating on a 5 scale, drawn by Bloom's `Rating` beside the name.
   * `undefined` draws nothing; `null` or `''` draws the "New" label.
   */
  rating?: number | string | null;
  /** The review count, after the rating ("(318)"). */
  reviewCount?: number | string;
  /** The "New" label of an unrated place. Default `"New"`. */
  newLabel?: string;
  /** Whether the place is open now. Without it no state pill is drawn. */
  openState?: PlaceOpenState;
  /** Replaces the English state word ("Open", "Closing soon", …). */
  openLabel?: string;
  /** The hours line, pre-formatted ("Open until 20:00", "Opens 08:00 tomorrow"). */
  hours?: string;
  /** The street line, drawn with a pin. */
  address?: string;
  /**
   * Compact facts with icons, one clipped row ("1.4 km", "12 min"). Same shape
   * and same part as `ListingCard`'s.
   */
  facts?: ReadonlyArray<ListingFact>;
  /**
   * The FIGURE — the one reading the header leads with, usually the time to
   * get there ("12 min"). Drawn tabular at title-1. `detail` only.
   */
  figure?: string;
  /** The quiet label over the figure ("Drive from you"). `detail` only. */
  figureLabel?: string;
  /** A chip after the figure ("1.4 km"). `detail` only. */
  figureDetail?: string;
  /** Tiles under the figure. `detail` only. */
  stats?: readonly PlaceStat[];
  /**
   * The slot above the name. A string draws a neutral `Badge`; any other node
   * is placed as given.
   */
  badge?: ReactNode;
  /** The actions. `detail` draws them under the figure block; `row` under the row. */
  actions?: readonly PlaceAction[];
  /** Whether the place is saved. Omit `onFavoriteChange` too to hide the heart. */
  favorite?: boolean;
  /** Called with the next saved state. The heart is drawn only when this is given. */
  onFavoriteChange?: (favorite: boolean) => void;
  /** Names of the heart, passed to `FavoriteButton`. */
  saveLabel?: string;
  removeLabel?: string;
  /** Opens the place. `row` only — a detail header is already the thing it opens. */
  onPress?: () => void;
  /**
   * The place's URL. On web the row is a real `<a href>`; on native a press
   * opens it with `Linking` when there is no `onPress`. `row` only.
   */
  href?: string;
  /** Draws a skeleton in the same geometry instead of the place. */
  loading?: boolean;
  /** Default `row`. */
  density?: PlaceCardDensity;
  /**
   * Replaces the composed accessible name ("Forner de la Plaça, Bakery · €€,
   * Open, Open until 20:00, …"), which is English.
   */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** Parts get `<testID>-photo`, `-name`, `-state`, `-hours`, `-figure`, `-actions`. */
  testID?: string;
}
