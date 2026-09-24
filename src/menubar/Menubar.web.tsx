/**
 * `Menubar` — WEB: each menu is an anchored panel from `floating/FloatingPanel`
 * rather than a sheet.
 *
 * The bar, the per-menu state and the trigger are identical on both platforms
 * and live in `MenubarBase`. What forks is this file: the surface a menu opens
 * into, and which sub-menu the rows get — a FLYOUT here, which needs a pointer.
 *
 * `align="start"` and the trigger's own width as `minWidth` are what make a
 * menubar menu hang under its trigger the way a desktop menu bar does, rather
 * than centring like a popover.
 */
import React, { useCallback, useMemo, useState } from 'react';
import type { View } from 'react-native';

import {
  MENUBAR_ALIGN_OFFSET,
  MENUBAR_MENU_MIN_WIDTH_CLASS,
  MENUBAR_SIDE_OFFSET,
} from '../floating/constants';
import { MenuSurfaceProvider, type MenuSurfaceContextValue } from '../floating/context';
import { FloatingPanel } from '../floating/FloatingPanel';
import { hostElement, useMenuPanelKeys } from '../floating/menu-keyboard';
import { createMenuRows } from '../floating/menu-rows';
import { createFlyoutMenuSub } from '../floating/menu-sub-flyout';
import { cx } from '../floating/shared';
import { useAnchorRect } from '../floating/use-anchor-rect';
import { useMenubarMenu } from './context';
import type { MenubarContentProps } from './types';

export { Menubar, MenubarMenu, MenubarTrigger } from './MenubarBase';

export function MenubarContent({
  children,
  label = 'Menu',
  side,
  align = 'start',
  // `alignOffset={-4} sideOffset={8}` — upstream's own defaults, which pull the
  // menu back over its trigger's `p-1` so its left edge lines up with the
  // trigger's label rather than with the bar's border.
  sideOffset = MENUBAR_SIDE_OFFSET,
  alignOffset = MENUBAR_ALIGN_OFFSET,
  dismissible,
  minWidth,
  maxWidth,
  className,
  style,
  testID,
}: MenubarContentProps) {
  const menu = useMenubarMenu();
  const anchor = useAnchorRect(menu.anchorRef, menu.open);
  const close = useCallback(() => menu.setOpen(false), [menu]);
  const surface = useMemo<MenuSurfaceContextValue>(
    () => ({ close, presentation: 'dropdown' }),
    [close],
  );
  const [panel, setPanel] = useState<View | null>(null);
  useMenuPanelKeys(hostElement(panel), { open: menu.open, onTab: close, intent: menu.focusIntent });

  return (
    <FloatingPanel
      panelRef={setPanel}
      open={menu.open}
      anchor={anchor}
      role="menu"
      surface="menu"
      label={label}
      side={side}
      align={align}
      sideOffset={sideOffset}
      alignOffset={alignOffset}
      dismissible={dismissible}
      // The one non-modal surface of the four. A menubar's defining interaction
      // is moving between its menus, and a press-catching backdrop turns that
      // into two clicks: the first is eaten closing the open menu, the second
      // finally reaches the sibling trigger. Without a backdrop the press
      // dismisses this menu AND lands on the trigger, which opens the next one.
      modal={false}
      minWidth={minWidth}
      maxWidth={maxWidth}
      onDismiss={close}
      // `min-w-[12rem]` — a menubar menu is wider than a dropdown.
      className={cx(MENUBAR_MENU_MIN_WIDTH_CLASS, className)}
      style={style}
      testID={testID}>
      <MenuSurfaceProvider value={surface}>{children}</MenuSurfaceProvider>
    </FloatingPanel>
  );
}

const rows = createMenuRows('Menubar', createFlyoutMenuSub);

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
