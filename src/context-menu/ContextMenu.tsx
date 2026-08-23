/**
 * `ContextMenu` — NATIVE. A LONG PRESS opens the same bottom sheet
 * `DropdownMenu` presents, because a phone has no right-click and no cursor to
 * anchor to. The web fork (`ContextMenu.web.tsx`) is the second half and anchors
 * at the click point instead.
 *
 * The rows are `floating/menu-rows`, published here under shadcn's
 * `ContextMenu*` names — one implementation, three families.
 */
import React, { useCallback, useMemo, useState } from 'react';

import { SheetShell } from '../dialog/SheetShell';
import { MENU_TRIGGER_POPUP } from '../floating/constants';
import { MenuSurfaceProvider, type MenuSurfaceContextValue } from '../floating/context';
import { createMenuRows } from '../floating/menu-rows';
import { createInlineMenuSub } from '../floating/menu-sub-inline';
import { TriggerSlot } from '../floating/TriggerSlot';
import { useSheetOpenBridge } from '../floating/use-sheet-open-bridge';
import { ContextMenuProvider, useContextMenu } from './context';
import type {
  ContextMenuContentProps,
  ContextMenuProps,
  ContextMenuTriggerProps,
} from './types';

export function ContextMenu({ children, onOpenChange }: ContextMenuProps) {
  const [open, setOpen] = useState(false);

  const value = useMemo(
    () => ({
      open,
      // Native ignores the anchor: a sheet is not anchored to the press.
      openAt: () => {
        setOpen(true);
        onOpenChange?.(true);
      },
      close: () => {
        setOpen(false);
        onOpenChange?.(false);
      },
      anchor: null,
    }),
    [open, onOpenChange],
  );

  return <ContextMenuProvider value={value}>{children}</ContextMenuProvider>;
}

export function ContextMenuTrigger({
  children,
  asChild,
  disabled,
  label,
  className,
  style,
  testID,
}: ContextMenuTriggerProps) {
  const menu = useContextMenu();

  return (
    <TriggerSlot
      asChild={asChild}
      className={className}
      style={style}
      testID={testID}
      handle={{
        // A press does nothing — a context menu opens on a LONG press, and the
        // trigger's own content keeps whatever tap behaviour it had. `onPress`
        // is required by the handle shape, so it is explicitly a no-op rather
        // than absent.
        onPress: () => {},
        onLongPress: () => menu.openAt(null),
        disabled,
        accessibilityLabel: label,
        accessibilityRole: 'button',
        'aria-haspopup': MENU_TRIGGER_POPUP,
        'aria-expanded': menu.open,
      }}>
      {children}
    </TriggerSlot>
  );
}

export function ContextMenuContent({
  children,
  label = 'Context menu',
  style,
}: ContextMenuContentProps) {
  const menu = useContextMenu();
  const setOpen = useCallback(
    (next: boolean) => {
      if (!next) menu.close();
    },
    [menu],
  );
  const { control, onSheetClose } = useSheetOpenBridge(menu.open, setOpen);
  const surface = useMemo<MenuSurfaceContextValue>(
    () => ({ close: menu.close, presentation: 'sheet' }),
    [menu.close],
  );

  return (
    <SheetShell control={control} label={label} onClose={onSheetClose} contentStyle={style}>
      <MenuSurfaceProvider value={surface}>{children}</MenuSurfaceProvider>
    </SheetShell>
  );
}

const rows = createMenuRows('ContextMenu', createInlineMenuSub);

export const ContextMenuItem = rows.Item;
export const ContextMenuCheckboxItem = rows.CheckboxItem;
export const ContextMenuRadioGroup = rows.RadioGroup;
export const ContextMenuRadioItem = rows.RadioItem;
export const ContextMenuLabel = rows.Label;
export const ContextMenuSeparator = rows.Separator;
export const ContextMenuShortcut = rows.Shortcut;
export const ContextMenuGroup = rows.Group;
export const ContextMenuSub = rows.Sub;
export const ContextMenuSubTrigger = rows.SubTrigger;
export const ContextMenuSubContent = rows.SubContent;
