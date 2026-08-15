/**
 * `Menubar` — NATIVE. A row of triggers, each opening the same bottom sheet
 * `DropdownMenu` and `ContextMenu` present.
 *
 * The one genuinely new family in this port: Bloom had no menu bar. Its rows are
 * `floating/menu-rows`, published here under shadcn's `Menubar*` names, so a
 * ported call site keeps every part it wrote.
 */
import React, { useMemo, useRef } from 'react';
import { StyleSheet, useWindowDimensions, View, type View as RNView } from 'react-native';

import { bloomShadowStyle } from '../design-tokens/shadows';
import { SheetShell } from '../dialog/SheetShell';
import {
  FONT_MEDIUM,
  MENUBAR_GAP,
  MENUBAR_HEIGHT,
  MENUBAR_HEIGHT_SM,
  MENUBAR_PADDING,
  MENUBAR_RADIUS,
  MENUBAR_TRIGGER_PADDING_X,
  MENUBAR_TRIGGER_PADDING_Y,
  MENUBAR_TRIGGER_PADDING_Y_SM,
  MENUBAR_TRIGGER_RADIUS,
  PANEL_BORDER_WIDTH,
  TEXT_SM,
  TEXT_SM_LINE_HEIGHT,
} from '../floating/constants';
import { MenuSurfaceProvider, type MenuSurfaceContextValue } from '../floating/context';
import { createMenuRows } from '../floating/menu-rows';
import { TriggerSlot } from '../floating/TriggerSlot';
import { useSheetOpenBridge } from '../floating/use-sheet-open-bridge';
import { useControllableState } from '../hooks/use-controllable-state';
import { BREAKPOINTS } from '../styles/breakpoints';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
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
  const { width } = useWindowDimensions();
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
          // `h-10 sm:h-9`.
          { height: width >= BREAKPOINTS.sm ? MENUBAR_HEIGHT_SM : MENUBAR_HEIGHT },
          { backgroundColor: theme.colors.background, borderColor: theme.colors.borderLight },
          // `shadow-sm shadow-black/5` — the bar is a raised control, not an
          // overlay, so it takes the lighter of Bloom's two elevation roles.
          bloomShadowStyle('s'),
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
  const theme = useTheme();
  const menu = useMenubarMenu();
  const { width } = useWindowDimensions();

  // `group flex items-center rounded-md px-2 py-1.5 sm:py-1`, plus `bg-accent`
  // while its menu is open and `text-sm font-medium` for the label — the same
  // chrome the web fork draws, so the bar reads identically on both platforms.
  const trigger = (
    <View
      style={[
        styles.trigger,
        {
          paddingVertical:
            width >= BREAKPOINTS.sm
              ? MENUBAR_TRIGGER_PADDING_Y_SM
              : MENUBAR_TRIGGER_PADDING_Y,
        },
        menu.open ? { backgroundColor: theme.colors.contrast50 } : null,
      ]}>
      {typeof children === 'string' ? (
        <Text style={[styles.triggerText, { color: theme.colors.text }]}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );

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
      {asChild ? children : trigger}
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
  // `bg-background border-border flex h-10 flex-row items-center gap-1
  //  rounded-md border p-1 shadow-sm shadow-black/5 sm:h-9`.
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: MENUBAR_GAP,
    padding: MENUBAR_PADDING,
    borderWidth: PANEL_BORDER_WIDTH,
    borderRadius: MENUBAR_RADIUS,
  },
  trigger: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: MENUBAR_TRIGGER_PADDING_X,
    borderRadius: MENUBAR_TRIGGER_RADIUS,
  },
  triggerText: {
    fontSize: TEXT_SM,
    lineHeight: TEXT_SM_LINE_HEIGHT,
    fontWeight: FONT_MEDIUM,
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
