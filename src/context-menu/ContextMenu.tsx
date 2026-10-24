import { useMenuDensity } from '../floating/use-menu-density';
import { BloomScope } from '../appearance';
/**
 * `ContextMenu` — NATIVE. A LONG PRESS opens the same bottom sheet
 * `DropdownMenu` presents, because a phone has no right-click and no cursor to
 * anchor to. The web fork (`ContextMenu.web.tsx`) is the second half and anchors
 * at the click point instead.
 *
 * The rows are `floating/menu-rows`, published here under shadcn's
 * `ContextMenu*` names — one implementation, three families.
 */
import React, { useCallback, useMemo, useState } from 'react';
import type { GestureResponderEvent } from 'react-native';

import { SheetShell } from '../dialog/SheetShell';
import { MENU_TRIGGER_POPUP } from '../floating/constants';
import { MenuSurfaceProvider, type MenuSurfaceContextValue } from '../floating/context';
import { createMenuRows } from '../floating/menu-rows';
import { createInlineMenuSub } from '../floating/menu-sub-inline';
import { LongPressArea } from '../floating/LongPressArea';
import { TriggerSlot } from '../floating/TriggerSlot';
import { useSheetOpenBridge } from '../floating/use-sheet-open-bridge';
import type { FloatingAnchor } from '../floating/types';
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
  const [ownOpen, setOwnOpen] = useState(false);
  const controlledAnchor = useControlledAnchor(anchorProp);
  const controlled = controlledAnchor !== undefined;
  // A controlled anchor presents the sheet exactly while it is non-null; its
  // position means nothing to a sheet, which anchors to the screen.
  const open = controlled ? controlledAnchor !== null : ownOpen;

  const value = useMemo(
    () => ({
      open,
      // Native ignores the anchor: a sheet is not anchored to the press. The
      // press point is still reported, for a controlled caller to store.
      openAt: (next: FloatingAnchor | null) => {
        if (!controlled) setOwnOpen(true);
        onOpenChange?.(true);
        onAnchorChange?.(next ? pointAnchor(next) : { x: 0, y: 0 });
      },
      close: () => {
        if (!controlled) setOwnOpen(false);
        onOpenChange?.(false);
        onAnchorChange?.(null);
      },
      anchor: null,
    }),
    [open, controlled, onOpenChange, onAnchorChange],
  );

  return <ContextMenuProvider value={value}>{children}</ContextMenuProvider>;
}

function pressPoint(event: GestureResponderEvent | undefined): FloatingAnchor | null {
  const x = event?.nativeEvent?.pageX;
  const y = event?.nativeEvent?.pageY;
  if (typeof x !== 'number' || typeof y !== 'number') return null;
  return { top: y, bottom: y, left: x, right: x };
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

  // Without `asChild` the trigger is Bloom's own, and it is a `LongPressArea`
  // rather than TriggerSlot's `Pressable`: a Pressable holds the touch
  // responder, which on Android keeps a horizontal ScrollView inside the
  // trigger (a code block in a chat turn) from ever scrolling.
  return (
    <TriggerSlot
      asChild
      className={className}
      style={style}
      testID={testID}
      handle={{
        // A press does nothing — a context menu opens on a LONG press, and the
        // trigger's own content keeps whatever tap behaviour it had. `onPress`
        // is required by the handle shape, so it is explicitly a no-op rather
        // than absent.
        onPress: () => {},
        onLongPress: (event) => menu.openAt(pressPoint(event)),
        disabled,
        accessibilityLabel: label,
        accessibilityRole: 'button',
        'aria-haspopup': MENU_TRIGGER_POPUP,
        'aria-expanded': menu.open,
      }}
    >
      {asChild ? children : <LongPressArea>{children}</LongPressArea>}
    </TriggerSlot>
  );
}

export function ContextMenuContent({
  children,
  size,
  label: labelProp,
  style,
}: ContextMenuContentProps) {
  const density = useMenuDensity(size);
  const { messages } = useMessages(CONTEXT_MENU_MESSAGES);
  const label = labelProp ?? messages.contextMenu;
  const menu = useContextMenu();
  const setOpen = useCallback(
    (next: boolean) => {
      if (!next) menu.close();
    },
    [menu],
  );
  const { control, onSheetClose } = useSheetOpenBridge(menu.open, setOpen);
  const surface = useMemo<MenuSurfaceContextValue>(
    () => ({ close: menu.close, presentation: 'sheet' }),
    [menu.close],
  );

  return (
    <BloomScope size={size}>
      <SheetShell
        control={control}
        label={label}
        onClose={onSheetClose}
        contentStyle={[{ gap: density.gap }, style]}
      >
        <MenuSurfaceProvider value={surface}>{children}</MenuSurfaceProvider>
      </SheetShell>
    </BloomScope>
  );
}

const rows = createMenuRows('ContextMenu', createInlineMenuSub);

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
