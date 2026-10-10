import { defineMessages, type MessageCatalog } from '../locale/messages';
import type { RouteStopState } from './types';

/**
 * Every fixed string `RouteStops` draws or announces, in each Bloom language.
 * A caller's `labels`/`accessibilityLabel` still wins, one key at a time.
 */
export interface RouteStopsMessages {
  /** Names the list. */
  routeStops: string;
  origin: string;
  destination: string;
  /** A stop between origin and destination, by its 1-based position. */
  stop: (position: number) => string;
  swap: string;
  /** The add button's VISIBLE label. */
  addStop: string;
  /** Names a stop's remove control: "Remove Home". */
  removeStop: (title: string) => string;
  state: Record<RouteStopState, string>;
}

export const ROUTE_STOPS_MESSAGES: MessageCatalog<RouteStopsMessages> =
  defineMessages<RouteStopsMessages>('ROUTE_STOPS_MESSAGES', {
    routeStops: 'Route stops',
    origin: 'Origin',
    destination: 'Destination',
    stop: (position) => `Stop ${position}`,
    swap: 'Swap origin and destination',
    addStop: 'Add a stop',
    removeStop: (title) => `Remove ${title}`,
    state: { reached: 'Reached', current: 'Current stop', pending: 'Not reached' },
  });
