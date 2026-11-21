/**
 * `DropdownMenu`'s own open state.
 *
 * Each anchored family owns its own context object rather than sharing one:
 * a dropdown menu opened from inside a popover must drive the MENU, and a
 * single shared context would hand it the popover instead.
 */
import { createContext, useContext } from 'react';

import type { ViewRef } from '../styles/native-refs';
import type { OverlayShellContextValue } from '../floating/types';
import type { LensContentProvider, MenuLens } from '../floating/lens/use-lens-menu';

export type DropdownMenuLens = MenuLens;

export interface DropdownMenuContextValue extends OverlayShellContextValue {
  /** Set when the native lens menu presents this menu; the sheet is then not used. */
  lens?: DropdownMenuLens;
  /** The native lens view around the trigger: `lens`, or the view waiting for rows that arrive as the menu opens. */
  lensHost?: DropdownMenuLens;
  /** Set when a `Content` the root cannot see (rendered by a component of the owner's) may hand it its rows. */
  lensContent?: LensContentProvider;
  activation?: 'click' | 'hover';
  onPrimaryOpenChange?: (open: boolean) => void;
  panelRef?: React.RefObject<ViewRef | null>;
  hover?: {
    enter: () => void;
    show: () => void;
    hide: () => void;
    hold: () => void;
    dismiss: () => void;
    /** A key used in the open panel (native): a menu opened by hover then stays open. */
    key?: () => void;
  };
}

const DropdownMenuContext = createContext<DropdownMenuContextValue | null>(null);
DropdownMenuContext.displayName = 'BloomDropdownMenuContext';

export const DropdownMenuProvider = DropdownMenuContext.Provider;

export function useDropdownMenu(): DropdownMenuContextValue {
  const value = useContext(DropdownMenuContext);
  if (!value) {
    throw new Error('DropdownMenu parts must be rendered inside a <DropdownMenu>.');
  }
  return value;
}
