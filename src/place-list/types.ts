import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { AvatarGroupItem } from '../avatar-group/types';
import type { BloomIconComponent } from '../icons/icon-component';
import type { PlaceCardProps } from '../place-card/types';

/**
 * Who can see a saved list. Three members because the middle one is the
 * interesting case: a list that is not private is usually shared with NAMED
 * people rather than published, and an app that can only say public/private
 * has to lie about the common one.
 */
export type PlaceListVisibility = 'private' | 'shared' | 'public';

export interface PlaceListCardProps {
  /** The list's name ("Want to go", "Coffee, ranked"). */
  name: string;
  /** How many places are in it. Drawn through `countLabel`. */
  count?: number;
  /** Default `(n) => n === 1 ? '1 place' : \`${n} places\``. */
  countLabel?: (count: number) => string;
  /**
   * The cover strip: the first four places' photos, each an absolute URL or an
   * id the app's `ImageResolver` turns into one. The first one is wide.
   */
  photos?: readonly string[];
  /** The `ImageResolver` rendition for a photo id. Ignored for URLs. */
  photoVariant?: string;
  /** What to draw on the strip when the list has no photos yet. */
  empty?: ReactNode;
  /**
   * The list's own glyph, beside the name. DECORATIVE — a glyph put in the
   * `name` string is read out as its character and cannot be coloured.
   */
  icon?: BloomIconComponent;
  /**
   * The person's colour for this list. It paints the glyph and tints the empty
   * strip. It is the caller's colour and not a token, because a list's colour
   * is a choice Bloom has no ramp for.
   */
  color?: string;
  /** Default `private`. */
  visibility?: PlaceListVisibility;
  /** Replaces the English visibility word. */
  visibilityLabel?: string;
  /** The people it is shared with, as `AvatarGroup` items. */
  collaborators?: readonly AvatarGroupItem[];
  /** Default `(n) => \`Shared with ${n}\``. Announced, and drawn when there is room. */
  sharedWithLabel?: (count: number) => string;
  /** Opens the list. */
  onPress?: () => void;
  /** Replaces the composed name ("Want to go, 12 places, shared with 3"). */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** Parts get `<testID>-cover`, `-name`, `-meta`, `-people`. */
  testID?: string;
}

/** One place inside a saved list: the place, plus what the person said about it. */
export interface PlaceListPlace {
  /** Identifies the entry. Reordering, removing and keying all use it. */
  id: string;
  /**
   * The place itself, drawn by `PlaceCard` at `density="row"` — the same row a
   * search result is, because a saved place and a found place are the same
   * object. `density`, `style` and `testID` are the list's to set.
   */
  place: Omit<PlaceCardProps, 'density' | 'style' | 'testID'>;
  /** The person's own line about it ("Get the sourdough before noon"). */
  note?: string;
}

/** Every word `PlaceList` speaks that is not in the data. */
export interface PlaceListLabels {
  /** Default `` (position) => `Move to position ${position - 1}` ``. */
  moveEarlier: (position: number) => string;
  /** Default `` (position) => `Move to position ${position + 1}` ``. */
  moveLater: (position: number) => string;
  /** Default `` (name) => `Remove ${name} from the list` ``. */
  remove: (name: string) => string;
  /** Announced politely after a move. Default `` (name, position, total) => `${name} moved to position ${position} of ${total}` ``. */
  moved: (name: string, position: number, total: number) => string;
  /** Names a place's note for a screen reader. Default `"Note"`. */
  note: string;
}

export interface PlaceListProps {
  places: readonly PlaceListPlace[];
  /**
   * Called with the WHOLE list in its new order. Setting it draws the move
   * controls; without it the list is not reorderable.
   */
  onReorder?: (places: PlaceListPlace[]) => void;
  /** Called with the entry's id. Setting it draws the remove control. */
  onRemove?: (id: string) => void;
  /** Stops reordering and removing, without hiding the controls. */
  disabled?: boolean;
  labels?: Partial<PlaceListLabels>;
  /** Drawn instead of the list when there are no places. */
  empty?: ReactNode;
  /** Names the list. Default `"Saved places"`. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** Parts get `<testID>-item-<n>`, `-item-<n>-up`, `-down`, `-remove`, `-status`. */
  testID?: string;
}
