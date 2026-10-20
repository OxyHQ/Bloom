import { BloomScope } from '../appearance';
/**
 * `DropdownMenu` — WEB. An anchored panel rather than a sheet, positioned,
 * portaled, ranked and dismissed by `floating/FloatingPanel`.
 *
 * Only the shell forks. The rows are the same universal
 * `floating/menu-rows` set the native file publishes; what changes between the
 * two is stated once, as `presentation`.
 */
import React, { useCallback, useMemo, useRef, useState, type ComponentRef } from 'react';
import type { View } from 'react-native';

import { MENU_MIN_WIDTH_CLASS, MENU_TRIGGER_POPUP } from '../floating/constants';
import { MenuSurfaceProvider, type MenuSurfaceContextValue } from '../floating/context';
import { FloatingPanel } from '../floating/FloatingPanel';
import {
  hostElement,
  useMenuFocusIntent,
  useMenuPanelKeys,
  useMenuTriggerKeys,
} from '../floating/menu-keyboard';
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
import { useCommonMessages } from '../locale/common-messages';
import { useHoverIntent } from '../hover-card/use-hover-intent';
import { HOVER_CARD_OPEN_DELAY, HOVER_CARD_CLOSE_DELAY } from '../hover-card/constants';
import { useHoverMenuTrigger, useHoverMenuPanel } from './use-hover-menu';

export function DropdownMenu({
  children,
  open,
  defaultOpen = false,
  onOpenChange,
  activation = 'click',
  openDelay = HOVER_CARD_OPEN_DELAY,
  closeDelay = HOVER_CARD_CLOSE_DELAY,
}: DropdownMenuProps) {
  const [isOpen, setOpen] = useControllableState<boolean>({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  const anchorRef = useRef<ComponentRef<typeof View> | null>(null);
  const focusIntent = useMenuFocusIntent();
  const panelRef = useRef<ComponentRef<typeof View> | null>(null);
  const intent = useHoverIntent(isOpen, setOpen, openDelay, closeDelay);
  const suppressed = useRef(false);
  const primaryOpen = useRef(false);
  const setMenuOpen = useCallback(
    (next: boolean) => {
      if (next && primaryOpen.current) return;
      intent.hold();
      suppressed.current = !next;
      setOpen(next);
    },
    [intent, setOpen],
  );
  const onPrimaryOpenChange = useCallback(
    (next: boolean) => {
      primaryOpen.current = next;
      if (next) setMenuOpen(false);
    },
    [setMenuOpen],
  );
  const hover = useMemo(
    () => ({
      enter: () => {
        if (primaryOpen.current) return;
        suppressed.current = false;
        intent.show();
      },
      show: () => {
        if (!suppressed.current && !primaryOpen.current) intent.show();
      },
      hide: intent.hide,
      hold: intent.hold,
      dismiss: () => setMenuOpen(false),
    }),
    [intent, setMenuOpen],
  );
  const value = useMemo(
    () => ({
      open: isOpen,
      setOpen: setMenuOpen,
      anchorRef,
      panelRef,
      focusIntent,
      activation,
      hover,
      onPrimaryOpenChange,
    }),
    [isOpen, setMenuOpen, focusIntent, activation, hover, onPrimaryOpenChange],
  );

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
  pressTrigger,
}: DropdownMenuTriggerProps) {
  const menu = useDropdownMenu();
  const blocked =
    disabled === true ||
    (React.isValidElement<{ disabled?: boolean }>(children) && children.props.disabled === true);
  const primaryAction =
    pressTrigger != null ||
    (React.isValidElement<{ onPress?: unknown; href?: string }>(children) &&
      (children.props.onPress != null || children.props.href != null));
  useHoverMenuTrigger(menu, blocked, primaryAction);
  // Web: Enter/Space/ArrowDown open into the first row, ArrowUp into the last,
  // and focus comes back here when the menu closes (`floating/menu-keyboard.ts`).
  useMenuTriggerKeys(menu.anchorRef, {
    open: menu.open,
    setOpen: menu.setOpen,
    disabled: blocked,
    intent: menu.focusIntent,
  });

  return (
    <TriggerSlot
      asChild={asChild}
      pressTrigger={pressTrigger}
      onPrimaryOpenChange={menu.onPrimaryOpenChange}
      anchorRef={menu.anchorRef}
      className={className}
      style={style}
      testID={testID}
      handle={{
        // A dropdown trigger TOGGLES: pressing an open menu's trigger closes it
        // rather than reopening it, which is what a pointer user expects and
        // what the native sheet gets for free from its backdrop.
        onPress: () =>
          menu.setOpen(menu.activation === 'hover' && primaryAction ? false : !menu.open),
        onLongPress: menu.activation === 'hover' ? () => menu.setOpen(true) : undefined,
        disabled: blocked,
        accessibilityLabel: label,
        accessibilityRole: menu.activation === 'hover' && asChild ? undefined : 'button',
        'aria-haspopup': MENU_TRIGGER_POPUP,
        'aria-expanded': menu.open,
      }}
    >
      {children}
    </TriggerSlot>
  );
}

export function DropdownMenuContent({
  children,
  size,
  maxHeight,
  label: labelProp,
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
  const common = useCommonMessages();
  const label = labelProp ?? common.menu;
  const menu = useDropdownMenu();
  const anchor = useAnchorRect(menu.anchorRef, menu.open);
  const close = useCallback(() => menu.setOpen(false), [menu]);
  const surface = useMemo<MenuSurfaceContextValue>(
    () => ({ close, presentation: 'dropdown' }),
    [close],
  );
  // Arrows, Home/End, Space and Tab inside the open menu, and the keyboard
  // open's landing row (`floating/menu-keyboard.ts`).
  const [panel, setPanel] = useState<ComponentRef<typeof View> | null>(null);
  const attachPanel = useCallback(
    (node: ComponentRef<typeof View> | null) => {
      if (menu.panelRef) menu.panelRef.current = node;
      setPanel(node);
    },
    [menu.panelRef],
  );
  useHoverMenuPanel(menu, hostElement(panel));
  useMenuPanelKeys(hostElement(panel), { open: menu.open, onTab: close, intent: menu.focusIntent });

  return (
    <BloomScope size={size}>
      <FloatingPanel
        maxHeight={maxHeight}
        modal={menu.activation === 'hover' ? false : undefined}
        onPointerEnter={menu.activation === 'hover' ? menu.hover?.hold : undefined}
        onPointerLeave={
          menu.activation === 'hover'
            ? () => {
                if (!hostElement(panel)?.contains(document.activeElement)) menu.hover?.hide();
              }
            : undefined
        }
        panelRef={attachPanel}
        open={menu.open}
        anchor={anchor}
        role="menu"
        surface="menu"
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
        testID={testID}
      >
        <MenuSurfaceProvider value={surface}>{children}</MenuSurfaceProvider>
      </FloatingPanel>
    </BloomScope>
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
