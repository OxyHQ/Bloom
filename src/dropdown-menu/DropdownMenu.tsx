import { useMenuDensity } from '../floating/use-menu-density';
import { BloomScope } from '../appearance';
/**
 * `DropdownMenu` — NATIVE. Presents through `dialog/SheetShell`, Bloom's
 * established native-overlay convention (shared with `Select`, `ContextMenu`
 * and `Popover`): a menu is a bottom sheet on a phone and an anchored dropdown
 * on a pointer. The web fork (`DropdownMenu.web.tsx`) is the second half.
 *
 * When the app registered a platform adapter that reports `popup-surface`
 * (`BloomProvider platform={…}`), the content is instead an anchored panel in
 * the platform's popup (`floating/PopupPanel`), which may extend beyond the
 * window. The rows are the same.
 *
 * The public API is Radix/shadcn's — `open` / `defaultOpen` / `onOpenChange` on
 * the root, `asChild` on the trigger — bridged onto `Dialog`'s IMPERATIVE
 * control by `floating/use-sheet-open-bridge`, never onto its controlled
 * boolean path.
 *
 * The rows come from `floating/menu-rows`, the same set `ContextMenu` and
 * `Menubar` publish under their own prefixes.
 *
 * `activation="hover"` in a platform popup (a desktop with a pointer): the pointer resting on
 * the trigger for `openDelay` opens the menu, as a long press does; leaving the trigger and the
 * panel closes it after `closeDelay`, unless it is back on either by then or a key was used in the
 * panel (the keyboard then has it, as on the web). The popup goes on tracking the pointer over
 * the trigger while it holds its grab (`trackingRef`). The trigger's own press is unchanged.
 */
import React, { useCallback, useMemo, useRef, type ComponentRef } from 'react';
import type { PointerEvent, View } from 'react-native';

import { SheetShell } from '../dialog/SheetShell';
import { PopupPanel } from '../floating/PopupPanel';
import { usePopupSurface } from '../platform-surface/context';
import { MENU_TRIGGER_POPUP } from '../floating/constants';
import { MenuSurfaceProvider, type MenuSurfaceContextValue } from '../floating/context';
import { MenuRowAlignmentScope } from '../floating/menu-row-alignment';
import { createMenuRows } from '../floating/menu-rows';
import { createInlineMenuSub } from '../floating/menu-sub-inline';
import { TriggerSlot } from '../floating/TriggerSlot';
import { useMenuFocusIntent, useOpenFocus } from '../floating/menu-keyboard';
import { useSheetOpenBridge } from '../floating/use-sheet-open-bridge';
import { useControllableState } from '../hooks/use-controllable-state';
import { HOVER_CARD_CLOSE_DELAY, HOVER_CARD_OPEN_DELAY } from '../hover-card/constants';
import { useHoverIntent } from '../hover-card/use-hover-intent';
import { DropdownMenuProvider, useDropdownMenu } from './context';
import type {
  DropdownMenuContentProps,
  DropdownMenuProps,
  DropdownMenuTriggerProps,
} from './types';
import { useCommonMessages } from '../locale/common-messages';
import { CONTEXT_MENU_MESSAGES } from '../context-menu/messages';
import { useMessages } from '../locale/messages';

/** React Native's standard accessibility action for a long press (TalkBack's, a reader's). */
const LONG_PRESS_ACTION = 'longpress';

export function DropdownMenu({
  children,
  open,
  defaultOpen = false,
  onOpenChange,
  activation = 'click',
  openDelay = HOVER_CARD_OPEN_DELAY,
  closeDelay = HOVER_CARD_CLOSE_DELAY,
  openFocus,
}: DropdownMenuProps) {
  const [isOpen, setOpen] = useControllableState<boolean>({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  const anchorRef = useRef<ComponentRef<typeof View> | null>(null);
  // An open from the owner's keys starts with a row active in a platform popup, as on a Mac.
  const focusIntent = useMenuFocusIntent();
  useOpenFocus(focusIntent, isOpen, openFocus);
  const intent = useHoverIntent(isOpen, setOpen, openDelay, closeDelay);
  // Opened by the pointer resting on the trigger, and none of its keys used since: the pointer
  // leaving closes it. Opened any other way, only a choice, Escape or a press outside does.
  const byHover = useRef(false);
  const latestOpen = useRef(isOpen);
  latestOpen.current = isOpen;
  const primaryOpen = useRef(false);
  const setMenuOpen = useCallback(
    (next: boolean) => {
      if (next && primaryOpen.current) return;
      intent.hold();
      byHover.current = false;
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
        if (!latestOpen.current) byHover.current = true;
        intent.show();
      },
      show: () => {
        if (!primaryOpen.current) intent.show();
      },
      hide: () => {
        // A pending open is dropped; an open menu closes only if hover opened it.
        if (!latestOpen.current || byHover.current) intent.hide();
      },
      hold: intent.hold,
      dismiss: () => setMenuOpen(false),
      key: () => {
        byHover.current = false;
        intent.hold();
      },
    }),
    [intent, setMenuOpen],
  );
  const value = useMemo(
    () => ({
      open: isOpen,
      setOpen: setMenuOpen,
      anchorRef,
      focusIntent,
      activation,
      ...(activation === 'hover' ? { hover } : null),
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
  restoreFocus,
}: DropdownMenuTriggerProps) {
  const menu = useDropdownMenu();
  // Hover opens it only where it is a desktop's popup: never a phone's sheet.
  const hover = usePopupSurface() ? menu.hover : undefined;
  // A menu that opens on hover opens from the screen reader as a long press opens it, by the
  // trigger's `longpress` action ("Show menu"), as `ContextMenu`'s does.
  const { messages } = useMessages(CONTEXT_MENU_MESSAGES);
  const showMenu =
    menu.activation === 'hover' && !disabled
      ? {
          accessibilityActions: [{ name: LONG_PRESS_ACTION, label: messages.showMenu }],
          onAccessibilityAction: (event: { nativeEvent: { actionName: string } }) => {
            if (event.nativeEvent.actionName === LONG_PRESS_ACTION) menu.setOpen(true);
          },
        }
      : null;
  const primaryAction =
    pressTrigger != null ||
    (React.isValidElement<{ onPress?: unknown; href?: string }>(children) &&
      (children.props.onPress != null || children.props.href != null));

  return (
    <TriggerSlot
      asChild={asChild}
      pressTrigger={pressTrigger}
      onPrimaryOpenChange={menu.onPrimaryOpenChange}
      anchorRef={menu.anchorRef}
      restoreFocus={restoreFocus}
      onPointerEnter={
        hover
          ? (event: PointerEvent) => {
              if (pointerTypeOf(event) !== 'touch') hover.enter();
            }
          : undefined
      }
      onPointerLeave={
        hover
          ? (event: PointerEvent) => {
              if (pointerTypeOf(event) !== 'touch') hover.hide();
            }
          : undefined
      }
      className={className}
      style={style}
      testID={testID}
      handle={{
        onPress: () => menu.setOpen(menu.activation !== 'hover' || !primaryAction),
        onLongPress: menu.activation === 'hover' ? () => menu.setOpen(true) : undefined,
        ...showMenu,
        disabled,
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
  alignRows,
  size,
  label: labelProp,
  side,
  align,
  sideOffset,
  alignOffset,
  minWidth,
  maxWidth,
  maxHeight,
  className,
  style,
  testID,
}: DropdownMenuContentProps) {
  const density = useMenuDensity(size);
  const common = useCommonMessages();
  const label = labelProp ?? common.menu;
  const menu = useDropdownMenu();
  const PopupSurface = usePopupSurface();
  const { control, onSheetClose } = useSheetOpenBridge(menu.open, menu.setOpen);
  const surface = useMemo<MenuSurfaceContextValue>(
    () => ({ close: () => menu.setOpen(false), presentation: PopupSurface ? 'dropdown' : 'sheet' }),
    [menu, PopupSurface],
  );

  if (PopupSurface) {
    // The platform's popup: mounted while open, closed by the platform on an
    // outside press (or a refused grab), which closes the menu.
    return menu.open ? (
      <BloomScope size={size}>
        <PopupPanel
          PopupSurface={PopupSurface}
          anchorRef={menu.anchorRef}
          side={side}
          align={align}
          sideOffset={sideOffset}
          alignOffset={alignOffset}
          role="menu"
          label={label}
          focusIntent={menu.focusIntent}
          onDismiss={() => menu.setOpen(false)}
          onClose={() => menu.setOpen(false)}
          // Hover: the pointer over the trigger goes on reaching it while the popup is open, and
          // the pointer on the panel or a key in it keeps the menu open.
          trackingRef={menu.hover ? menu.anchorRef : undefined}
          onPointerEnter={menu.hover?.hold}
          onPointerLeave={menu.hover?.hide}
          onKey={menu.hover?.key}
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
    ) : null;
  }

  return (
    <BloomScope size={size}>
      <SheetShell
        anchored
        control={control}
        label={label}
        onClose={onSheetClose}
        contentClassName={className}
        contentStyle={[{ gap: density.gap }, style]}
        contentTestID={testID}
      >
        <MenuSurfaceProvider value={surface}>
          <MenuRowAlignmentScope enabled={alignRows}>{children}</MenuRowAlignmentScope>
        </MenuSurfaceProvider>
      </SheetShell>
    </BloomScope>
  );
}

/** A pointer event's kind (`mouse`, `pen`, `touch`). */
function pointerTypeOf(event: PointerEvent): string | undefined {
  return event.nativeEvent?.pointerType;
}

const rows = createMenuRows('DropdownMenu', createInlineMenuSub);

export const DropdownMenuItem = rows.Item;
export const DropdownMenuCheckboxItem = rows.CheckboxItem;
export const DropdownMenuRadioGroup = rows.RadioGroup;
export const DropdownMenuRadioItem = rows.RadioItem;
export const DropdownMenuLabel = rows.Label;
export const DropdownMenuSeparator = rows.Separator;
export const DropdownMenuShortcut = rows.Shortcut;
export const DropdownMenuGroup = rows.Group;
export const DropdownMenuSwatchRow = rows.SwatchRow;
export const DropdownMenuSub = rows.Sub;
export const DropdownMenuSubTrigger = rows.SubTrigger;
export const DropdownMenuSubContent = rows.SubContent;
