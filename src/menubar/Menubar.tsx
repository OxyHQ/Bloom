/**
 * `Menubar` — NATIVE. A row of triggers, each opening the same bottom sheet
 * `DropdownMenu` and `ContextMenu` present.
 *
 * The one genuinely new family in this port: Bloom had no menu bar. Its rows are
 * `floating/menu-rows`, published here under shadcn's `Menubar*` names, so a
 * ported call site keeps every part it wrote.
 */
import React, { useMemo, useRef } from 'react';
import { StyleSheet, View, type View as RNView } from 'react-native';

import { SheetShell } from '../dialog/SheetShell';
import { MenuSurfaceProvider, type MenuSurfaceContextValue } from '../floating/context';
import { createMenuRows } from '../floating/menu-rows';
import { TriggerSlot } from '../floating/TriggerSlot';
import { useSheetOpenBridge } from '../floating/use-sheet-open-bridge';
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
