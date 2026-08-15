/**
 * `Menubar`'s two contexts.
 *
 * A menubar is the one menu family with a shared parent: at most ONE of its
 * menus is open at a time, so the root owns "which value is open" and each
 * `MenubarMenu` derives its own boolean from it. Splitting them this way is what
 * makes switching menus a single state write instead of two (close that one,
 * open this one) with a frame of nothing open in between.
 */
import { createContext, useContext } from 'react';

import type { OverlayShellContextValue } from '../floating/types';

export interface MenubarContextValue {
  /** The `value` of the menu currently open, or `undefined` when none is. */
  value: string | undefined;
  setValue: (next: string | undefined) => void;
}

const MenubarContext = createContext<MenubarContextValue | null>(null);
MenubarContext.displayName = 'BloomMenubarContext';

export const MenubarProvider = MenubarContext.Provider;

export function useMenubar(): MenubarContextValue {
  const value = useContext(MenubarContext);
  if (!value) {
    throw new Error('Menubar parts must be rendered inside a <Menubar>.');
  }
  return value;
}

const MenubarMenuContext = createContext<OverlayShellContextValue | null>(null);
MenubarMenuContext.displayName = 'BloomMenubarMenuContext';

export const MenubarMenuProvider = MenubarMenuContext.Provider;

export function useMenubarMenu(): OverlayShellContextValue {
  const value = useContext(MenubarMenuContext);
  if (!value) {
    throw new Error('MenubarTrigger and MenubarContent must be rendered inside a <MenubarMenu>.');
  }
  return value;
}
