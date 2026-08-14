/**
 * `DropdownMenu` — NATIVE. Presents through `dialog/SheetShell`, Bloom's
 * established native-overlay convention (shared with `Select`, `ContextMenu`
 * and `Popover`): a menu is a bottom sheet on a phone and an anchored dropdown
 * on a pointer. The web fork (`DropdownMenu.web.tsx`) is the second half.
 *
 * The public API is Radix/shadcn's — `open` / `defaultOpen` / `onOpenChange` on
 * the root, `asChild` on the trigger — bridged onto `Dialog`'s IMPERATIVE
 * control by `floating/use-sheet-open-bridge`, never onto its controlled
 * boolean path.
 *
 * The rows come from `floating/menu-rows`, the same set `ContextMenu` and
 * `Menubar` publish under their own prefixes.
 */
import React, { useMemo, useRef } from 'react';
import type { View } from 'react-native';

import { SheetShell } from '../dialog/SheetShell';
import { MenuSurfaceProvider, type MenuSurfaceContextValue } from '../floating/context';
import { createMenuRows } from '../floating/menu-rows';
import { TriggerSlot } from '../floating/TriggerSlot';
import { useSheetOpenBridge } from '../floating/use-sheet-open-bridge';
import { useControllableState } from '../hooks/use-controllable-state';
import { DropdownMenuProvider, useDropdownMenu } from './context';
import type {
  DropdownMenuContentProps,
  DropdownMenuProps,
  DropdownMenuTriggerProps,
} from './types';

export function DropdownMenu({
  children,
  open,
  defaultOpen = false,
  onOpenChange,
}: DropdownMenuProps) {
  const [isOpen, setOpen] = useControllableState<boolean>({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  const anchorRef = useRef<View | null>(null);
  const value = useMemo(() => ({ open: isOpen, setOpen, anchorRef }), [isOpen, setOpen]);

  return <DropdownMenuProvider value={value}>{children}</DropdownMenuProvider>;
}

export function DropdownMenuTrigger({
  children,
  asChild,
  disabled,
  label,
  style,
  testID,
}: DropdownMenuTriggerProps) {
  const menu = useDropdownMenu();

  return (
    <TriggerSlot
      asChild={asChild}
      anchorRef={menu.anchorRef}
      style={style}
      testID={testID}
      handle={{
        onPress: () => menu.setOpen(true),
        disabled,
        accessibilityLabel: label,
        accessibilityRole: 'button',
        'aria-expanded': menu.open,
      }}>
      {children}
    </TriggerSlot>
  );
}

export function DropdownMenuContent({
  children,
  label = 'Menu',
  style,
}: DropdownMenuContentProps) {
  const menu = useDropdownMenu();
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

const rows = createMenuRows('DropdownMenu');

export const DropdownMenuItem = rows.Item;
export const DropdownMenuCheckboxItem = rows.CheckboxItem;
export const DropdownMenuRadioGroup = rows.RadioGroup;
export const DropdownMenuRadioItem = rows.RadioItem;
export const DropdownMenuLabel = rows.Label;
export const DropdownMenuSeparator = rows.Separator;
export const DropdownMenuShortcut = rows.Shortcut;
export const DropdownMenuGroup = rows.Group;
export const DropdownMenuSub = rows.Sub;
export const DropdownMenuSubTrigger = rows.SubTrigger;
export const DropdownMenuSubContent = rows.SubContent;
