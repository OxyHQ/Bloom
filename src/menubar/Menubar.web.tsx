/**
 * `Menubar` — WEB. The bar is the same row of triggers; each menu is an anchored
 * panel from `floating/FloatingPanel` rather than a sheet.
 *
 * `align="start"` and the trigger's own width as `minWidth` are what make a
 * menubar menu hang under its trigger the way a desktop menu bar does, rather
 * than centring like a popover.
 */
import React, { useCallback, useMemo, useRef } from 'react';
import { StyleSheet, useWindowDimensions, View, type View as RNView } from 'react-native';

import { bloomShadowStyle } from '../design-tokens/shadows';
import {
  FONT_MEDIUM,
  MENUBAR_ALIGN_OFFSET,
  MENUBAR_GAP,
  MENUBAR_HEIGHT,
  MENUBAR_HEIGHT_SM,
  MENUBAR_MENU_MIN_WIDTH,
  MENUBAR_PADDING,
  MENUBAR_RADIUS,
  MENUBAR_SIDE_OFFSET,
  MENUBAR_TRIGGER_PADDING_X,
  MENUBAR_TRIGGER_PADDING_Y,
  MENUBAR_TRIGGER_PADDING_Y_SM,
  MENUBAR_TRIGGER_RADIUS,
  PANEL_BORDER_WIDTH,
  TEXT_SM,
  TEXT_SM_LINE_HEIGHT,
} from '../floating/constants';
import { MenuSurfaceProvider, type MenuSurfaceContextValue } from '../floating/context';
import { FloatingPanel } from '../floating/FloatingPanel';
import { createMenuRows } from '../floating/menu-rows';
import { createFlyoutMenuSub } from '../floating/menu-sub-flyout';
import { TriggerSlot } from '../floating/TriggerSlot';
import { useAnchorRect } from '../floating/use-anchor-rect';
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
  // while its menu is open, and `text-sm font-medium` for the label. A menubar
  // trigger is a BUTTON with chrome of its own, not a bare hit box — leaving it
  // unstyled is why a Bloom menubar read as loose text against upstream's
  // pill-per-menu bar. `asChild` still hands the whole thing to the caller.
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
  minWidth = MENUBAR_MENU_MIN_WIDTH,
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
