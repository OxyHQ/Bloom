import { useMenuDensity } from './use-menu-density';
/**
 * The NATIVE sub-menu: an inline disclosure inside a sheet, or a flyout beside
 * its row in a desktop's popup.
 *
 * In a sheet, `SubTrigger` is an ordinary row whose chevron swaps between down
 * and up, and `SubContent` is a plain indented block below it. That is what
 * react-native-reusables itself renders on native, and it is the right shape
 * for a sheet: there is nowhere for a flyout to fly to, and a second anchored
 * window over a modal sheet is a presentation iOS cannot reliably stack anyway.
 *
 * In a platform popup on a desktop (`floating/PopupPanel`, with a pointer: a
 * window or a desktop's shell, `useTouchInput`), it is the web's flyout
 * (`menu-sub-flyout.tsx`): the chevron points right, the pointer on its row
 * opens it, and `SubContent` is a panel of its own in a popup of the
 * platform's, anchored beside the row — its top at the row's, its side one
 * seam (`MENU_SUB_SIDE_OFFSET`) off the parent panel's edge — with the parent's
 * chrome. Its rows stay in this React tree and register with the parent
 * panel's keyboard navigation, so the keys, the active row and typeahead are
 * the parent's, whichever popup has the keyboard (`popup-navigation.tsx`).
 *
 * The WEB counterpart is `menu-sub-flyout.tsx`. The two are chosen by each
 * family's own platform fork (`DropdownMenu.tsx` vs `DropdownMenu.web.tsx`)
 * rather than by a `Platform.OS` branch here — the web flyout imports the
 * web-only `FloatingPanel`, so a runtime branch would drag `react-dom` and the
 * portal into every native bundle. This file's own branch is not a platform
 * one: both of its presentations are native.
 */
import React, { type ComponentRef, useMemo, useRef } from 'react';
import { View } from 'react-native';

import { useControllableState } from '../hooks/use-controllable-state';
import { useMessages } from '../locale/messages';
import { useTouchInput } from '../styles/pointer';
import { RiArrowDownSLine as ChevronBottomIcon } from '../icons/remix/RiArrowDownSLine';
import { RiArrowRightSLine as ChevronRightIcon } from '../icons/remix/RiArrowRightSLine';
import { RiArrowUpSLine as ChevronTopIcon } from '../icons/remix/RiArrowUpSLine';
import { StyledView } from '../styles/styled-primitives';
import { useMenuPalette } from './menu-palette';
import { MENU_SUB_SIDE_OFFSET, ROW_ICON_SIZE } from './constants';
import { MenuSubProvider, useMenuSub } from './context';
import { FLOATING_MESSAGES } from './messages';
import { MenuRowAlignmentScope, useMenuRowsAligned } from './menu-row-alignment';
import { type PopupSubmenu, PopupSubmenuScope, usePopupKeys } from './popup-navigation';
import { POPUP_PANEL_BORDER, PopupPanelChrome, usePanelPopupSurface } from './PopupPanel';
import { cx, MenuRowChevron, MenuRowShell, splitChildren, SUB_TRIGGER_CLASS } from './shared';
import type { MenuSubContentProps, MenuSubParts, MenuSubProps, MenuSubTriggerProps } from './types';

/** Whether a submenu here flies out: inside a platform popup, with a pointer. */
function useFlyout(): boolean {
  const PopupSurface = usePanelPopupSurface();
  const touch = useTouchInput();
  return PopupSurface !== null && !touch;
}

/** Build one family's native sub trio. `prefix` is used for nothing but `displayName`. */
export function createInlineMenuSub(prefix: string): MenuSubParts {
  function MenuSub({ children, open, defaultOpen = false, onOpenChange }: MenuSubProps) {
    const [isOpen, setOpen] = useControllableState<boolean>({
      value: open,
      defaultValue: defaultOpen,
      onChange: onOpenChange,
    });
    const flyout = useFlyout();
    // One object for the submenu's life, kept current: a platform popup's keyboard navigation
    // knows the submenu by it (→ opens it, ← and Escape close it), and a flyout's by the pointer.
    const navigation = useRef<PopupSubmenu>({ open: isOpen, setOpen, flyout }).current;
    navigation.open = isOpen;
    navigation.setOpen = setOpen;
    navigation.flyout = flyout;
    // The trigger row, which a flyout's popup is anchored to.
    const anchorRef = useRef<ComponentRef<typeof View> | null>(null);
    const context = useMemo(
      () => ({ open: isOpen, setOpen, navigation, anchorRef, flyout }),
      [isOpen, setOpen, navigation, flyout],
    );
    return <MenuSubProvider value={context}>{children}</MenuSubProvider>;
  }
  MenuSub.displayName = `${prefix}Sub`;

  function MenuSubTrigger({
    children,
    disabled = false,
    inset = false,
    leading,
    accessibilityLabel,
    className,
    style,
    testID,
  }: MenuSubTriggerProps) {
    const palette = useMenuPalette();
    const sub = useMenuSub();
    const { title, body } = splitChildren(children);
    // A flyout's chevron points RIGHT, at the panel beside the row; an inline
    // disclosure's down when closed and up when open, the INLINE relationship it
    // states.
    const Chevron = sub.flyout ? ChevronRightIcon : sub.open ? ChevronTopIcon : ChevronBottomIcon;

    const row = (
      <MenuRowShell
        role="menuitem"
        expanded={sub.open}
        hasPopup="menu"
        disabled={disabled}
        inset={inset}
        leading={leading}
        // `size-4 shrink-0 ms-auto text-fg-secondary` — the same 16px glyph as a
        // row's check, one step back in colour, exactly as the flyout's.
        trailing={
          <MenuRowChevron>
            <Chevron width={ROW_ICON_SIZE} height={ROW_ICON_SIZE} fill={palette.textSecondary} />
          </MenuRowChevron>
        }
        title={title}
        // A press toggles, as the web flyout's does.
        onPress={() => sub.setOpen(!sub.open)}
        submenu={sub.navigation}
        accessibilityLabel={accessibilityLabel}
        className={cx(SUB_TRIGGER_CLASS, className)}
        style={style}
        testID={testID}
      >
        {body}
      </MenuRowShell>
    );
    if (!sub.flyout) return row;
    // The row's own box, for the flyout's popup to be placed against.
    return (
      <View ref={sub.anchorRef} collapsable={false}>
        {row}
      </View>
    );
  }
  MenuSubTrigger.displayName = `${prefix}SubTrigger`;

  function MenuSubContent(props: MenuSubContentProps) {
    const sub = useMenuSub();
    if (!sub.open) return null;
    return sub.flyout ? <FlyoutContent {...props} /> : <InlineContent {...props} />;
  }
  MenuSubContent.displayName = `${prefix}SubContent`;

  return { Sub: MenuSub, SubTrigger: MenuSubTrigger, SubContent: MenuSubContent };
}

/** Indented under its trigger, which is the whole visual statement an inline disclosure makes. */
function InlineContent({ children, label, className, style, testID }: MenuSubContentProps) {
  const sub = useMenuSub();
  const density = useMenuDensity();
  return (
    <StyledView
      accessibilityLabel={label}
      className={cx('pl-space-16', density.groupClass, className)}
      style={style}
      testID={testID}
    >
      <PopupSubmenuScope submenu={sub.navigation}>{children}</PopupSubmenuScope>
    </StyledView>
  );
}

/**
 * The flyout's panel, in a popup of the platform's beside its row. The platform
 * places it (flipping to the row's other side where there is no room) from the
 * row's frame: the row sits inside the parent panel's padding and border, so the
 * side offset adds them back and the seam is measured from the parent's edge,
 * as `menu-sub-flyout.tsx`'s anchor measures it on the web.
 */
function FlyoutContent({
  children,
  label: labelProp,
  side = 'right',
  align = 'start',
  sideOffset = MENU_SUB_SIDE_OFFSET,
  alignOffset = 0,
  minWidth,
  maxWidth,
  alignRows,
  className,
  style,
  testID,
}: MenuSubContentProps) {
  const sub = useMenuSub();
  const PopupSurface = usePanelPopupSurface();
  const parentKeys = usePopupKeys();
  const density = useMenuDensity();
  const parentAlignsRows = useMenuRowsAligned();
  const { messages } = useMessages(FLOATING_MESSAGES);
  if (!PopupSurface || !sub.anchorRef) return null;
  return (
    <PopupSurface
      anchorRef={sub.anchorRef}
      side={side}
      align={align}
      sideOffset={sideOffset + density.panelPadding + POPUP_PANEL_BORDER}
      alignOffset={alignOffset}
      role="menu"
      label={labelProp ?? messages.submenu}
      // The parent's popup goes with it on an outside press; the flyout closes either way.
      onDismiss={() => sub.setOpen(false)}
      // Its keys are the parent panel's: its rows are registered there.
      onKey={parentKeys ?? undefined}
      testID={testID}
    >
      <PopupPanelChrome minWidth={minWidth} maxWidth={maxWidth} className={className} style={style}>
        <MenuRowAlignmentScope enabled={alignRows ?? parentAlignsRows}>
          <PopupSubmenuScope submenu={sub.navigation}>{children}</PopupSubmenuScope>
        </MenuRowAlignmentScope>
      </PopupPanelChrome>
    </PopupSurface>
  );
}
