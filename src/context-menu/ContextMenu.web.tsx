import { BloomScope } from '../appearance';
/**
 * `ContextMenu` — WEB. Right-click opens the menu AT THE CURSOR: the anchor is
 * the click point, a zero-area box, which `overlay/dropdown-placement` already
 * handles as one end of the same fit/flip/clamp it does for a trigger's rect.
 *
 * Everything below the anchor — portal, overlay rank, dismiss layer, placement —
 * is `floating/FloatingPanel`, shared with the other three anchored families.
 *
 * The `anchor` prop hands the same point in from outside (a menu opened by
 * code, with no element to right-click), and the rest is identical.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import type { View } from 'react-native';

import { MENU_MIN_WIDTH_CLASS, MENU_TRIGGER_POPUP } from '../floating/constants';
import { MenuSurfaceProvider, type MenuSurfaceContextValue } from '../floating/context';
import { FloatingPanel } from '../floating/FloatingPanel';
import {
  hostElement,
  isInMenuSurface,
  useMenuFocusIntent,
  useMenuPanelKeys,
  useRestoreFocusOnClose,
  useReturnFocusOnClose,
} from '../floating/menu-keyboard';
import { createMenuRows } from '../floating/menu-rows';
import { createFlyoutMenuSub } from '../floating/menu-sub-flyout';
import { cx } from '../floating/shared';
import { TriggerSlot } from '../floating/TriggerSlot';
import type { FloatingAnchor } from '../floating/types';
import { useIsomorphicLayoutEffect } from '../theme/use-isomorphic-layout-effect';
import { ContextMenuProvider, useContextMenu } from './context';
import { pointAnchor, useControlledAnchor } from './shared';
import type { ContextMenuContentProps, ContextMenuProps, ContextMenuTriggerProps } from './types';
import { useMessages } from '../locale/messages';
import { CONTEXT_MENU_MESSAGES } from './messages';

export function ContextMenu({
  children,
  anchor: anchorProp,
  onOpenChange,
  onAnchorChange,
}: ContextMenuProps) {
  const [ownAnchor, setOwnAnchor] = useState<FloatingAnchor | null>(null);
  const controlledAnchor = useControlledAnchor(anchorProp);
  const controlled = controlledAnchor !== undefined;
  const anchor = controlled ? controlledAnchor : ownAnchor;
  const open = anchor !== null;
  const focusIntent = useMenuFocusIntent();

  // A controlled open is a menu opened by code, and opens the way a desktop
  // menu does: focus on the PANEL with no row highlighted, so the keys act at
  // once and ↓ lands on the first row. A NEW position while open is a new open
  // too. Layout phase, so the intent is set before the panel's passive effect
  // looks for it.
  const { request } = focusIntent;
  useIsomorphicLayoutEffect(() => {
    if (controlledAnchor) request('panel');
  }, [controlledAnchor, request]);

  // With no trigger to return to, focus goes back to wherever it was before
  // the menu took it — read in the layout phase of the opening commit, before
  // the panel focuses its first row. A mounted trigger's own return runs FIRST
  // (a child's effects precede its parent's), so this finds focus already back
  // on the trigger and leaves it there.
  const focusBeforeOpen = useRef<HTMLElement | null>(null);
  useIsomorphicLayoutEffect(() => {
    if (!open || typeof document === 'undefined') return;
    const active = document.activeElement as HTMLElement | null;
    focusBeforeOpen.current =
      active && active !== document.body && !isInMenuSurface(active) ? active : null;
  }, [open]);
  const focusTargetBeforeOpen = useCallback(() => {
    const target = focusBeforeOpen.current;
    return target?.isConnected ? target : null;
  }, []);
  useRestoreFocusOnClose(focusTargetBeforeOpen, open, isInMenuSurface);

  const value = useMemo(
    () => ({
      // The anchor IS the open state: a context menu with nowhere to sit is not
      // open, and two facts that must always agree are better kept as one.
      // Controlled, the caller owns that one fact and is asked to change it.
      open,
      openAt: (next: FloatingAnchor | null) => {
        if (!controlled) setOwnAnchor(next);
        onOpenChange?.(next !== null);
        onAnchorChange?.(next ? pointAnchor(next) : null);
      },
      close: () => {
        if (!controlled) setOwnAnchor(null);
        onOpenChange?.(false);
        onAnchorChange?.(null);
      },
      anchor,
      focusIntent,
    }),
    [open, anchor, controlled, onOpenChange, onAnchorChange, focusIntent],
  );

  return <ContextMenuProvider value={value}>{children}</ContextMenuProvider>;
}

export function ContextMenuTrigger({
  children,
  asChild,
  disabled,
  label,
  className,
  style,
  testID,
}: ContextMenuTriggerProps) {
  const menu = useContextMenu();
  const wrapperRef = useRef<ComponentRef<typeof View> | null>(null);
  const { openAt, focusIntent } = menu;
  // Focus returns here when the menu closes with it inside (`menu-keyboard.ts`).
  useReturnFocusOnClose(wrapperRef, menu.open, isInMenuSurface);

  // A DOM subscription, not derived state: `contextmenu` has no React Native
  // prop and react-native-web filters unknown props off a `View`, so the only
  // way to hear a right-click is to listen on the element itself. The listener
  // goes on the WRAPPER `TriggerSlot` already renders, so it covers the child
  // whether or not `asChild` replaced Bloom's own pressable.
  useEffect(() => {
    if (disabled) return;
    const element = wrapperRef.current as unknown as HTMLElement | null;
    if (typeof element?.addEventListener !== 'function') return;

    const onContextMenu = (event: MouseEvent) => {
      event.preventDefault();
      // A context menu takes focus on its first row however it opened — the
      // right-click is the only way in, and without focus in the panel its
      // arrows and Escape have nothing to act on. A pointer open paints no
      // ring: the rows highlight on `:focus-visible` only.
      if (focusIntent) focusIntent.edge.current = 'first';
      openAt({
        top: event.clientY,
        bottom: event.clientY,
        left: event.clientX,
        right: event.clientX,
      });
    };
    element.addEventListener('contextmenu', onContextMenu);
    return () => element.removeEventListener('contextmenu', onContextMenu);
  }, [openAt, disabled, focusIntent]);

  return (
    <TriggerSlot
      asChild={asChild}
      anchorRef={wrapperRef}
      className={className}
      style={style}
      testID={testID}
      handle={{
        // Left-click is not how a context menu opens. The child keeps whatever
        // press behaviour it brought.
        onPress: () => {},
        disabled,
        accessibilityLabel: label,
        accessibilityRole: 'button',
        'aria-haspopup': MENU_TRIGGER_POPUP,
        'aria-expanded': menu.open,
      }}
    >
      {children}
    </TriggerSlot>
  );
}

export function ContextMenuContent({
  children,
  size,
  maxHeight,
  label: labelProp,
  side,
  align = 'start',
  // A context menu opens AT the cursor, not offset from it: the anchor is the
  // point itself, so any gap would leave the menu visibly detached from the
  // click. The other three families keep shadcn's `sideOffset={4}`.
  sideOffset = 0,
  alignOffset,
  dismissible,
  minWidth,
  maxWidth,
  className,
  style,
  testID,
}: ContextMenuContentProps) {
  const { messages } = useMessages(CONTEXT_MENU_MESSAGES);
  const label = labelProp ?? messages.contextMenu;
  const menu = useContextMenu();
  const surface = useMemo<MenuSurfaceContextValue>(
    () => ({ close: menu.close, presentation: 'dropdown' }),
    [menu.close],
  );
  const onDismiss = useCallback(() => menu.close(), [menu]);
  const [panel, setPanel] = useState<ComponentRef<typeof View> | null>(null);
  useMenuPanelKeys(hostElement(panel), {
    open: menu.open,
    onTab: onDismiss,
    intent: menu.focusIntent,
  });

  return (
    <BloomScope size={size}>
      <FloatingPanel
        maxHeight={maxHeight}
        panelRef={setPanel}
        open={menu.open}
        anchor={menu.anchor}
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
        onDismiss={onDismiss}
        className={cx(MENU_MIN_WIDTH_CLASS, className)}
        style={style}
        testID={testID}
      >
        <MenuSurfaceProvider value={surface}>{children}</MenuSurfaceProvider>
      </FloatingPanel>
    </BloomScope>
  );
}

const rows = createMenuRows('ContextMenu', createFlyoutMenuSub);

export const ContextMenuItem = rows.Item;
export const ContextMenuCheckboxItem = rows.CheckboxItem;
export const ContextMenuRadioGroup = rows.RadioGroup;
export const ContextMenuRadioItem = rows.RadioItem;
export const ContextMenuLabel = rows.Label;
export const ContextMenuSeparator = rows.Separator;
export const ContextMenuShortcut = rows.Shortcut;
export const ContextMenuGroup = rows.Group;
export const ContextMenuSub = rows.Sub;
export const ContextMenuSubTrigger = rows.SubTrigger;
export const ContextMenuSubContent = rows.SubContent;
