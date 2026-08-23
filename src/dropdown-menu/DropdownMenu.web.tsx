/**
 * `DropdownMenu` — WEB. An anchored panel rather than a sheet, positioned,
 * portaled, ranked and dismissed by `floating/FloatingPanel`.
 *
 * Only the shell forks. The rows are the same universal
 * `floating/menu-rows` set the native file publishes; what changes between the
 * two is stated once, as `presentation`.
 */
import React, { useCallback, useMemo, useRef } from 'react';
import type { View } from 'react-native';

import { MENU_MIN_WIDTH_CLASS, MENU_TRIGGER_POPUP } from '../floating/constants';
import { MenuSurfaceProvider, type MenuSurfaceContextValue } from '../floating/context';
import { FloatingPanel } from '../floating/FloatingPanel';
import { createMenuRows } from '../floating/menu-rows';
import { createFlyoutMenuSub } from '../floating/menu-sub-flyout';
import { cx } from '../floating/shared';
import { TriggerSlot } from '../floating/TriggerSlot';
import { useAnchorRect } from '../floating/use-anchor-rect';
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
  className,
  style,
  testID,
}: DropdownMenuTriggerProps) {
  const menu = useDropdownMenu();

  return (
    <TriggerSlot
      asChild={asChild}
      anchorRef={menu.anchorRef}
      className={className}
      style={style}
      testID={testID}
      handle={{
        // A dropdown trigger TOGGLES: pressing an open menu's trigger closes it
        // rather than reopening it, which is what a pointer user expects and
        // what the native sheet gets for free from its backdrop.
        onPress: () => menu.setOpen(!menu.open),
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

export function DropdownMenuContent({
  children,
  label = 'Menu',
  side,
  align = 'start',
  sideOffset,
  alignOffset,
  dismissible,
  minWidth,
  maxWidth,
  className,
  style,
  testID,
}: DropdownMenuContentProps) {
  const menu = useDropdownMenu();
  const anchor = useAnchorRect(menu.anchorRef, menu.open);
  const close = useCallback(() => menu.setOpen(false), [menu]);
  const surface = useMemo<MenuSurfaceContextValue>(
    () => ({ close, presentation: 'dropdown' }),
    [close],
  );

  return (
    <FloatingPanel
      open={menu.open}
      anchor={anchor}
      role="menu"
      label={label}
      side={side}
      align={align}
      sideOffset={sideOffset}
      alignOffset={alignOffset}
      dismissible={dismissible}
      minWidth={minWidth}
      maxWidth={maxWidth}
      onDismiss={close}
      // `min-w-40` — 160px, as a CLASS rather than an inline `minWidth`, so a
      // caller's own `min-w-*` can reach it. The placement resolver reads the
      // laid-out box, which the class is already part of.
      className={cx(MENU_MIN_WIDTH_CLASS, className)}
      style={style}
      testID={testID}>
      <MenuSurfaceProvider value={surface}>{children}</MenuSurfaceProvider>
    </FloatingPanel>
  );
}

const rows = createMenuRows('DropdownMenu', createFlyoutMenuSub);

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
