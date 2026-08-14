/**
 * `Popover` — WEB. An anchored panel positioned, portaled, ranked and dismissed
 * by `floating/FloatingPanel`, which is also what the three menu families
 * render. The popover's own contribution is its defaults: it centres on its
 * trigger (shadcn's `align="center"`), it is padded because its body is
 * arbitrary content rather than rows, and it does not take the trigger's width
 * as a floor — a menu wants to be at least as wide as what opened it, a popover
 * wants to be as wide as its content.
 */
import React, { useCallback, useMemo, useRef } from 'react';
import type { View } from 'react-native';

import { FloatingPanel } from '../floating/FloatingPanel';
import { TriggerSlot } from '../floating/TriggerSlot';
import { useAnchorRect } from '../floating/use-anchor-rect';
import { useControllableState } from '../hooks/use-controllable-state';
import { PopoverProvider, usePopover } from './context';
import type { PopoverContentProps, PopoverProps, PopoverTriggerProps } from './types';

/** Widest a popover grows before its content wraps. */
const DEFAULT_MAX_WIDTH = 360;

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
        onPress: () => popover.setOpen(!popover.open),
        disabled,
        accessibilityLabel: label,
        accessibilityRole: 'button',
        'aria-expanded': popover.open,
      }}>
      {children}
    </TriggerSlot>
  );
}

export function PopoverContent({
  children,
  label = 'Popover',
  side,
  align = 'center',
  sideOffset,
  alignOffset,
  dismissible,
  minWidth,
  maxWidth = DEFAULT_MAX_WIDTH,
  style,
  testID,
}: PopoverContentProps) {
  const popover = usePopover();
  const anchor = useAnchorRect(popover.anchorRef, popover.open);
  const close = useCallback(() => popover.setOpen(false), [popover]);

  return (
    <FloatingPanel
      open={popover.open}
      anchor={anchor}
      role="dialog"
      label={label}
      side={side}
      align={align}
      sideOffset={sideOffset}
      alignOffset={alignOffset}
      dismissible={dismissible}
      minWidth={minWidth}
      maxWidth={maxWidth}
      onDismiss={close}
      // No inset of its own. shadcn's web popover is `p-4`, but a Bloom popover
      // is as often a list of `Item` rows (combobox, the dialog header's
      // overflow) as it is prose, and rows must reach the panel edge to show
      // their full-width highlight. `FloatingPanel`'s 4px vertical rhythm is
      // the shared default; a prose popover pads its own body.
      style={style}
      testID={testID}>
      {children}
    </FloatingPanel>
  );
}
