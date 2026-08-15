/**
 * The contexts the shared menu ROW vocabulary reads.
 *
 * `dropdown-menu`, `context-menu` and `menubar` render the SAME rows, and the
 * rows have to know two things a row cannot ask the platform for: how to
 * dismiss the surface they sit in, and whether that surface is a native sheet
 * or a pointer dropdown. Each shell states both here, so a row never branches on
 * `Platform.OS` and never learns which family it belongs to.
 *
 * The per-family OPEN state is deliberately NOT here — each family owns its own
 * `context.ts` with its own React context, because one shared open-state context
 * would make a dropdown menu nested inside a popover drive the popover.
 */
import { createContext, useContext } from 'react';

export interface MenuSurfaceContextValue {
  /** Dismiss the whole menu. Rows call it after activation. */
  close: () => void;
  /**
   * How the surface presents. Native menus present as a bottom SHEET, web
   * menus as an anchored DROPDOWN, and a row is laid out and highlighted
   * differently in each: a sheet row is a 44dp touch target with no hover, a
   * dropdown row is compact and lights up under the pointer.
   */
  presentation: 'sheet' | 'dropdown';
}

const MenuSurfaceContext = createContext<MenuSurfaceContextValue | null>(null);
MenuSurfaceContext.displayName = 'BloomMenuSurfaceContext';

export const MenuSurfaceProvider = MenuSurfaceContext.Provider;

export function useMenuSurface(): MenuSurfaceContextValue {
  const value = useContext(MenuSurfaceContext);
  if (!value) {
    throw new Error(
      'Menu rows must be rendered inside a DropdownMenuContent, ContextMenuContent or MenubarContent.',
    );
  }
  return value;
}

export interface MenuRadioGroupContextValue {
  value: string | undefined;
  onValueChange: (next: string) => void;
}

const MenuRadioGroupContext = createContext<MenuRadioGroupContextValue | null>(null);
MenuRadioGroupContext.displayName = 'BloomMenuRadioGroupContext';

export const MenuRadioGroupProvider = MenuRadioGroupContext.Provider;

export function useMenuRadioGroup(): MenuRadioGroupContextValue {
  const value = useContext(MenuRadioGroupContext);
  if (!value) {
    throw new Error('A menu radio item must be rendered inside a menu radio group.');
  }
  return value;
}

export interface MenuSubContextValue {
  open: boolean;
  setOpen: (next: boolean) => void;
}

const MenuSubContext = createContext<MenuSubContextValue | null>(null);
MenuSubContext.displayName = 'BloomMenuSubContext';

export const MenuSubProvider = MenuSubContext.Provider;

export function useMenuSub(): MenuSubContextValue {
  const value = useContext(MenuSubContext);
  if (!value) {
    throw new Error('A menu sub trigger and sub content must be rendered inside a menu sub.');
  }
  return value;
}
