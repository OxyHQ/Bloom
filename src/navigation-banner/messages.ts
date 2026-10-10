import { defineMessages, type MessageCatalog } from '../locale/messages';
import { plural } from '../locale/plural';
import type { NavigationBannerState } from './types';
import { words } from './message-helpers';

/**
 * Every fixed string the navigation-banner family draws or announces, in each
 * Bloom language. The maneuver words are `directions`' (`DIRECTIONS_MESSAGES`);
 * a caller's `labels`/`*Label` props still win, one key at a time.
 */
export interface NavigationBannerMessages {
  /** The headline in each exceptional state. */
  states: Readonly<Record<Exclude<NavigationBannerState, 'guiding'>, string>>;
  /**
   * The line after the maneuver — "then turn left Carrer del Roure". `maneuver`
   * is the next maneuver's word, written to START a sentence; the language
   * cases it for the middle of one.
   */
  thenLine: (street: string | undefined, maneuver: string | undefined) => string;
  /** Names `LaneGuidance`. */
  laneGuidance: string;
  /** "4 lanes". */
  laneCount: (count: number) => string;
  /** "lane 3", counted from the left. */
  laneNumber: (position: number) => string;
  /** Joins two lanes: "lane 3 and lane 4". */
  and: (first: string, second: string) => string;
  /** "use lane 3 and lane 4". */
  useLanes: (lanes: string) => string;
  /** "Speed limit 50 km/h" — `limit` arrives with its unit. */
  speedLimit: (limit: string) => string;
  overLimit: string;
  /** `ArrivalBar`'s three captions and its ending action. */
  arrival: string;
  left: string;
  distance: string;
  end: string;
}

export const NAVIGATION_BANNER_MESSAGES: MessageCatalog<NavigationBannerMessages> =
  defineMessages<NavigationBannerMessages>('NAVIGATION_BANNER_MESSAGES', {
    states: { 'off-route': 'Off route', rerouting: 'Finding a new route' },
    thenLine: (street, maneuver) => words('then', maneuver?.toLowerCase(), street),
    laneGuidance: 'Lane guidance',
    laneCount: (n) => plural('en', n, { one: '{n} lane', other: '{n} lanes' }),
    laneNumber: (n) => `lane ${n}`,
    and: (a, b) => `${a} and ${b}`,
    useLanes: (lanes) => `use ${lanes}`,
    speedLimit: (limit) => `Speed limit ${limit}`,
    overLimit: 'over the limit',
    arrival: 'Arrival',
    left: 'Left',
    distance: 'Distance',
    end: 'End',
  });
