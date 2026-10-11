import { defineMessages, type MessageCatalog } from '../locale/messages';
import type { LocationPuckState } from './types';

/**
 * What `LocationPuck` announces in place of a coloured dot, in each Bloom
 * language. A caller's `stateLabels`/`accessibilityLabel` still wins.
 */
export interface LocationPuckMessages {
  states: Readonly<Record<LocationPuckState, string>>;
  /** "Your location, facing 90 degrees" — the state words, then the bearing. */
  facing: (state: string, degrees: number) => string;
}

export const LOCATION_PUCK_MESSAGES: MessageCatalog<LocationPuckMessages> =
  defineMessages<LocationPuckMessages>('LOCATION_PUCK_MESSAGES', {
    states: {
      locating: 'Finding your location',
      located: 'Your location',
      stale: 'Your last known location',
    },
    facing: (state, degrees) => `${state}, facing ${degrees} degrees`,
  });
