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
import React, { useCallback, useMemo, useRef, type ComponentRef } from 'react';
import type { View } from 'react-native';

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
import { DropdownMenuProvider, useDropdownMenu } from './context';
import type {
  DropdownMenuContentProps,
  DropdownMenuProps,
  DropdownMenuTriggerProps,
} from './types';
import { useCommonMessages } from '../locale/common-messages';

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
  const value = useMemo(
    () => ({
      open: isOpen,
      setOpen: setMenuOpen,
      anchorRef,
      focusIntent,
      activation,
      onPrimaryOpenChange,
    }),
    [isOpen, setMenuOpen, focusIntent, activation, onPrimaryOpenChange],
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
      className={className}
      style={style}
      testID={testID}
      handle={{
        onPress: () => menu.setOpen(menu.activation !== 'hover' || !primaryAction),
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
export const DropdownMenuSub = rows.Sub;
export const DropdownMenuSubTrigger = rows.SubTrigger;
export const DropdownMenuSubContent = rows.SubContent;
