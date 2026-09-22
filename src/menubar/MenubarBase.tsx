/**
 * The three `Menubar` parts that are the SAME on both platforms.
 *
 * A menubar forks in exactly one place — what a menu opens INTO. Native
 * presents the bottom sheet every Bloom overlay resolves to; web anchors a
 * `floating/FloatingPanel` under the trigger. The bar itself, the per-menu
 * state and the trigger are identical, so they live here and each fork
 * re-exports them rather than keeping a second copy that has to be edited
 * twice.
 *
 * NEUTRAL by construction: everything this module reaches (`floating/*`,
 * `hooks/*`, `styles/*`, `./context`, `./types`) is fork-free. That is not a
 * detail — `web-fork-reachability.test.ts` only scans `.web` files, so a
 * neutral module naming a forked target resolves to NATIVE in every bundler
 * that is not Metro and no gate would report it.
 */
import React, { useMemo, useRef } from 'react';
import type { View as RNView } from 'react-native';

import {
  MENUBAR_CLASS,
  MENUBAR_TRIGGER_CLASS,
  MENUBAR_TRIGGER_OPEN_CLASS,
  MENUBAR_TRIGGER_TEXT_CLASS,
  MENU_TRIGGER_POPUP,
} from '../floating/constants';
import { useMenuPalette } from '../floating/menu-palette';
import { menuType } from '../floating/menu-type';
import { cx } from '../floating/shared';
import { TriggerSlot } from '../floating/TriggerSlot';
import { useControllableState } from '../hooks/use-controllable-state';
import { StyledText, StyledView } from '../styles/styled-primitives';
import {
  MenubarMenuProvider,
  MenubarProvider,
  useMenubar,
  useMenubarMenu,
} from './context';
import type { MenubarMenuProps, MenubarProps, MenubarTriggerProps } from './types';

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
  const palette = useMenuPalette();
  const barPaint = {
    backgroundColor: palette.trigger.background,
    borderColor: palette.trigger.border,
    boxShadow: palette.trigger.shadow,
  };

  return (
    <MenubarProvider value={context}>
      {/* `shadow-s` — the bar is a raised control, not an overlay, so it takes
          the lighter of Bloom's two elevation roles. It reaches WEB through the
          class and NATIVE through `barPaint`, because `design-tokens/shadows`
          is platform-forked and its contract is that a multi-layer
          `box-shadow` is not something to rely on NativeWind translating to an
          RN elevation. On web the two agree, so whichever wins paints the
          same thing. */}
      <StyledView
        role="menubar"
        aria-label={label}
        testID={testID}
        className={cx(MENUBAR_CLASS, className)}
        style={[barPaint, style]}>
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
  const palette = useMenuPalette();

  // `flex items-center rounded-md px-2 py-1.5`, plus `bg-accent` while its menu
  // is open, and `text-sm font-medium` for the label. A menubar trigger is a
  // BUTTON with chrome of its own, not a bare hit box — leaving it unstyled is
  // why a Bloom menubar read as loose text against a pill-per-menu bar. The
  // same chrome on both platforms, so the bar reads identically. `asChild`
  // still hands the whole thing to the caller.
  const trigger = (
    <StyledView
      className={cx(
        MENUBAR_TRIGGER_CLASS,
        menu.open && MENUBAR_TRIGGER_OPEN_CLASS,
        className,
      )}
      style={{ backgroundColor: menu.open ? palette.rowHighlight : 'transparent' }}>
      {typeof children === 'string' ? (
        <StyledText
          className={MENUBAR_TRIGGER_TEXT_CLASS}
          // `text-body-medium text-text-primary`, in Inter.
          style={[menuType('body-medium'), { color: palette.text }]}>
          {children}
        </StyledText>
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
        'aria-haspopup': MENU_TRIGGER_POPUP,
        'aria-expanded': menu.open,
      }}>
      {asChild ? children : trigger}
    </TriggerSlot>
  );
}
