/**
 * `HoverCard` — WEB. A card that opens while the pointer rests on its trigger
 * (or keyboard focus lands on it) and stays up while the pointer travels onto
 * it. Positioned, portaled, ranked and dismissed by `floating/FloatingPanel`
 * through `HoverCardPanel`.
 *
 * Touch pointers are ignored on purpose: a tap on a touch screen is a press, and
 * the element under it (a link, an avatar) owns that. A touch device reaches the
 * card the way native does — see `HoverCard.tsx`.
 */
import React, { useCallback, useMemo, useRef } from 'react';
import type { NativeSyntheticEvent, View } from 'react-native';

import { useAnchorRect } from '../floating/use-anchor-rect';
import { useControllableState } from '../hooks/use-controllable-state';
import { StyledView } from '../styles/styled-primitives';
import {
  HOVER_CARD_CLOSE_DELAY,
  HOVER_CARD_OPEN_DELAY,
  HOVER_CARD_TRIGGER_POPUP,
} from './constants';
import { HoverCardProvider, useHoverCard } from './context';
import { HoverCardPanel } from './HoverCardPanel';
import type { HoverCardContentProps, HoverCardProps, HoverCardTriggerProps } from './types';
import { useHoverIntent } from './use-hover-intent';

export function HoverCard({
  children,
  open,
  defaultOpen = false,
  onOpenChange,
  openDelay = HOVER_CARD_OPEN_DELAY,
  closeDelay = HOVER_CARD_CLOSE_DELAY,
}: HoverCardProps) {
  const [isOpen, setOpen] = useControllableState<boolean>({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  const anchorRef = useRef<View | null>(null);
  const intent = useHoverIntent(isOpen, setOpen, openDelay, closeDelay);
  const value = useMemo(
    () => ({ open: isOpen, setOpen, anchorRef, ...intent }),
    [isOpen, setOpen, intent],
  );

  return <HoverCardProvider value={value}>{children}</HoverCardProvider>;
}

type PointerLike = NativeSyntheticEvent<{ pointerType?: string }>;
type FocusLike = { target?: unknown };

/** Mouse and pen hover; a touch "hover" is the first half of a tap. */
function isHoverPointer(event: PointerLike): boolean {
  return event.nativeEvent?.pointerType !== 'touch';
}

/**
 * Keyboard focus only. A mouse click focuses the element it lands on too, and
 * opening on that would reopen a card the click just meant to get past.
 */
function isFocusVisible(event: FocusLike): boolean {
  const target = event.target as { matches?: (selector: string) => boolean } | null;
  try {
    return target?.matches?.(':focus-visible') ?? false;
  } catch {
    // An engine without `:focus-visible` throws on the selector.
    return false;
  }
}

export function HoverCardTrigger({
  children,
  disabled,
  className,
  style,
  testID,
}: HoverCardTriggerProps) {
  const card = useHoverCard();
  const { show, hide } = card;

  const onPointerEnter = useCallback(
    (event: PointerLike) => {
      if (!disabled && isHoverPointer(event)) show();
    },
    [disabled, show],
  );
  const onPointerLeave = useCallback(
    (event: PointerLike) => {
      if (isHoverPointer(event)) hide();
    },
    [hide],
  );
  const onFocus = useCallback(
    (event: FocusLike) => {
      if (!disabled && isFocusVisible(event)) show();
    },
    [disabled, show],
  );


  return (
    <StyledView
      ref={card.anchorRef}
      className={className}
      style={[{ alignSelf: 'flex-start' }, style]}
      testID={testID}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      aria-haspopup={HOVER_CARD_TRIGGER_POPUP}
      aria-expanded={card.open}
      // Focus and blur BUBBLE here from the focusable child (React's `onFocus`
      // is `focusin`), so the wrapper needs no tab stop of its own.
      onFocus={onFocus}
      onBlur={hide}>
      {children}
    </StyledView>
  );
}

export function HoverCardContent({
  children,
  label = 'Hover card',
  padded,
  side,
  align,
  sideOffset,
  alignOffset,
  className,
  style,
  testID,
}: HoverCardContentProps) {
  const card = useHoverCard();
  const anchor = useAnchorRect(card.anchorRef, card.open);
  const { setOpen, hold, hide } = card;
  const dismiss = useCallback(() => {
    hold();
    setOpen(false);
  }, [hold, setOpen]);

  return (
    <HoverCardPanel
      open={card.open}
      anchor={anchor}
      onDismiss={dismiss}
      onPointerEnter={hold}
      onPointerLeave={hide}
      label={label}
      padded={padded}
      side={side}
      align={align}
      sideOffset={sideOffset}
      alignOffset={alignOffset}
      className={className}
      style={style}
      testID={testID}>
      {children}
    </HoverCardPanel>
  );
}
