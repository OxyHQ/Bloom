import { createContext } from 'react';

import type { IconComponent } from '../node';

/**
 * The app's prominent action, its glyph and its name: a destination (a page
 * of the pager, by its name) or what a press does.
 */
export interface PrimaryDestination {
  readonly icon: IconComponent;
  readonly label: string;
  readonly action: string | (() => void);
}

/** What pressing the primary action does: its handler, or showing its destination. */
export function primaryPress(
  primary: PrimaryDestination,
  select: (name: string) => void,
): () => void {
  const { action } = primary;
  return typeof action === 'string' ? () => select(action) : action;
}

/**
 * The `AppLayout`'s primary action, for the tabs it holds: on iOS the system
 * tab bar draws that destination's tab on its own surface.
 */
export const PrimaryDestinationContext = createContext<PrimaryDestination | null>(null);
PrimaryDestinationContext.displayName = 'BloomPrimaryDestination';
