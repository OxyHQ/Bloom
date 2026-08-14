/**
 * `DropdownMenu`'s own open state.
 *
 * Each anchored family owns its own context object rather than sharing one:
 * a dropdown menu opened from inside a popover must drive the MENU, and a
 * single shared context would hand it the popover instead.
 */
import { createContext, useContext } from 'react';

import type { OverlayShellContextValue } from '../floating/types';

const DropdownMenuContext = createContext<OverlayShellContextValue | null>(null);
DropdownMenuContext.displayName = 'BloomDropdownMenuContext';

export const DropdownMenuProvider = DropdownMenuContext.Provider;

export function useDropdownMenu(): OverlayShellContextValue {
  const value = useContext(DropdownMenuContext);
  if (!value) {
    throw new Error('DropdownMenu parts must be rendered inside a <DropdownMenu>.');
  }
  return value;
}
