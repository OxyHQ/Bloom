import { BloomScope } from '../appearance';
import { useMenuDensity } from '../floating/use-menu-density';
/**
 * `Menubar` — NATIVE: on a phone each menu opens the same bottom sheet
 * `DropdownMenu` and `ContextMenu` present, because a phone has no room to hang
 * a panel beside a control and every Bloom overlay resolving to one sheet is
 * what makes the native surfaces feel like one system.
 *
 * Where the platform has popups of its own (`popup-surface`, an OxyOS window or
 * its shell), each menu is instead the web's desktop menu: an anchored panel
 * hanging under its trigger (`floating/PopupPanel`, with the web's menubar
 * offsets and 266px floor), its submenus flying out beside their rows when a
 * pointer drives it (`floating/menu-sub-inline.tsx`), its rows driven by the
 * platform's keys.
 *
 * The bar, the per-menu state, the trigger and the bar's keyboard are identical
 * on both platforms and live in `MenubarBase`. What forks is this file: the
 * surface a menu opens into, and which sub-menu the rows get.
 *
 * Bloom had no menu bar before this family; its rows are `floating/menu-rows`,
 * published here under the `Menubar*` names so a call site keeps every part it
 * wrote.
 */
import React, { useMemo } from 'react';

import { SheetShell } from '../dialog/SheetShell';
import { MENUBAR_ALIGN_OFFSET, MENUBAR_SIDE_OFFSET } from '../floating/constants';
import { PopupPanel } from '../floating/PopupPanel';
import { usePopupSurface } from '../platform-surface/context';
import { MenuSurfaceProvider, type MenuSurfaceContextValue } from '../floating/context';
import { MenuRowAlignmentScope } from '../floating/menu-row-alignment';
import { createMenuRows } from '../floating/menu-rows';
import { createInlineMenuSub } from '../floating/menu-sub-inline';
import { useSheetOpenBridge } from '../floating/use-sheet-open-bridge';
import { useMenubar, useMenubarMenu } from './context';
import { createMenubarContent, createMenubarRows } from './declared';
import type { MenubarContentProps } from './types';
import { useCommonMessages } from '../locale/common-messages';

export { Menubar, MenubarMenu, MenubarTrigger } from './MenubarBase';

function MenubarPanel({
  children,
  size,
  label: labelProp,
  alignRows,
  side,
  align = 'start',
  // The web's menubar defaults (`Menubar.web.tsx`): the menu's edge under its trigger's label.
  sideOffset = MENUBAR_SIDE_OFFSET,
  alignOffset = MENUBAR_ALIGN_OFFSET,
  minWidth,
  maxWidth,
  maxHeight,
  className,
  style,
  testID,
}: MenubarContentProps) {
  const common = useCommonMessages();
  const density = useMenuDensity(size);
  const label = labelProp ?? common.menu;
  const menu = useMenubarMenu();
  const bar = useMenubar();
  const PopupSurface = usePopupSurface();
  const { control, onSheetClose } = useSheetOpenBridge(menu.open, menu.setOpen);
  const surface = useMemo<MenuSurfaceContextValue>(
    () => ({ close: menu.choose, presentation: PopupSurface ? 'dropdown' : 'sheet' }),
    [menu, PopupSurface],
  );

  if (PopupSurface) {
    // The platform's popup: mounted while open, closed by the platform on an outside press (or
    // a refused grab), and by Escape back to its title.
    return menu.open ? (
      <BloomScope size={size}>
        <PopupPanel
          PopupSurface={PopupSurface}
          anchorRef={menu.anchorRef}
          // The bar goes on taking the pointer while the menu is open: crossing onto another
          // title opens its menu in this one's place (`MenubarTriggerButton`).
          trackingRef={bar.barRef}
          side={side}
          align={align}
          sideOffset={sideOffset}
          alignOffset={alignOffset}
          role="menu"
          label={label}
          focusIntent={menu.focusIntent}
          navigationRef={menu.navigation}
          onDismiss={() => menu.setOpen(false)}
          onClose={() => menu.setOpen(false)}
          minWidth={minWidth}
          maxWidth={maxWidth}
          maxHeight={maxHeight}
          className={className}
          style={style}
          testID={testID}
        >
          <MenuSurfaceProvider value={surface}>
            <MenuRowAlignmentScope enabled={alignRows}>{children}</MenuRowAlignmentScope>
          </MenuSurfaceProvider>
        </PopupPanel>
      </BloomScope>
    ) : null;
  }

  return (
    <BloomScope size={size}>
      <SheetShell
        anchored
        control={control}
        label={label}
        onClose={onSheetClose}
        contentStyle={[{ gap: density.gap }, style]}
      >
        <MenuSurfaceProvider value={surface}>
          <MenuRowAlignmentScope enabled={alignRows}>{children}</MenuRowAlignmentScope>
        </MenuSurfaceProvider>
      </SheetShell>
    </BloomScope>
  );
}

/** The menu's content: the panel above, or the declaration alone where it is not drawn. */
export const MenubarContent = createMenubarContent(MenubarPanel);

const rows = createMenubarRows(createMenuRows('Menubar', createInlineMenuSub));

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
