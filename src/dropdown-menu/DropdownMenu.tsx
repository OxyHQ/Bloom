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
import React, {
  Children,
  Fragment,
  isValidElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ComponentRef,
  type ReactElement,
  type ReactNode,
} from 'react';
import { View, type PointerEvent } from 'react-native';

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
import {
  GLASS_MENU_ICON_HOST_ID,
  getNativeGlassMenu,
  type GlassMenuNativeHandle,
  type GlassMenuNativeItem,
} from '../floating/glass-menu/native-glass-menu';
import { parseGlassMenu } from '../floating/glass-menu/parse-glass-menu';
import { useGlassPrimary } from '../floating/glass-menu/use-glass-primary';
import { useTheme } from '../theme/use-theme';
import { useMenuPalette } from '../floating/menu-palette';
import { DropdownMenuProvider, useDropdownMenu, type DropdownMenuGlass } from './context';
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

/** The `DropdownMenuContent` element among a root's children, looking through fragments only. */
function findContent(children: ReactNode): ReactElement<DropdownMenuContentProps> | null {
  for (const child of Children.toArray(children)) {
    if (!isValidElement(child)) continue;
    if (child.type === DropdownMenuContent) return child as ReactElement<DropdownMenuContentProps>;
    if (child.type === Fragment) {
      const inner = findContent((child.props as { children?: ReactNode }).children);
      if (inner) return inner;
    }
  }
  return null;
}

/**
 * The menu as the native glass menu takes it (Android 13+, in a binary that has Bloom's module),
 * or `undefined` when it cannot: the menu then keeps its sheet. Rows outside the glass menu's
 * vocabulary (see `parseGlassMenu`) also keep the sheet.
 */
function useGlassMenu(
  children: ReactNode,
  isOpen: boolean,
  setOpen: (open: boolean) => void,
): DropdownMenuGlass | undefined {
  const available = getNativeGlassMenu() != null;
  const nativeRef = useRef<GlassMenuNativeHandle | null>(null);
  const nativeOpen = useRef(false);
  const content = available ? findContent(children) : null;
  const parsed = content ? parseGlassMenu(content.props.children, rows) : null;

  const handlers = useRef(parsed?.handlers ?? {});
  handlers.current = parsed?.handlers ?? {};
  const itemsKey = parsed ? JSON.stringify(parsed.items) : '';
  const items = useMemo<GlassMenuNativeItem[] | undefined>(
    () => (itemsKey ? JSON.parse(itemsKey) : undefined),
    [itemsKey],
  );
  const icons = parsed?.icons;
  const select = useCallback((id: string) => handlers.current[id]?.(), []);
  const openChange = useCallback(
    (next: boolean) => {
      nativeOpen.current = next;
      setOpen(next);
    },
    [setOpen],
  );

  // An open or close the owner makes through the `open` prop reaches the native menu here; the
  // native menu's own opens and closes arrive through `openChange` first and find nothing to do.
  const present = items != null;
  useEffect(() => {
    if (!present || isOpen === nativeOpen.current) return;
    nativeOpen.current = isOpen;
    void (isOpen ? nativeRef.current?.open() : nativeRef.current?.close());
  }, [present, isOpen]);

  return useMemo(
    () =>
      items && icons
        ? {
            items,
            icons,
            handlers: handlers.current,
            nativeRef,
            select,
            openChange,
          }
        : undefined,
    [items, icons, select, openChange],
  );
}

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
  const glass = useGlassMenu(children, isOpen, setMenuOpen);
  const value = useMemo(
    () => ({
      open: isOpen,
      setOpen: setMenuOpen,
      anchorRef,
      focusIntent,
      activation,
      ...(activation === 'hover' ? { hover } : null),
      onPrimaryOpenChange,
      glass,
    }),
    [isOpen, setMenuOpen, focusIntent, activation, hover, onPrimaryOpenChange, glass],
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
  glassTone = 'neutral',
  glassTint,
  glass: glassTrigger = false,
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

  const trigger = (
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
        onPress: () => {
          const open = menu.activation !== 'hover' || !primaryAction;
          // The native menu morphs out of the touch that opened it: open it here, not through state.
          if (open && menu.glass) void menu.glass.nativeRef.current?.open();
          else menu.setOpen(open);
        },
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
  if (!menu.glass || !getNativeGlassMenu()) return trigger;
  return (
    <GlassTrigger
      glass={menu.glass}
      triggerGlass={glassTrigger || glassTone === 'primary' || glassTint != null}
      tone={glassTone}
      tint={glassTint}
    >
      {trigger}
    </GlassTrigger>
  );
}

/**
 * The native glass view around a trigger. It reads the theme, so it is a component of its own:
 * only a menu the native glass menu presents mounts it, and every other menu stays free of the
 * theme (as the sheet always was).
 */
function GlassTrigger({
  glass,
  triggerGlass,
  tone,
  tint,
  children,
}: {
  glass: DropdownMenuGlass;
  triggerGlass: boolean;
  tone: 'neutral' | 'primary';
  tint?: string;
  children: ReactNode;
}) {
  const NativeGlassMenu = getNativeGlassMenu();
  const dark = useTheme().isDark;
  const primary = useGlassPrimary().color;
  const { surface, border, text, textSecondary, destructive, trigger } = useMenuPalette();
  // Bloom's menu palette colours the glass: its surface tints the panel, its ink draws the rows.
  const config = useMemo(
    () => ({
      tintColor: surface,
      tintOpacity: dark ? 0.72 : 0.6,
      textColor: text,
      mutedColor: textSecondary,
      destructiveColor: destructive,
      separatorColor: border,
    }),
    [surface, border, text, textSecondary, destructive, dark],
  );
  const triggerConfig = tint
    ? { tintColor: tint, tintOpacity: 0.96 }
    : tone === 'primary'
      ? { tintColor: primary, tintOpacity: 0.96 }
      : { tintColor: trigger.background, tintOpacity: 0.5 };
  if (!NativeGlassMenu) return <>{children}</>;
  return (
    <NativeGlassMenu
      ref={glass.nativeRef}
      items={glass.items}
      glass={triggerGlass}
      colorScheme={dark ? 'dark' : 'light'}
      config={config}
      triggerConfig={triggerConfig}
      style={glassTriggerStyle}
      onItemSelect={(event) => glass.select(event.nativeEvent.id)}
      onMenuOpenChange={(event) => glass.openChange(event.nativeEvent.open)}
    >
      {children}
      <View
        nativeID={GLASS_MENU_ICON_HOST_ID}
        collapsable={false}
        pointerEvents="none"
        style={glassIconHostStyle}
      >
        {glass.icons.map((icon, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: the slot index is the identity the native side uses
          <View key={index} collapsable={false} style={glassIconSlotStyle}>
            {icon}
          </View>
        ))}
      </View>
    </NativeGlassMenu>
  );
}

const glassTriggerStyle = { alignSelf: 'flex-start' } as const;
const glassIconHostStyle = { position: 'absolute', left: 0, top: 0 } as const;
const glassIconSlotStyle = { alignSelf: 'flex-start' } as const;

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

  // The native glass menu draws the rows itself; the trigger hosts it.
  if (menu.glass) return null;

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
