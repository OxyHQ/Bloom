import { defineMessages, type MessageCatalog } from '../locale/messages';
import { plural } from '../locale/plural';
import type { PlaceListLabels, PlaceListVisibility } from './types';

/**
 * Every fixed string the place-list family draws or announces, in each Bloom
 * language. A caller's `labels`/`*Label` props still win, one key at a time.
 */
export interface PlaceListMessages {
  /** The visibility badge. */
  visibility: Readonly<Record<PlaceListVisibility, string>>;
  /** "12 places". */
  places: (count: number) => string;
  /** "Shared with 3". */
  sharedWith: (count: number) => string;
  /** `PlaceList`'s controls, its note and its move announcement. */
  labels: PlaceListLabels;
  /** Names `PlaceList`. */
  savedPlaces: string;
}

export const PLACE_LIST_MESSAGES: MessageCatalog<PlaceListMessages> =
  defineMessages<PlaceListMessages>('PLACE_LIST_MESSAGES', {
    visibility: { private: 'Private', shared: 'Shared', public: 'Public' },
    places: (n) => plural('en', n, { one: '{n} place', other: '{n} places' }),
    sharedWith: (n) => `Shared with ${n}`,
    labels: {
      moveEarlier: (position) => `Move to position ${position - 1}`,
      moveLater: (position) => `Move to position ${position + 1}`,
      remove: (name) => `Remove ${name} from the list`,
      moved: (name, position, total) => `${name} moved to position ${position} of ${total}`,
      note: 'Note',
    },
    savedPlaces: 'Saved places',
  });
