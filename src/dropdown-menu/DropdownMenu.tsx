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
import { View } from 'react-native';

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
  const primaryOpen = useRef(false);
  const setMenuOpen = useCallback(
    (next: boolean) => {
      if (!next || !primaryOpen.current) setOpen(next);
    },
    [setOpen],
  );
  const onPrimaryOpenChange = useCallback(
    (next: boolean) => {
      primaryOpen.current = next;
      if (next) setOpen(false);
    },
    [setOpen],
  );
  const glass = useGlassMenu(children, isOpen, setMenuOpen);
  const value = useMemo(
    () => ({
      open: isOpen,
      setOpen: setMenuOpen,
      anchorRef,
      focusIntent,
      activation,
      onPrimaryOpenChange,
      glass,
    }),
    [isOpen, setMenuOpen, focusIntent, activation, onPrimaryOpenChange, glass],
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
