/**
 * `Popover` — WEB. An anchored panel positioned, portaled, ranked and dismissed
 * by `floating/FloatingPanel`, which is also what the three menu families
 * render. The popover's own contribution is its panel: BoardUI's floating
 * surface (`surface.ts` — 266px, `rounded-2xl`, 1px `border-button-default`,
 * `bg-background-primary-default`, `p-2.5`, `shadow-dropdown`), resolved from
 * the theme ramps and applied inline ahead of the caller's `style`. It centres
 * on its trigger by default (shadcn's `align="center"`) and does not take the
 * trigger's width as a floor.
 */
import React, { useCallback, useMemo, useRef } from 'react';
import { useWindowDimensions, type View } from 'react-native';

import { POPOVER_TRIGGER_POPUP } from '../floating/constants';
import { FloatingPanel } from '../floating/FloatingPanel';
import { useMenuPalette } from '../floating/menu-palette';
import { TriggerSlot } from '../floating/TriggerSlot';
import { useAnchorRect } from '../floating/use-anchor-rect';
import { useControllableState } from '../hooks/use-controllable-state';
import { PopoverProvider, usePopover } from './context';
import {
  classChromeOverrides,
  POPOVER_SIDE_OFFSET,
  resolvePopoverSurfaceStyle,
} from './surface';
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
        onPress: () => popover.setOpen(!popover.open),
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

export function PopoverContent({
  children,
  label = 'Popover',
  side,
  align = 'center',
  sideOffset = POPOVER_SIDE_OFFSET,
  alignOffset,
  dismissible,
  minWidth,
  maxWidth,
  className,
  style,
  testID,
}: PopoverContentProps) {
  const popover = usePopover();
  const anchor = useAnchorRect(popover.anchorRef, popover.open);
  const close = useCallback(() => popover.setOpen(false), [popover]);
  const palette = useMenuPalette();
  const { width: viewportWidth } = useWindowDimensions();
  const overridden = useMemo(() => classChromeOverrides(className), [className]);
  const chrome = useMemo(
    () =>
      resolvePopoverSurfaceStyle(
        palette,
        overridden,
        maxWidth === undefined ? viewportWidth : undefined,
      ),
    [palette, overridden, maxWidth, viewportWidth],
  );

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
      className={className}
      // The resolved panel FIRST, so the caller's `style` overrides any of it;
      // properties the caller's `className` names were already left out.
      style={[chrome, style]}
      testID={testID}>
      {children}
    </FloatingPanel>
  );
}
