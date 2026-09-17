/**
 * `HoverCard` — NATIVE. There is no hover on a touch screen, so the card opens
 * on a LONG PRESS of the trigger and presents as a bottom sheet — the shell
 * `Popover`, `DropdownMenu` and `Select` use. A plain press stays with the
 * element under the finger, which is what makes a hover card safe to put on a
 * link or an avatar that already navigates.
 *
 * `openDelay` / `closeDelay` do nothing here: a long press is its own intent.
 */
import React, { useCallback, useMemo, useRef } from 'react';
import type { View } from 'react-native';

import { SheetShell } from '../dialog/SheetShell';
import { TriggerSlot } from '../floating/TriggerSlot';
import { useSheetOpenBridge } from '../floating/use-sheet-open-bridge';
import { useControllableState } from '../hooks/use-controllable-state';
import { HOVER_CARD_TRIGGER_POPUP } from './constants';
import { HoverCardProvider, useHoverCard } from './context';
import type { HoverCardContentProps, HoverCardProps, HoverCardTriggerProps } from './types';

const noop = () => {};

export function HoverCard({ children, open, defaultOpen = false, onOpenChange }: HoverCardProps) {
  const [isOpen, setOpen] = useControllableState<boolean>({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  const anchorRef = useRef<View | null>(null);
  const value = useMemo(
    () => ({
      open: isOpen,
      setOpen,
      anchorRef,
      show: () => setOpen(true),
      hide: () => setOpen(false),
      hold: noop,
    }),
    [isOpen, setOpen],
  );

  return <HoverCardProvider value={value}>{children}</HoverCardProvider>;
}

export function HoverCardTrigger({
  children,
  asChild,
  disabled,
  className,
  style,
  testID,
}: HoverCardTriggerProps) {
  const card = useHoverCard();
  const { setOpen } = card;
  const openCard = useCallback(() => setOpen(true), [setOpen]);

  return (
    <TriggerSlot
      asChild={asChild}
      anchorRef={card.anchorRef}
      className={className}
      style={style}
      testID={testID}
      handle={{
        // The press belongs to the child; composing a no-op keeps its own.
        onPress: noop,
        onLongPress: openCard,
        disabled,
        'aria-haspopup': HOVER_CARD_TRIGGER_POPUP,
        'aria-expanded': card.open,
      }}>
      {children}
    </TriggerSlot>
  );
}

export function HoverCardContent({ children, label = 'Hover card', style }: HoverCardContentProps) {
  const card = useHoverCard();
  const { control, onSheetClose } = useSheetOpenBridge(card.open, card.setOpen);

  return (
    <SheetShell
      control={control}
      label={label}
      onClose={onSheetClose}
      contentStyle={[{ alignItems: 'center' }, style]}>
      {children}
    </SheetShell>
  );
}
