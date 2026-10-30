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
import React, { type ComponentRef, useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, type View as RNView } from 'react-native';
import { SurfacePaint } from '../surface/SurfacePaint';
import { FIELD_REST_BORDER_WIDTH } from '../styles/field-border';

import {
  MENUBAR_CLASS,
  MENUBAR_RADIUS,
  MENUBAR_TRIGGER_CLASS,
  MENUBAR_TRIGGER_OPEN_CLASS,
  MENUBAR_TRIGGER_TEXT_CLASS,
  MENU_TRIGGER_POPUP,
} from '../floating/constants';
import { useMenuPalette } from '../floating/menu-palette';
import { menuType } from '../floating/menu-type';
import { cx } from '../floating/shared';
import { TriggerSlot } from '../floating/TriggerSlot';
import { useMenuFocusIntent, useMenuTriggerKeys } from '../floating/menu-keyboard';
import { useControllableState } from '../hooks/use-controllable-state';
import { StyledText, StyledView } from '../styles/styled-primitives';
import { usePlatformMenuBar } from '../platform-surface/context';
import {
  type MenubarScope,
  MenubarMenuProvider,
  MenubarProvider,
  MenubarScopeProvider,
  useMenubar,
  useMenubarMenu,
  useMenubarScope,
} from './context';
import { DeclaredChildren, textOf, useMenuEntry } from './declared';
import { MenubarRegistry, nextMenuEntryId } from './registry';
import type { MenubarMenuProps, MenubarProps, MenubarTriggerProps } from './types';
import { useMenuShortcuts } from './use-menu-shortcuts';
import { usePublishMenus } from './use-publish-menus';
import { useMessages } from '../locale/messages';
import { MENUBAR_MESSAGES } from './messages';

const noHint = () => false;

/**
 * The bar. Without the `menu-bar` capability it draws itself in the window, as
 * it always has. With it, it draws nothing: its declaration is mounted
 * headless, described to the platform's bar (`use-publish-menus.ts`), and an
 * item chosen there runs here. Either way each item's shortcut runs it
 * (`use-menu-shortcuts.ts`).
 */
export function Menubar({
  children,
  value,
  defaultValue,
  onValueChange,
  label: labelProp,
  className,
  style,
  testID,
}: MenubarProps) {
  const { messages } = useMessages(MENUBAR_MESSAGES);
  const label = labelProp ?? messages.menuBar;
  const [openValue, setValue] = useControllableState<string | undefined>({
    value,
    defaultValue,
    onChange: onValueChange,
  });
  const context = useMemo(() => ({ value: openValue, setValue }), [openValue, setValue]);
  const menuBar = usePlatformMenuBar();
  const [registry] = useState(() => new MenubarRegistry());
  const publishing = usePublishMenus(registry, menuBar);
  // A shortcut runs its item as a press on the row would, so an open menu
  // closes after it unless the item keeps it open.
  const onShortcut = useCallback(
    (entry: { keepOpen?: boolean }) => {
      if (!entry.keepOpen && openValue !== undefined) setValue(undefined);
    },
    [openValue, setValue],
  );
  useMenuShortcuts(registry, menuBar === null || publishing, onShortcut);
  const scope = useMemo<MenubarScope>(
    () => ({ registry, headless: menuBar !== null, parent: null, path: [] }),
    [registry, menuBar],
  );
  const palette = useMenuPalette();
  const barPaint = {
    borderColor: palette.trigger.border,
    boxShadow: palette.trigger.shadow,
  };

  if (menuBar) {
    return (
      <MenubarProvider value={context}>
        <MenubarScopeProvider value={scope}>
          <DeclaredChildren>{children}</DeclaredChildren>
        </MenubarScopeProvider>
      </MenubarProvider>
    );
  }

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
        style={[barPaint, style]}
      >
        {StyleSheet.flatten(style)?.backgroundColor === undefined ? (
          <SurfacePaint
            fill={palette.trigger.background}
            radius={MENUBAR_RADIUS - FIELD_REST_BORDER_WIDTH}
            composite
          />
        ) : null}
        <MenubarScopeProvider value={scope}>{children}</MenubarScopeProvider>
      </StyledView>
    </MenubarProvider>
  );
}

export function MenubarMenu({ children, value }: MenubarMenuProps) {
  const bar = useMenubar();
  const scope = useMenubarScope();
  const [id] = useState(nextMenuEntryId);
  // Its trigger registers it (it carries the menu's label and state); the
  // parts inside it are in it.
  const inner = useMemo<MenubarScope | null>(
    () =>
      scope && {
        ...scope,
        parent: id,
        owner: { kind: 'menu', id, parent: null, path: scope.path },
      },
    [scope, id],
  );
  const anchorRef = useRef<ComponentRef<typeof RNView> | null>(null);
  const { setValue } = bar;
  const focusIntent = useMenuFocusIntent();

  const context = useMemo(
    () => ({
      open: bar.value === value,
      setOpen: (next: boolean) => setValue(next ? value : undefined),
      anchorRef,
      focusIntent,
    }),
    [bar.value, value, setValue, focusIntent],
  );

  return (
    <MenubarMenuProvider value={context}>
      {inner ? <MenubarScopeProvider value={inner}>{children}</MenubarScopeProvider> : children}
    </MenubarMenuProvider>
  );
}

/**
 * A menu's trigger: it names its menu and says whether it can open, so it is
 * what registers the menu with the bar. Headless it draws nothing.
 */
export function MenubarTrigger(props: MenubarTriggerProps) {
  const scope = useMenubarScope();
  const owner = scope?.owner?.kind === 'menu' ? scope.owner : undefined;
  useMenuEntry(owner ? scope : null, {
    kind: 'menu',
    id: owner?.id,
    parent: null,
    path: owner?.path,
    label: textOf(props.children, noHint) || (props.label ?? ''),
    enabled: !props.disabled,
    shortcut: null,
  });
  if (scope?.headless) return null;
  return <MenubarTriggerButton {...props} />;
}

function MenubarTriggerButton({
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
  // Web: Enter/Space/ArrowDown open into the first row, ArrowUp into the last,
  // and focus returns here on close (`floating/menu-keyboard.ts`). Inert on
  // native, where there is no DOM node to listen on.
  useMenuTriggerKeys(menu.anchorRef, {
    open: menu.open,
    setOpen: menu.setOpen,
    disabled,
    intent: menu.focusIntent,
  });

  // `flex items-center rounded-md px-2 py-1.5`, plus `bg-accent` while its menu
  // is open, and `text-sm font-medium` for the label. A menubar trigger is a
  // BUTTON with chrome of its own, not a bare hit box — leaving it unstyled is
  // why a Bloom menubar read as loose text against a pill-per-menu bar. The
  // same chrome on both platforms, so the bar reads identically. `asChild`
  // still hands the whole thing to the caller.
  const trigger = (
    <StyledView
      className={cx(MENUBAR_TRIGGER_CLASS, menu.open && MENUBAR_TRIGGER_OPEN_CLASS, className)}
      style={{ backgroundColor: menu.open ? palette.rowHighlight : 'transparent' }}
    >
      {typeof children === 'string' ? (
        <StyledText
          className={MENUBAR_TRIGGER_TEXT_CLASS}
          // `text-body-medium text-text-primary`, in Inter.
          style={[menuType('body-medium'), { color: palette.text }]}
        >
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
      }}
    >
      {asChild ? children : trigger}
    </TriggerSlot>
  );
}
