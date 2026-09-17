/**
 * The composer's anchored panel — WEB. `floating/FloatingPanel` on its `menu`
 * surface: popover motion (150ms `ease-out`, fade + `scale-95` +
 * 2px blur from the corner nearest the trigger), portaled and ranked by the
 * overlay stack, and NON-modal like every composer menu (the outside
 * press dismisses and still reaches the page; Escape closes).
 *
 * The chrome — width, radius, padding, border, surface, shadow — is the
 * caller's inline `style`, which outranks the surface's own classes.
 */
import React, { useCallback } from 'react';
import type { View } from 'react-native';

import { FloatingPanel } from '../floating/FloatingPanel';
import { useAnchorRect } from '../floating/use-anchor-rect';
import type { ComposerPopoverProps } from './types';

export function ComposerPopover({
  open,
  onOpenChange,
  anchorRef,
  label,
  side,
  sideOffset,
  modal = false,
  style,
  testID,
  children,
}: ComposerPopoverProps) {
  const anchor = useAnchorRect(anchorRef as React.RefObject<View | null>, open);
  const dismiss = useCallback(() => onOpenChange(false), [onOpenChange]);

  return (
    <FloatingPanel
      open={open}
      anchor={anchor}
      role="dialog"
      label={label}
      side={side}
      align="start"
      sideOffset={sideOffset}
      modal={modal}
      onDismiss={dismiss}
      surface="menu"
      style={style}
      testID={testID}>
      {children}
    </FloatingPanel>
  );
}
