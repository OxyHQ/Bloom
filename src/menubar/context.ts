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
import type { MenubarRegistry } from './registry';

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

/**
 * Where a declared part sits in its bar's declaration, for the part to
 * register itself (`declared.tsx`).
 *
 * `headless` is the declaration mounted to be KNOWN rather than drawn: with
 * the `menu-bar` capability the whole bar is, and without it a closed menu's
 * content is (so its shortcuts work while it is closed). A headless part
 * registers and draws nothing.
 */
export interface MenubarScope {
  readonly registry: MenubarRegistry;
  readonly headless: boolean;
  /** The menu or submenu the parts here are in; null directly in the bar. */
  readonly parent: string | null;
  /** The position here in the declaration (see `registry.ts`). */
  readonly path: readonly number[];
  /**
   * The menu or submenu whose trigger is here: a `MenubarTrigger` registers its
   * `MenubarMenu`, a `MenubarSubTrigger` its `MenubarSub`.
   */
  readonly owner?: {
    readonly kind: 'menu' | 'submenu';
    readonly id: string;
    readonly parent: string | null;
    readonly path: readonly number[];
  };
}

const MenubarScopeContext = createContext<MenubarScope | null>(null);
MenubarScopeContext.displayName = 'BloomMenubarScopeContext';

export const MenubarScopeProvider = MenubarScopeContext.Provider;

/** The part's place in its bar's declaration; null outside a `Menubar`. */
export function useMenubarScope(): MenubarScope | null {
  return useContext(MenubarScopeContext);
}
