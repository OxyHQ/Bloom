/**
 * `Menubar` — WEB. The bar is the same row of triggers; each menu is an anchored
 * panel from `floating/FloatingPanel` rather than a sheet.
 *
 * `align="start"` and the trigger's own width as `minWidth` are what make a
 * menubar menu hang under its trigger the way a desktop menu bar does, rather
 * than centring like a popover.
 */
import React, { useCallback, useMemo, useRef } from 'react';
import { StyleSheet, View, type View as RNView } from 'react-native';

import { MENU_MIN_WIDTH } from '../floating/constants';
import { MenuSurfaceProvider, type MenuSurfaceContextValue } from '../floating/context';
import { FloatingPanel } from '../floating/FloatingPanel';
import { createMenuRows } from '../floating/menu-rows';
import { TriggerSlot } from '../floating/TriggerSlot';
import { useAnchorRect } from '../floating/use-anchor-rect';
import { useControllableState } from '../hooks/use-controllable-state';
import { borderRadius, space } from '../styles/tokens';
import { useTheme } from '../theme/use-theme';
import {
  MenubarMenuProvider,
  MenubarProvider,
  useMenubar,
  useMenubarMenu,
} from './context';
import type {
  MenubarContentProps,
  MenubarMenuProps,
  MenubarProps,
  MenubarTriggerProps,
} from './types';

export function Menubar({
  children,
  value,
  defaultValue,
  onValueChange,
  label = 'Menu bar',
  style,
  testID,
}: MenubarProps) {
  const theme = useTheme();
  const [openValue, setValue] = useControllableState<string | undefined>({
    value,
    defaultValue,
    onChange: onValueChange,
  });
  const context = useMemo(() => ({ value: openValue, setValue }), [openValue, setValue]);

  return (
    <MenubarProvider value={context}>
      <View
        role="menubar"
        aria-label={label}
        testID={testID}
        style={[
          styles.bar,
          { backgroundColor: theme.colors.background, borderColor: theme.colors.borderLight },
          style,
        ]}>
        {children}
      </View>
    </MenubarProvider>
  );
}

export function MenubarMenu({ children, value }: MenubarMenuProps) {
  const bar = useMenubar();
  const anchorRef = useRef<RNView | null>(null);
  const { setValue } = bar;

  const context = useMemo(
    () => ({
      open: bar.value === value,
      setOpen: (next: boolean) => setValue(next ? value : undefined),
      anchorRef,
    }),
    [bar.value, value, setValue],
  );

  return <MenubarMenuProvider value={context}>{children}</MenubarMenuProvider>;
}

export function MenubarTrigger({
  children,
  asChild,
  disabled,
  label,
  style,
  testID,
}: MenubarTriggerProps) {
  const menu = useMenubarMenu();

  return (
    <TriggerSlot
      asChild={asChild}
      anchorRef={menu.anchorRef}
      style={style}
      testID={testID}
      handle={{
        onPress: () => menu.setOpen(!menu.open),
        disabled,
        accessibilityLabel: label,
        accessibilityRole: 'button',
        'aria-expanded': menu.open,
      }}>
      {children}
    </TriggerSlot>
  );
}

export function MenubarContent({
  children,
  label = 'Menu',
  side,
  align = 'start',
  sideOffset,
  alignOffset,
  dismissible,
  minWidth = MENU_MIN_WIDTH,
  maxWidth,
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
      // The one non-modal surface of the four. A menubar's defining interaction
      // is moving between its menus, and a press-catching backdrop turns that
      // into two clicks: the first is eaten closing the open menu, the second
      // finally reaches the sibling trigger. Without a backdrop the press
      // dismisses this menu AND lands on the trigger, which opens the next one.
      modal={false}
      minWidth={minWidth}
      maxWidth={maxWidth}
      onDismiss={close}
      style={style}
      testID={testID}>
      <MenuSurfaceProvider value={surface}>{children}</MenuSurfaceProvider>
    </FloatingPanel>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: space.xs,
    padding: space.xs,
    borderWidth: 1,
    borderRadius: borderRadius.md,
  },
});

const rows = createMenuRows('Menubar');

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
