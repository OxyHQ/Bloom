/**
 * `Popover`'s own open state.
 *
 * Its own context, not a shared one, for the reason the other three families
 * have theirs: a dropdown menu opened from inside a popover must drive the MENU,
 * and one shared open-state context would hand it the popover instead.
 */
import { createContext, useContext, type RefObject } from 'react';
import type { View } from 'react-native';

import type { OverlayShellContextValue } from '../floating/types';

interface PopoverContextValue extends OverlayShellContextValue {
  /** Web floating host; the native sheet owns its own focus lifecycle. */
  panelRef?: RefObject<View | null>;
}

const PopoverContext = createContext<PopoverContextValue | null>(null);
PopoverContext.displayName = 'BloomPopoverContext';

export const PopoverProvider = PopoverContext.Provider;

export function usePopover(): PopoverContextValue {
  const value = useContext(PopoverContext);
  if (!value) {
    throw new Error('Popover parts must be rendered inside a <Popover>.');
  }
  return value;
}
