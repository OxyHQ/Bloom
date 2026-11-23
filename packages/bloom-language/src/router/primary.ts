import { createContext } from 'react';

import type { IconComponent } from '../node';

/** The app's prominent action: a destination (a page of the pager), its glyph and its name. */
export interface PrimaryDestination {
  readonly icon: IconComponent;
  readonly label: string;
  readonly destination: string;
}

/**
 * The `AppLayout`'s primary action, for the tabs it holds: on iOS the system
 * tab bar draws that destination's tab on its own surface.
 */
export const PrimaryDestinationContext = createContext<PrimaryDestination | null>(null);
PrimaryDestinationContext.displayName = 'BloomPrimaryDestination';
