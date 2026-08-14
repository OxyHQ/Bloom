/**
 * The contexts the menu ROW vocabulary reads.
 *
 * `menu/` owns the rows — `MenuItem`, `MenuCheckboxItem`, `MenuRadioItem`,
 * `MenuLabel`, `MenuSeparator`, `MenuShortcut`, `MenuGroup` and the `MenuSub`
 * trio — and `context-menu/` and `menubar/` render the SAME components inside
 * their own shells. That is the one place Bloom's port diverges from
 * react-native-reusables, where each of the three menus ships its own
 * copy-pasted `…Item`/`…Label`/`…Separator` set: three names for one component
 * is exactly the aliasing Bloom does not do. What every shell must provide is
 * this context.
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
    throw new Error('MenuRadioItem must be rendered inside a MenuRadioGroup.');
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
    throw new Error('MenuSubTrigger and MenuSubContent must be rendered inside a MenuSub.');
  }
  return value;
}
