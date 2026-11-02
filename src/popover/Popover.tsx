import { useMenuDensity } from '../floating/use-menu-density';
import { BloomScope } from '../appearance';
/**
 * `Popover` — NATIVE. Presents as a bottom sheet, the same shell
 * `DropdownMenu`, `ContextMenu` and `Select` use: a phone has no room to float a
 * panel beside a control, and every Bloom overlay resolving to the same sheet is
 * what makes the native surfaces feel like one system.
 *
 * The public API is Radix/shadcn's — `open` / `defaultOpen` / `onOpenChange` on
 * the root, `asChild` on the trigger. Unlike the menus, a popover's body is
 * arbitrary content, so this family publishes no rows — only the panel
 * parts (`parts.tsx`).
 *
 * The sheet is the chrome here (its surface, corner and drag handle belong to
 * `SheetShell`), so only the BODY takes the panel geometry: the `p-2.5`
 * inset on the sides and bottom — the same 10px the web panel has, which is what
 * `PopoverSeparator`'s full-bleed rule and `PopoverHeader`/`PopoverFooter`'s
 * `px-2` are measured against — below the handle's own 20px clearance.
 *
 * When the app registered a platform adapter that reports `popup-surface` (a
 * desktop: OxyOS), the panel is instead a popover beside its trigger, in the
 * platform's popup as the menus' panels are (`floating/PopupPanel`'s chrome), as
 * a Mac's popover: role `dialog`, named by `label`; the platform takes it
 * through the keyboard (Tab goes round its controls, as a popover's key view
 * loop), and Escape closes it. A press outside closes it, as the platform
 * dismisses its popups.
 */
import type React from 'react';
import { useMemo, useRef } from 'react';
import { StyleSheet, type View } from 'react-native';

import { SheetShell } from '../dialog/SheetShell';
import { PopupPanelChrome } from '../floating/PopupPanel';
import { useAccessibilityFocus } from '../hooks/use-accessibility-focus';
import { usePopupSurface } from '../platform-surface/context';
import type { PopupSurfaceProps } from '../platform-surface/types';
import { POPOVER_TRIGGER_POPUP } from '../floating/constants';
import { TriggerSlot } from '../floating/TriggerSlot';
import { useSheetOpenBridge } from '../floating/use-sheet-open-bridge';
import { useControllableState } from '../hooks/use-controllable-state';
import { PopoverProvider, usePopover } from './context';
import { POPOVER_PADDING, POPOVER_SIDE_OFFSET, POPOVER_WIDTH } from './surface';
import type { PopoverContentProps, PopoverProps, PopoverTriggerProps } from './types';
import { useMessages } from '../locale/messages';
import { POPOVER_MESSAGES } from './messages';

export function Popover({ children, open, defaultOpen = false, onOpenChange }: PopoverProps) {
  const [isOpen, setOpen] = useControllableState<boolean>({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  const anchorRef = useRef<React.ComponentRef<typeof View> | null>(null);
  const value = useMemo(() => ({ open: isOpen, setOpen, anchorRef }), [isOpen, setOpen]);

  return <PopoverProvider value={value}>{children}</PopoverProvider>;
}

export function PopoverTrigger({
  children,
  asChild,
  disabled,
  label,
  className,
  style,
  testID,
}: PopoverTriggerProps) {
  const popover = usePopover();

  return (
    <TriggerSlot
      asChild={asChild}
      anchorRef={popover.anchorRef}
      className={className}
      style={style}
      testID={testID}
      handle={{
        onPress: () => popover.setOpen(true),
        disabled,
        accessibilityLabel: label,
        accessibilityRole: 'button',
        'aria-haspopup': POPOVER_TRIGGER_POPUP,
        'aria-expanded': popover.open,
      }}
    >
      {children}
    </TriggerSlot>
  );
}

export function PopoverContent({
  material,
  children,
  size,
  label: labelProp,
  side,
  align = 'center',
  sideOffset = POPOVER_SIDE_OFFSET,
  alignOffset,
  dismissible = true,
  minWidth = POPOVER_WIDTH,
  maxWidth,
  maxHeight,
  className,
  style,
  testID,
}: PopoverContentProps) {
  const { messages } = useMessages(POPOVER_MESSAGES);
  const label = labelProp ?? messages.popover;
  const popover = usePopover();
  const density = useMenuDensity(size);
  const PopupSurface = usePopupSurface();
  const { control, onSheetClose } = useSheetOpenBridge(popover.open, popover.setOpen);

  if (PopupSurface) {
    // The platform's popup: mounted while open, closed by the platform on an
    // outside press, which closes the popover.
    return popover.open ? (
      <BloomScope size={size}>
        <PopoverPopup
          PopupSurface={PopupSurface}
          anchorRef={popover.anchorRef}
          side={side ?? 'bottom'}
          align={align}
          sideOffset={sideOffset}
          alignOffset={alignOffset ?? 0}
          label={label}
          close={() => popover.setOpen(false)}
          dismissible={dismissible}
          minWidth={minWidth}
          maxWidth={maxWidth}
          maxHeight={maxHeight}
          className={className}
          style={style}
          testID={testID}
        >
          {children}
        </PopoverPopup>
      </BloomScope>
    ) : null;
  }

  return (
    <BloomScope size={size}>
      <SheetShell
        anchored
        material={material}
        control={control}
        label={label}
        onClose={onSheetClose}
        contentClassName={className}
        contentStyle={[
          styles.body,
          {
            gap: density.gap,
            paddingLeft: density.panelPadding,
            paddingRight: density.panelPadding,
            paddingBottom: density.panelPadding,
          },
          style,
        ]}
        contentTestID={testID}
      >
        {children}
      </SheetShell>
    </BloomScope>
  );
}

/**
 * The popover in the platform's popup: the menus' panel chrome around arbitrary
 * content. The screen reader's focus moves into it as it opens, as into a sheet,
 * and the trigger takes it back as it closes (`TriggerSlot`).
 */
function PopoverPopup({
  PopupSurface,
  anchorRef,
  side,
  align,
  sideOffset,
  alignOffset,
  label,
  close,
  dismissible,
  minWidth,
  maxWidth,
  maxHeight,
  className,
  style,
  testID,
  children,
}: Pick<
  PopupSurfaceProps,
  'anchorRef' | 'side' | 'align' | 'sideOffset' | 'alignOffset' | 'label'
> & {
  PopupSurface: React.ComponentType<PopupSurfaceProps>;
  close: () => void;
  dismissible: boolean;
  minWidth?: number;
  maxWidth?: number;
  maxHeight?: number;
  className?: string;
  style?: PopoverContentProps['style'];
  testID?: string;
  children?: React.ReactNode;
}) {
  const panelRef = useAccessibilityFocus<React.ComponentRef<typeof View>>(true);
  return (
    <PopupSurface
      anchorRef={anchorRef}
      side={side}
      align={align}
      sideOffset={sideOffset}
      alignOffset={alignOffset}
      role="dialog"
      label={label}
      onDismiss={close}
      onKey={(key) => {
        if (key === 'Escape' && dismissible) close();
      }}
      testID={testID}
    >
      <PopupPanelChrome
        panelRef={panelRef}
        minWidth={minWidth}
        maxWidth={maxWidth}
        maxHeight={maxHeight}
        className={className}
        style={style}
      >
        {children}
      </PopupPanelChrome>
    </PopupSurface>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingLeft: POPOVER_PADDING,
    paddingRight: POPOVER_PADDING,
    paddingBottom: POPOVER_PADDING,
  },
});
