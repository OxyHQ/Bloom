import { defineMessages, type MessageCatalog } from '../locale/messages';

/**
 * Every fixed string the map-attribution family announces, in each Bloom
 * language. The credit and every reading are the app's; a caller's
 * `scaleLabel`/`accessibilityLabel` still wins.
 */
export interface MapAttributionMessages {
  /** The word before the readings in the scale's announcement. */
  scale: string;
  /** Names `MapAttribution`'s strip. */
  mapData: string;
}

export const MAP_ATTRIBUTION_MESSAGES: MessageCatalog<MapAttributionMessages> = defineMessages<MapAttributionMessages>('MAP_ATTRIBUTION_MESSAGES', { scale: 'Scale', mapData: 'Map data' });
