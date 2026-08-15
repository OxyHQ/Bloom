/**
 * `Popover` — NATIVE. Presents as a bottom sheet, the same shell
 * `DropdownMenu`, `ContextMenu` and `Select` use: a phone has no room to float a
 * panel beside a control, and every Bloom overlay resolving to the same sheet is
 * what makes the native surfaces feel like one system.
 *
 * The public API is Radix/shadcn's — `open` / `defaultOpen` / `onOpenChange` on
 * the root, `asChild` on the trigger. Unlike the menus, a popover's body is
 * arbitrary content, so this family publishes no rows.
 */
import React, { useMemo, useRef } from 'react';
import type { View } from 'react-native';

import { SheetShell } from '../dialog/SheetShell';
import { POPOVER_TRIGGER_POPUP } from '../floating/constants';
import { TriggerSlot } from '../floating/TriggerSlot';
import { useSheetOpenBridge } from '../floating/use-sheet-open-bridge';
import { useControllableState } from '../hooks/use-controllable-state';
import { PopoverProvider, usePopover } from './context';
import type { PopoverContentProps, PopoverProps, PopoverTriggerProps } from './types';

export function Popover({ children, open, defaultOpen = false, onOpenChange }: PopoverProps) {
  const [isOpen, setOpen] = useControllableState<boolean>({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  const anchorRef = useRef<View | null>(null);
  const value = useMemo(() => ({ open: isOpen, setOpen, anchorRef }), [isOpen, setOpen]);

  return <PopoverProvider value={value}>{children}</PopoverProvider>;
}

export function PopoverTrigger({
  children,
  asChild,
  disabled,
  label,
  style,
  testID,
}: PopoverTriggerProps) {
  const popover = usePopover();

  return (
    <TriggerSlot
      asChild={asChild}
      anchorRef={popover.anchorRef}
      style={style}
      testID={testID}
      handle={{
        onPress: () => popover.setOpen(true),
        disabled,
        accessibilityLabel: label,
        accessibilityRole: 'button',
        'aria-haspopup': POPOVER_TRIGGER_POPUP,
        'aria-expanded': popover.open,
      }}>
      {children}
    </TriggerSlot>
  );
}

export function PopoverContent({ children, label = 'Popover', style }: PopoverContentProps) {
  const popover = usePopover();
  const { control, onSheetClose } = useSheetOpenBridge(popover.open, popover.setOpen);

  return (
    <SheetShell control={control} label={label} onClose={onSheetClose} contentStyle={style}>
      {children}
    </SheetShell>
  );
}
