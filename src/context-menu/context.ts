/**
 * `ContextMenu`'s own open state.
 *
 * It differs from the other three anchored families in one way, and it is the
 * reason it does not reuse `OverlayShellContextValue`: a context menu anchors to
 * the POINT the user right-clicked, not to a box the trigger occupies. So the
 * trigger hands an anchor in when it opens, rather than publishing a ref for the
 * surface to measure later.
 */
import { createContext, useContext, type ComponentRef, type RefObject } from 'react';
import type { View } from 'react-native';

import type { MenuFocusIntent } from '../floating/menu-keyboard';
import type { FloatingAnchor } from '../floating/types';

export interface ContextMenuContextValue {
  open: boolean;
  /**
   * Open at a viewport point. Native passes the press point only for a
   * controlled caller to store — it presents a sheet, which anchors to the
   * screen rather than to the press. In the controlled form this ASKS: the
   * caller's `anchor` decides.
   */
  openAt: (anchor: FloatingAnchor | null) => void;
  close: () => void;
  /**
   * Where the surface anchors, in the window's (the viewport's) coordinates.
   * `null` while closed, and on native without the platform's popups (a sheet).
   */
  anchor: FloatingAnchor | null;
  /** Native: the trigger's wrapper, which a trigger measures itself into. */
  triggerRef?: RefObject<ComponentRef<typeof View> | null>;
  /**
   * Native: what a platform popup is anchored to — the caller's `anchorRef`
   * when it gives one, else the trigger's wrapper.
   */
  anchorRef?: RefObject<ComponentRef<typeof View> | null>;
  /** Web only: the row focus lands on when the menu opens (`menu-keyboard.ts`). */
  focusIntent?: MenuFocusIntent;
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
