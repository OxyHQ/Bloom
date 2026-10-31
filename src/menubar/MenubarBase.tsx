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
import React, {
  Children,
  type ComponentRef,
  Fragment,
  isValidElement,
  type ReactNode,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import { type PointerEvent, StyleSheet, type View as RNView } from 'react-native';
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
import { useMenuFocusIntent, useMenuTriggerKeys, useOpenFocus } from '../floating/menu-keyboard';
import type { PopupNavigation } from '../floating/popup-navigation';
import { useIsomorphicLayoutEffect } from '../theme/use-isomorphic-layout-effect';
import { useControllableState } from '../hooks/use-controllable-state';
import { StyledText, StyledView } from '../styles/styled-primitives';
import { usePlatformKeyboard, usePlatformMenuBar } from '../platform-surface/context';
import {
  type MenubarMenuHandle,
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
import { useMenubarKeys } from './use-menubar-keys';
import { useMessages } from '../locale/messages';
import { MENUBAR_MESSAGES } from './messages';

const noHint = () => false;

/** The `value`s of the `MenubarMenu`s among `children`, in order, through fragments and arrays. */
function menuValues(children: ReactNode, into: string[] = []): string[] {
  Children.forEach(children, (child) => {
    if (!isValidElement<{ value?: unknown; children?: ReactNode }>(child)) return;
    if (child.type === MenubarMenu && typeof child.props.value === 'string') {
      into.push(child.props.value);
    } else if (child.type === Fragment) {
      menuValues(child.props.children, into);
    }
  });
  return into;
}

/**
 * The bar. Without the `menu-bar` capability it draws itself in the window, as
 * it always has. With it, it draws nothing: its declaration is mounted
 * headless, described to the platform's bar (`use-publish-menus.ts`), and an
 * item chosen there runs here. Either way each item's shortcut runs it
 * (`use-menu-shortcuts.ts`).
 */
export function Menubar(props: MenubarProps) {
  const {
    children,
    value,
    defaultValue,
    onValueChange,
    focusValue: focusValueProp,
    onFocusValueChange,
    label: labelProp,
    className,
    style,
    testID,
  } = props;
  const { messages } = useMessages(MENUBAR_MESSAGES);
  const label = labelProp ?? messages.menuBar;
  // Supplied is controlled, `undefined` included: it is "no menu open" (and "the keyboard
  // elsewhere"), never a hand-back to the bar's own state, which kept a menu its owner had
  // closed open.
  const [openValue, setValue] = useControllableState<string | undefined>({
    value,
    controlled: 'value' in props,
    defaultValue,
    onChange: onValueChange,
  });
  const [focusValue, setFocusValue] = useControllableState<string | undefined>({
    value: focusValueProp,
    controlled: 'focusValue' in props,
    defaultValue: undefined,
    onChange: onFocusValueChange,
  });
  const [menus] = useState(() => new Map<string, MenubarMenuHandle>());
  const barRef = useRef<ComponentRef<typeof RNView> | null>(null);
  const leave = useCallback(() => {
    if (focusValue !== undefined) setFocusValue(undefined);
  }, [focusValue, setFocusValue]);
  const switchTo = useCallback(
    (next: string) => {
      setValue(next);
      if (focusValue !== undefined) setFocusValue(next);
    },
    [setValue, focusValue, setFocusValue],
  );
  const context = useMemo(
    () => ({ value: openValue, setValue, focusValue, leave, switchTo, barRef, menus }),
    [openValue, setValue, focusValue, leave, switchTo, menus],
  );
  // The bar from the keyboard (`use-menubar-keys.ts`): its titles in the order they are declared.
  useMenubarKeys(
    {
      order: menuValues(children),
      menus,
      focusValue,
      openValue,
      setFocusValue,
      setOpenValue: setValue,
    },
    usePlatformKeyboard(),
  );
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
        ref={barRef}
        collapsable={false}
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

export function MenubarMenu({ children, value, openFocus }: MenubarMenuProps) {
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
  const navigation = useRef<PopupNavigation | null>(null);
  const { setValue, leave, menus } = bar;
  const focusIntent = useMenuFocusIntent();
  const open = bar.value === value;
  // An open from the owner's keys starts with a row active, as `DropdownMenu`'s `openFocus`.
  useOpenFocus(focusIntent, open, openFocus);
  // Its handle for the bar's keyboard; its trigger fills in its label and state.
  const handle = useRef<MenubarMenuHandle>({
    label: '',
    disabled: false,
    anchorRef,
    focusIntent,
    navigation,
  }).current;
  handle.focusIntent = focusIntent;
  useIsomorphicLayoutEffect(() => {
    menus.set(value, handle);
    return () => {
      if (menus.get(value) === handle) menus.delete(value);
    };
  }, [menus, value, handle]);

  const context = useMemo(
    () => ({
      value,
      open,
      setOpen: (next: boolean) => setValue(next ? value : undefined),
      choose: () => {
        setValue(undefined);
        leave();
      },
      anchorRef,
      focusIntent,
      navigation,
      handle,
    }),
    [open, value, setValue, leave, focusIntent, handle],
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
  const label = textOf(props.children, noHint) || (props.label ?? '');
  useMenuEntry(owner ? scope : null, {
    kind: 'menu',
    id: owner?.id,
    parent: null,
    path: owner?.path,
    label,
    enabled: !props.disabled,
    shortcut: null,
  });
  // Its name and state for the bar's keyboard (typeahead, skipping a disabled menu).
  const { handle } = useMenubarMenu();
  handle.label = label;
  handle.disabled = !!props.disabled;
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
  const bar = useMenubar();
  const palette = useMenuPalette();
  // Its title has the bar's keyboard: lit as an open one is, as a Mac's bar lights it.
  const focused = bar.focusValue !== undefined && bar.menus.get(bar.focusValue) === menu.handle;
  // While another menu of the bar is open, the pointer moving onto this title opens its menu in
  // that one's place, as a Mac's bar tracks the pointer across its titles: no press. Only a
  // pointer's movement is intent (a finger dragging is not, nor layout moving under a parked
  // pointer), and the title listens only while another menu is open, so a bar at rest, or over its
  // open menu's own title, costs no event.
  const tracking = bar.value !== undefined && !menu.open && !disabled;
  const { switchTo } = bar;
  const { value } = menu;
  const onPointerMove = useCallback(
    (event: PointerEvent) => {
      if (event.nativeEvent?.pointerType === 'touch') return;
      switchTo(value);
    },
    [switchTo, value],
  );
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
      style={{ backgroundColor: menu.open || focused ? palette.rowHighlight : 'transparent' }}
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
      onPointerMove={tracking ? onPointerMove : undefined}
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
