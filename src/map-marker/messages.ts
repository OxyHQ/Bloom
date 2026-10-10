import { defineMessages, type MessageCatalog } from '../locale/messages';
import { countOf } from './message-helpers';

/**
 * Every fixed string the map-marker family draws or announces, in each Bloom
 * language. A caller's `label`/`accessibilityLabel` still wins.
 */
export interface MapMarkerMessages {
  /** `MapSearchAreaButton variant="toggle"`. */
  searchAsMapMoves: string;
  /** `MapSearchAreaButton`'s default button. */
  searchThisArea: string;
  /** Names a `MapClusterMarker`: "12 stays". */
  stays: (count: number | string) => string;
}

export const MAP_MARKER_MESSAGES: MessageCatalog<MapMarkerMessages> =
  defineMessages<MapMarkerMessages>('MAP_MARKER_MESSAGES', {
    searchAsMapMoves: 'Search as I move the map',
    searchThisArea: 'Search this area',
    stays: (n) => countOf('en', n, { one: '{n} stay', other: '{n} stays' }),
  });
