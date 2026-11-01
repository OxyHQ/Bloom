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
 *    window, as the web fork reads it, or a box there: the anchor view's own
 *    frame anchors the menu to that view, as a menu button's does.
 *  - **Otherwise** (a phone): a LONG PRESS opens the same bottom sheet
 *    `DropdownMenu` presents, because a phone has no right-click and no cursor
 *    to anchor to.
 * The trigger also declares React Native's `longpress` accessibility action,
 * named "Show menu" in the locale: TalkBack's long press, a screen reader's
 * custom action, or the platform's Menu key and Shift+F10 on the focused
 * control open the menu at the trigger, as Finder's Control-Return opens it
 * at the selection. A controlled caller is asked with the trigger's frame and
 * may anchor it elsewhere (at the item the keyboard selected).
 *
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
import type {
  AccessibilityActionEvent,
  GestureResponderEvent,
  PointerEvent,
  View,
} from 'react-native';

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

/** React Native's standard accessibility action for a long press (TalkBack's). */
const LONG_PRESS_ACTION = 'longpress';

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
  const { openAt, anchorRef } = menu;
  const { messages } = useMessages(CONTEXT_MENU_MESSAGES);

  // The long press an assistive technology performs (or the platform's Menu
  // key on the focused control) has no point: the menu opens at the view it
  // hangs from, its frame measured in the window as a pointer's point is.
  const onAccessibilityAction = useCallback(
    (event: AccessibilityActionEvent) => {
      if (disabled || event.nativeEvent.actionName !== LONG_PRESS_ACTION) return;
      const view = anchorRef?.current;
      if (!view) {
        openAt(null);
        return;
      }
      view.measureInWindow((x, y, width, height) =>
        openAt({ top: y, bottom: y + height, left: x, right: x + width }),
      );
    },
    [disabled, openAt, anchorRef],
  );
  const accessibilityActions = useMemo(
    () => (disabled ? undefined : [{ name: LONG_PRESS_ACTION, label: messages.showMenu }]),
    [disabled, messages.showMenu],
  );

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
      // A context menu's area is no disclosure: it says it has a menu, and
      // claims no expanded state (Android's long-pressable views have none, nor
      // an ARIA context menu's area), but screen-reader focus still comes back
      // to it as its menu closes — unless the menu hangs from a view of the caller's, which gets
      // it back instead (`ContextMenu`).
      open={menu.open}
      restoreFocus={menu.anchorRef === menu.triggerRef}
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
        accessibilityActions,
        onAccessibilityAction,
      }}
    >
      {asChild ? children : <LongPressArea>{children}</LongPressArea>}
    </TriggerSlot>
  );
}

/** The anchor view's frame in the window, measured as the menu opens. */
interface Frame {
  x: number;
  y: number;
  width: number;
  height: number;
}

function useTriggerOrigin(
  open: boolean,
  triggerRef: React.RefObject<ComponentRef<typeof View> | null> | undefined,
): Frame | null {
  const [origin, setOrigin] = useState<Frame | null>(null);
  useLayoutEffect(() => {
    if (!open) {
      setOrigin(null);
      return;
    }
    const trigger = triggerRef?.current;
    if (!trigger) return;
    trigger.measureInWindow((x, y, width, height) => setOrigin({ x, y, width, height }));
  }, [open, triggerRef]);
  return origin;
}

/** Within this much of each other, two edges measured in the window are the same edge. */
const SAME_EDGE = 1;

/**
 * Where in the anchor view a platform popup opens: nowhere in particular (its
 * frame, as a menu button's menu) when the anchor is the view's own frame;
 * otherwise a point in it — a pointer's point, or the edge of the box the
 * anchor gives that the menu opens from (below an item, from its start).
 */
function popupPoint(
  anchor: FloatingAnchor,
  origin: Frame,
  side: NonNullable<ContextMenuContentProps['side']>,
  align: NonNullable<ContextMenuContentProps['align']>,
): { x: number; y: number } | undefined {
  const isFrame =
    Math.abs(anchor.left - origin.x) <= SAME_EDGE &&
    Math.abs(anchor.top - origin.y) <= SAME_EDGE &&
    Math.abs(anchor.right - (origin.x + origin.width)) <= SAME_EDGE &&
    Math.abs(anchor.bottom - (origin.y + origin.height)) <= SAME_EDGE;
  if (isFrame && anchor.right > anchor.left && anchor.bottom > anchor.top) return undefined;
  const along = (start: number, end: number) =>
    align === 'start' ? start : align === 'end' ? end : (start + end) / 2;
  const vertical = side === 'top' || side === 'bottom';
  const x = vertical
    ? along(anchor.left, anchor.right)
    : side === 'left'
      ? anchor.left
      : anchor.right;
  const y = vertical
    ? side === 'top'
      ? anchor.top
      : anchor.bottom
    : along(anchor.top, anchor.bottom);
  return { x: x - origin.x, y: y - origin.y };
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
          point={popupPoint(anchor, origin, side, align)}
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
