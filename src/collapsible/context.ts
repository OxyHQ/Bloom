import { createContext, useContext } from 'react';

/** Logical visibility reaches portaled controls, unlike host-only inert/display. */
export const CollapsibleVisibilityContext = createContext(true);
CollapsibleVisibilityContext.displayName = 'CollapsibleVisibility';
export function useCollapsibleVisibility() {
  return useContext(CollapsibleVisibilityContext);
}
