import { useMenuDensity } from '../floating/use-menu-density';
import { BloomScope } from '../appearance';
/**
 * `ContextMenu` — NATIVE. Two presentations, by what the platform can do:
 *  - **The platform's popups** (`BloomProvider platform={…}` reporting
 *    `popup-surface`: a desktop, such as an OxyOS compositor popup). The menu
 *    opens where the pointer's SECONDARY button pressed the trigger, or where a
 *    long press held it, as a desktop's context menu does: a panel in the
 *    platform's popup, anchored to the trigger at that point
 *    (`PopupSurfaceProps.point`). A controlled `anchor` is a point in the
 *    window, as the web fork reads it.
 *  - **Otherwise** (a phone): a LONG PRESS opens the same bottom sheet
 *    `DropdownMenu` presents, because a phone has no right-click and no cursor
 *    to anchor to.
 * The web fork (`ContextMenu.web.tsx`) anchors at the click point.
 *
 * The rows are `floating/menu-rows`, published here under shadcn's
 * `ContextMenu*` names — one implementation, three families.
 */
import React, {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
} from 'react';
import type { GestureResponderEvent, PointerEvent, View } from 'react-native';

import { SheetShell } from '../dialog/SheetShell';
import { MENU_TRIGGER_POPUP } from '../floating/constants';
import { MenuSurfaceProvider, type MenuSurfaceContextValue } from '../floating/context';
import { MenuRowAlignmentScope } from '../floating/menu-row-alignment';
import { createMenuRows } from '../floating/menu-rows';
import { createInlineMenuSub } from '../floating/menu-sub-inline';
import { LongPressArea } from '../floating/LongPressArea';
import { PopupPanel } from '../floating/PopupPanel';
import { TriggerSlot } from '../floating/TriggerSlot';
import { useSheetOpenBridge } from '../floating/use-sheet-open-bridge';
import type { FloatingAnchor } from '../floating/types';
import { usePopupSurface } from '../platform-surface/context';
import { useRestoreAccessibilityFocus } from '../hooks/use-accessibility-focus';
import { ContextMenuProvider, useContextMenu } from './context';
import { pointAnchor, useControlledAnchor } from './shared';
import type { ContextMenuContentProps, ContextMenuProps, ContextMenuTriggerProps } from './types';
import { useMessages } from '../locale/messages';
import { CONTEXT_MENU_MESSAGES } from './messages';

/** The secondary button of a W3C pointer event (`PointerEvent.button`). */
const SECONDARY_BUTTON = 2;

/** Where nothing says where: the window's corner (a sheet anchors to the screen anyway). */
const NOWHERE: FloatingAnchor = { top: 0, bottom: 0, left: 0, right: 0 };

export function ContextMenu({
  children,
  anchor: anchorProp,
  onOpenChange,
  onAnchorChange,
  anchorRef: anchorRefProp,
}: ContextMenuProps) {
  const PopupSurface = usePopupSurface();
  const [ownAnchor, setOwnAnchor] = useState<FloatingAnchor | null>(null);
  const controlledAnchor = useControlledAnchor(anchorProp);
  const controlled = controlledAnchor !== undefined;
  // The anchor is the open state, as on the web: a controlled anchor opens the
  // menu exactly while it is non-null.
  const anchor = controlled ? controlledAnchor : ownAnchor;
  const open = anchor !== null;
  const triggerRef = useRef<ComponentRef<typeof View> | null>(null);
  // The view the popup hangs from: the caller's, else the trigger's wrapper.
  // Only the caller's is given screen-reader focus back here; a trigger gives
  // it back itself (TriggerSlot).
  const anchorRef = anchorRefProp ?? triggerRef;
  useRestoreAccessibilityFocus(open && PopupSurface != null, anchorRef, anchorRefProp != null);

  const value = useMemo(
    () => ({
      open,
      openAt: (next: FloatingAnchor | null) => {
        const at = next ?? NOWHERE;
        if (!controlled) setOwnAnchor(at);
        onOpenChange?.(true);
        onAnchorChange?.(pointAnchor(at));
      },
      close: () => {
        if (!controlled) setOwnAnchor(null);
        onOpenChange?.(false);
        onAnchorChange?.(null);
      },
      // A sheet is not anchored to the press; a platform popup is.
      anchor: PopupSurface ? anchor : null,
      triggerRef,
      anchorRef,
    }),
    [open, anchor, controlled, onOpenChange, onAnchorChange, PopupSurface, anchorRef],
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
  const { openAt } = menu;

  // The secondary button opens the menu where it pressed, wherever in the
  // trigger: the press bubbles to the wrapper. The innermost trigger takes it,
  // so an item's menu opens rather than its list's.
  const onPointerDown = useCallback(
    (event: PointerEvent) => {
      const { button, clientX, clientY } = event.nativeEvent;
      if (disabled || button !== SECONDARY_BUTTON) return;
      event.stopPropagation();
      openAt({ top: clientY, bottom: clientY, left: clientX, right: clientX });
    },
    [disabled, openAt],
  );

  // Without `asChild` the trigger is Bloom's own, and it is a `LongPressArea`
  // rather than TriggerSlot's `Pressable`: a Pressable holds the touch
  // responder, which on Android keeps a horizontal ScrollView inside the
  // trigger (a code block in a chat turn) from ever scrolling.
  return (
    <TriggerSlot
      asChild
      anchorRef={menu.triggerRef}
      onPointerDown={onPointerDown}
      className={className}
      style={style}
      testID={testID}
      handle={{
        // A press does nothing — a context menu opens on a LONG press (or the
        // secondary button), and the trigger's own content keeps whatever tap
        // behaviour it had. `onPress` is required by the handle shape, so it
        // is explicitly a no-op rather than absent.
        onPress: () => {},
        onLongPress: (event) => openAt(pressPoint(event)),
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

/** The anchor view's top-left corner in the window, measured as the menu opens. */
function useTriggerOrigin(
  open: boolean,
  triggerRef: React.RefObject<ComponentRef<typeof View> | null> | undefined,
): { x: number; y: number } | null {
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);
  useLayoutEffect(() => {
    if (!open) {
      setOrigin(null);
      return;
    }
    const trigger = triggerRef?.current;
    if (!trigger) return;
    trigger.measureInWindow((x, y) => setOrigin({ x, y }));
  }, [open, triggerRef]);
  return origin;
}

export function ContextMenuContent({
  children,
  alignRows,
  size,
  label: labelProp,
  side = 'bottom',
  align = 'start',
  // A context menu opens AT the press, not offset from it (as the web fork).
  sideOffset = 0,
  alignOffset = 0,
  minWidth,
  maxWidth,
  maxHeight,
  className,
  style,
  testID,
}: ContextMenuContentProps) {
  const density = useMenuDensity(size);
  const { messages } = useMessages(CONTEXT_MENU_MESSAGES);
  const label = labelProp ?? messages.contextMenu;
  const menu = useContextMenu();
  const PopupSurface = usePopupSurface();
  const setOpen = useCallback(
    (next: boolean) => {
      if (!next) menu.close();
    },
    [menu],
  );
  const { control, onSheetClose } = useSheetOpenBridge(menu.open, setOpen);
  const surface = useMemo<MenuSurfaceContextValue>(
    () => ({ close: menu.close, presentation: PopupSurface ? 'dropdown' : 'sheet' }),
    [menu.close, PopupSurface],
  );
  const origin = useTriggerOrigin(menu.open && PopupSurface != null, menu.anchorRef);

  if (PopupSurface) {
    // The platform's popup, at the press: mounted while open, closed by the
    // platform on an outside press, which closes the menu.
    const anchor = menu.anchor;
    if (!menu.open || !anchor || !origin || !menu.anchorRef) return null;
    return (
      <BloomScope size={size}>
        <PopupPanel
          PopupSurface={PopupSurface}
          anchorRef={menu.anchorRef}
          point={{ x: anchor.left - origin.x, y: anchor.top - origin.y }}
          side={side}
          align={align}
          sideOffset={sideOffset}
          alignOffset={alignOffset}
          role="menu"
          label={label}
          onDismiss={() => menu.close()}
          onClose={() => menu.close()}
          minWidth={minWidth}
          maxWidth={maxWidth}
          maxHeight={maxHeight}
          className={className}
          style={style}
          testID={testID}
        >
          <MenuSurfaceProvider value={surface}>
            <MenuRowAlignmentScope enabled={alignRows}>{children}</MenuRowAlignmentScope>
          </MenuSurfaceProvider>
        </PopupPanel>
      </BloomScope>
    );
  }

  return (
    <BloomScope size={size}>
      <SheetShell
        anchored
        control={control}
        label={label}
        onClose={onSheetClose}
        contentStyle={[{ gap: density.gap }, style]}
      >
        <MenuSurfaceProvider value={surface}>
          <MenuRowAlignmentScope enabled={alignRows}>{children}</MenuRowAlignmentScope>
        </MenuSurfaceProvider>
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
