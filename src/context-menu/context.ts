/**
 * `ContextMenu`'s own open state.
 *
 * It differs from the other three anchored families in one way, and it is the
 * reason it does not reuse `OverlayShellContextValue`: a context menu anchors to
 * the POINT the user right-clicked, not to a box the trigger occupies. So the
 * trigger hands an anchor in when it opens, rather than publishing a ref for the
 * surface to measure later.
 */
import { createContext, useContext } from 'react';

import type { FloatingAnchor } from '../floating/types';

export interface ContextMenuContextValue {
  open: boolean;
  /**
   * Open at a viewport point. Native passes `null` — it presents a sheet, which
   * anchors to the screen rather than to the press.
   */
  openAt: (anchor: FloatingAnchor | null) => void;
  close: () => void;
  /** Where the surface anchors. `null` on native and while closed. */
  anchor: FloatingAnchor | null;
}

const ContextMenuContext = createContext<ContextMenuContextValue | null>(null);
ContextMenuContext.displayName = 'BloomContextMenuContext';

export const ContextMenuProvider = ContextMenuContext.Provider;

export function useContextMenu(): ContextMenuContextValue {
  const value = useContext(ContextMenuContext);
  if (!value) {
    throw new Error('ContextMenu parts must be rendered inside a <ContextMenu>.');
  }
  return value;
}
