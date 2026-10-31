/**
 * `Menubar`'s two contexts.
 *
 * A menubar is the one menu family with a shared parent: at most ONE of its
 * menus is open at a time, so the root owns "which value is open" and each
 * `MenubarMenu` derives its own boolean from it. Splitting them this way is what
 * makes switching menus a single state write instead of two (close that one,
 * open this one) with a frame of nothing open in between.
 */
import {
  type ComponentRef,
  createContext,
  type MutableRefObject,
  type RefObject,
  useContext,
} from 'react';
import type { View } from 'react-native';

import type { MenuFocusIntent } from '../floating/menu-keyboard';
import type { PopupNavigation } from '../floating/popup-navigation';
import type { OverlayShellContextValue } from '../floating/types';
import type { MenubarRegistry } from './registry';

/** A menu of the bar as the bar's keyboard knows it (`use-menubar-keys.ts`). */
export interface MenubarMenuHandle {
  /** Its trigger's label, for typeahead. */
  label: string;
  disabled: boolean;
  anchorRef: RefObject<ComponentRef<typeof View> | null>;
  focusIntent: MenuFocusIntent;
  /** The open panel's keyboard navigation, in a platform popup. */
  navigation: MutableRefObject<PopupNavigation | null>;
}

export interface MenubarContextValue {
  /** The `value` of the menu currently open, or `undefined` when none is. */
  value: string | undefined;
  setValue: (next: string | undefined) => void;
  /** The menu whose title has the keyboard, or `undefined` when the keyboard is elsewhere. */
  focusValue: string | undefined;
  /** The keyboard leaves the bar: a row was chosen from it. */
  leave: () => void;
  /**
   * Opens `next` in place of the open menu, as a Mac's bar does when the pointer crosses onto
   * another title: the keyboard's title moves with it if the bar has the keyboard.
   */
  switchTo: (next: string) => void;
  /**
   * The bar drawn in the window. A menu in a platform popup names it as the view the pointer goes
   * on driving while the menu is open (`PopupSurfaceProps.trackingRef`).
   */
  barRef: RefObject<ComponentRef<typeof View> | null>;
  /** Each menu's handle, by its `value`, while it is mounted. */
  menus: Map<string, MenubarMenuHandle>;
}

export interface MenubarMenuContextValue extends OverlayShellContextValue {
  /** The menu's `value` in its bar. */
  value: string;
  /** A row was chosen: the menu closes, and the bar gives the keyboard up if it had it. */
  choose: () => void;
  /** Given the open panel's keyboard navigation, in a platform popup. */
  navigation: MutableRefObject<PopupNavigation | null>;
  /** The menu as the bar's keyboard knows it; its trigger writes its label and state. */
  handle: MenubarMenuHandle;
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

const MenubarMenuContext = createContext<MenubarMenuContextValue | null>(null);
MenubarMenuContext.displayName = 'BloomMenubarMenuContext';

export const MenubarMenuProvider = MenubarMenuContext.Provider;

export function useMenubarMenu(): MenubarMenuContextValue {
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
