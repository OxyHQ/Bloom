/**
 * `Popover`'s own open state.
 *
 * Its own context, not a shared one, for the reason the other three families
 * have theirs: a dropdown menu opened from inside a popover must drive the MENU,
 * and one shared open-state context would hand it the popover instead.
 */
import { createContext, useContext } from 'react';

import type { OverlayShellContextValue } from '../floating/types';

const PopoverContext = createContext<OverlayShellContextValue | null>(null);
PopoverContext.displayName = 'BloomPopoverContext';

export const PopoverProvider = PopoverContext.Provider;

export function usePopover(): OverlayShellContextValue {
  const value = useContext(PopoverContext);
  if (!value) {
    throw new Error('Popover parts must be rendered inside a <Popover>.');
  }
  return value;
}
