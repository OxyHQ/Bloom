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
import { StyleSheet, type View } from 'react-native';

import { POPOVER_PADDING, POPOVER_WIDTH } from '../floating/constants';
import { FloatingPanel } from '../floating/FloatingPanel';
import { TriggerSlot } from '../floating/TriggerSlot';
import { useAnchorRect } from '../floating/use-anchor-rect';
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
  maxWidth,
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
      // `w-72 p-4` — shadcn's popover is a FIXED 288px card with a 16px inset,
      // not a shrink-wrap around its content. Both come FIRST in the array, so a
      // caller whose body is a row list rather than prose overrides them from
      // `style` — which is exactly what a shadcn call site does with
      // `className="w-[200px] p-0"`, and what `Combobox` and `DialogHeader` do
      // here. Their rows have to reach the panel edge to show a full-width
      // highlight.
      style={[styles.card, style]}
      testID={testID}>
      {children}
    </FloatingPanel>
  );
}

const styles = StyleSheet.create({
  card: {
    width: POPOVER_WIDTH,
    padding: POPOVER_PADDING,
  },
});
