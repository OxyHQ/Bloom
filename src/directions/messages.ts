import { defineMessages, type MessageCatalog } from '../locale/messages';
import type { DirectionsManeuver, DirectionsMode, DirectionsTraffic } from './types';

/**
 * Every fixed string the directions family draws or announces, in each Bloom
 * language. A caller's `labels`/`*Label` props still win, one key at a time.
 */
export interface DirectionsMessages {
  /** The mode words — the switcher, and the quiet label over the figure. */
  modes: Readonly<Record<DirectionsMode, string>>;
  /** The traffic badge. */
  traffic: Readonly<Record<DirectionsTraffic, string>>;
  /**
   * The word each maneuver is announced with, written to START a sentence
   * (`NavigationBanner` lowercases it after its "then").
   */
  maneuvers: Readonly<Record<DirectionsManeuver, string>>;
  /** Names `DirectionsSummary` and `DirectionsSteps`. */
  directions: string;
  otherRoutes: string;
  /** Names the mode switcher. */
  travelMode: string;
  /** The primary action. */
  start: string;
  /** Added to the current step's announced name. */
  currentStep: string;
  /** Names a transit badge: "Line L4". */
  line: (name: string) => string;
}

export const DIRECTIONS_MESSAGES: MessageCatalog<DirectionsMessages> =
  defineMessages<DirectionsMessages>('DIRECTIONS_MESSAGES', {
    modes: { drive: 'Drive', transit: 'Transit', walk: 'Walk', cycle: 'Cycle' },
    traffic: { light: 'Light traffic', moderate: 'Moderate traffic', heavy: 'Heavy traffic' },
    maneuvers: {
      depart: 'Depart',
      straight: 'Continue straight',
      'slight-left': 'Slight left',
      left: 'Turn left',
      'sharp-left': 'Sharp left',
      'slight-right': 'Slight right',
      right: 'Turn right',
      'sharp-right': 'Sharp right',
      uturn: 'Make a U-turn',
      roundabout: 'At the roundabout',
      merge: 'Merge',
      arrive: 'Arrive',
      board: 'Board',
      alight: 'Get off',
      transfer: 'Change',
      walk: 'Walk',
    },
    directions: 'Directions',
    otherRoutes: 'Other routes',
    travelMode: 'Travel mode',
    start: 'Start',
    currentStep: 'Current step',
    line: (name) => `Line ${name}`,
  });
