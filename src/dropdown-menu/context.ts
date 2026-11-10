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
import type { ParsedGlassMenu } from '../floating/glass-menu/parse-glass-menu';
import type { GlassMenuNativeHandle } from '../floating/glass-menu/native-glass-menu';

/** The menu's rows, read as data for the native glass menu (Android). */
export interface DropdownMenuGlass extends ParsedGlassMenu {
  nativeRef: React.RefObject<GlassMenuNativeHandle | null>;
  select: (id: string) => void;
  openChange: (open: boolean) => void;
}

export interface DropdownMenuContextValue extends OverlayShellContextValue {
  /** Set when the native glass menu presents this menu; the sheet is then not used. */
  glass?: DropdownMenuGlass;
  activation?: 'click' | 'hover';
  onPrimaryOpenChange?: (open: boolean) => void;
  panelRef?: React.RefObject<ViewRef | null>;
  hover?: {
    enter: () => void;
    show: () => void;
    hide: () => void;
    hold: () => void;
    dismiss: () => void;
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
