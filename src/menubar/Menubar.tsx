/**
 * `Menubar` — NATIVE: each menu opens the same bottom sheet `DropdownMenu` and
 * `ContextMenu` present, because a phone has no room to hang a panel beside a
 * control and every Bloom overlay resolving to one sheet is what makes the
 * native surfaces feel like one system.
 *
 * The bar, the per-menu state and the trigger are identical on both platforms
 * and live in `MenubarBase`. What forks is this file: the surface a menu opens
 * into, and which sub-menu the rows get — INLINE on native, because a flyout
 * needs a pointer.
 *
 * Bloom had no menu bar before this family; its rows are `floating/menu-rows`,
 * published here under the `Menubar*` names so a call site keeps every part it
 * wrote.
 */
import React, { useMemo } from 'react';

import { SheetShell } from '../dialog/SheetShell';
import { MenuSurfaceProvider, type MenuSurfaceContextValue } from '../floating/context';
import { createMenuRows } from '../floating/menu-rows';
import { createInlineMenuSub } from '../floating/menu-sub-inline';
import { useSheetOpenBridge } from '../floating/use-sheet-open-bridge';
import { useMenubarMenu } from './context';
import type { MenubarContentProps } from './types';

export { Menubar, MenubarMenu, MenubarTrigger } from './MenubarBase';

export function MenubarContent({ children, label = 'Menu', style }: MenubarContentProps) {
  const menu = useMenubarMenu();
  const { control, onSheetClose } = useSheetOpenBridge(menu.open, menu.setOpen);
  const surface = useMemo<MenuSurfaceContextValue>(
    () => ({ close: () => menu.setOpen(false), presentation: 'sheet' }),
    [menu],
  );

  return (
    <SheetShell control={control} label={label} onClose={onSheetClose} contentStyle={style}>
      <MenuSurfaceProvider value={surface}>{children}</MenuSurfaceProvider>
    </SheetShell>
  );
}

const rows = createMenuRows('Menubar', createInlineMenuSub);

export const MenubarItem = rows.Item;
export const MenubarCheckboxItem = rows.CheckboxItem;
export const MenubarRadioGroup = rows.RadioGroup;
export const MenubarRadioItem = rows.RadioItem;
export const MenubarLabel = rows.Label;
export const MenubarSeparator = rows.Separator;
export const MenubarShortcut = rows.Shortcut;
export const MenubarGroup = rows.Group;
export const MenubarSub = rows.Sub;
export const MenubarSubTrigger = rows.SubTrigger;
export const MenubarSubContent = rows.SubContent;
