/**
 * `Menubar` — NATIVE. A row of triggers, each opening the same bottom sheet
 * `DropdownMenu` and `ContextMenu` present.
 *
 * The one genuinely new family in this port: Bloom had no menu bar. Its rows are
 * `floating/menu-rows`, published here under shadcn's `Menubar*` names, so a
 * ported call site keeps every part it wrote.
 */
import React, { useMemo, useRef } from 'react';
import type { View as RNView } from 'react-native';

import { bloomShadowStyle } from '../design-tokens/shadows';
import { SheetShell } from '../dialog/SheetShell';
import {
  MENUBAR_CLASS,
  MENUBAR_TRIGGER_CLASS,
  MENUBAR_TRIGGER_OPEN_CLASS,
  MENUBAR_TRIGGER_TEXT_CLASS,
} from '../floating/constants';
import { MenuSurfaceProvider, type MenuSurfaceContextValue } from '../floating/context';
import { createMenuRows } from '../floating/menu-rows';
import { createInlineMenuSub } from '../floating/menu-sub-inline';
import { cx } from '../floating/shared';
import { TriggerSlot } from '../floating/TriggerSlot';
import { useSheetOpenBridge } from '../floating/use-sheet-open-bridge';
import { useControllableState } from '../hooks/use-controllable-state';
import { StyledText, StyledView } from '../styles/styled-primitives';
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
  className,
  style,
  testID,
}: MenubarProps) {
  const [openValue, setValue] = useControllableState<string | undefined>({
    value,
    defaultValue,
    onChange: onValueChange,
  });
  const context = useMemo(() => ({ value: openValue, setValue }), [openValue, setValue]);

  return (
    <MenubarProvider value={context}>
      {/* `shadow-s` — the bar is a raised control, not an overlay, so it takes
          the lighter of Bloom's two elevation roles. */}
      <StyledView
        role="menubar"
        aria-label={label}
        testID={testID}
        className={cx(MENUBAR_CLASS, className)}
      // `shadow-s` reaches WEB through the class; NATIVE takes the same role as
      // an inline style, because `design-tokens/shadows` is platform-forked and
      // its own contract is that a multi-layer `box-shadow` is not something to
      // rely on NativeWind translating to RN elevation. On web the two agree, so
      // whichever wins paints the same thing.
        style={[bloomShadowStyle('s'), style]}>
        {children}
      </StyledView>
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
  className,
  style,
  testID,
}: MenubarTriggerProps) {
  const menu = useMenubarMenu();

  // `flex items-center rounded-md px-2 py-1.5`, plus `bg-accent` while its menu
  // is open and `text-sm font-medium` for the label — the same chrome the web
  // fork draws, so the bar reads identically on both platforms.
  const trigger = (
    <StyledView
      className={cx(
        MENUBAR_TRIGGER_CLASS,
        menu.open && MENUBAR_TRIGGER_OPEN_CLASS,
        className,
      )}>
      {typeof children === 'string' ? (
        <StyledText className={MENUBAR_TRIGGER_TEXT_CLASS}>{children}</StyledText>
      ) : (
        children
      )}
    </StyledView>
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
