import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { BloomIconComponent } from '../icons/icon-component';

/**
 * WHERE THIS ADDRESS CAME FROM — data, not three components.
 *
 * It chooses the default glyph and nothing else: a saved place, one the user
 * used recently, one a search offered, or a plain place with no provenance. An
 * app that wants a different glyph passes `icon`; an app whose flavours are not
 * these three passes `icon` too, rather than asking for a fourth member.
 */
export type AddressKind = 'place' | 'saved' | 'recent' | 'suggestion';

export type AddressDensity = 'comfortable' | 'compact';

export interface AddressRowProps {
  /** The line a reader identifies the place by — "Home", "Carrer de l’Om 14". */
  title: string;
  /** The rest of it — "Carrer de l’Om 14, Barcelona", "2nd floor, ring twice". */
  subtitle?: string;
  /** Chooses the default glyph. Default `place`. */
  kind?: AddressKind;
  /** The glyph, overriding whatever `kind` would have chosen. */
  icon?: BloomIconComponent;
  /**
   * An arbitrary leading node — an `Avatar`, a map thumbnail — instead of the
   * glyph tile. Read for PRESENCE: `leading={null}` draws NO media at all, for a
   * row in a list that already has a gutter of its own (`RouteStops`).
   */
  leading?: ReactNode;
  /** A short trailing reading — "1.2 km", "12 min". Drawn before `action`. */
  meta?: string;
  /** A node after the title — a `Badge` ("Default"), a `Chip`. */
  badge?: ReactNode;
  /** A trailing control — a `GlyphButton`, a `Button`. */
  action?: ReactNode;
  /** Highlights the row and announces the selection, for the role it is given. */
  selected?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  /** Default `comfortable`. */
  density?: AddressDensity;
  /**
   * What the row IS in the tree around it. `AddressList` passes this; a row
   * placed on its own leaves it alone and gets a plain pressable row.
   */
  role?: 'radio' | 'option' | 'listitem';
  /**
   * The announced name. Defaults to the title, subtitle and meta joined — the
   * row's own text, in reading order, as one utterance.
   */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** One entry of an `AddressList`. */
export interface AddressListEntry extends Omit<AddressRowProps, 'onPress' | 'selected' | 'role'> {
  /** Identifies the entry to `onSelect` and `selectedId`. */
  id: string;
}

export interface AddressListSection {
  /** Stable key. Defaults to the index. */
  id?: string;
  /** "Saved", "Recent", "Results". A section with no title draws no header. */
  title?: string;
  entries: readonly AddressListEntry[];
}

/**
 * `list` is a list of places a reader is reading; `picker` is a list they are
 * choosing ONE of. The difference is the announced tree — a `radiogroup` of
 * `radio`s against a `list` of `listitem`s — which is why it is a variant and
 * not a styling prop.
 */
export type AddressListVariant = 'list' | 'picker';

export interface AddressListProps {
  sections: readonly AddressListSection[];
  /** The chosen entry's `id`. Only meaningful for `variant="picker"`. */
  selectedId?: string;
  onSelect?: (id: string) => void;
  /** Default `list`. */
  variant?: AddressListVariant;
  /** Default `comfortable`. */
  density?: AddressDensity;
  /** Draws placeholder rows instead of the sections. */
  loading?: boolean;
  /** How many placeholder rows. Default 3. */
  loadingRows?: number;
  /** Replaces the whole empty block. */
  empty?: ReactNode;
  /** Default `"Nothing here yet"`. */
  emptyTitle?: string;
  emptyDescription?: string;
  /** The glyph above the empty text. Default a map pin. */
  emptyIcon?: BloomIconComponent;
  /** Names the list. Default `"Addresses"`. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
