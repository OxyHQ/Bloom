/**
 * The floating hover-card surface — WEB ONLY, imported by `.web.tsx` files and
 * nothing else (it renders `floating/FloatingPanel`, which portals through
 * `../portal/index.web`).
 *
 * Shared by `HoverCardContent` and `AvatarGroup`'s web hover card, so the two
 * agree on placement, motion, dismissal and the pointer bridge by construction.
 *
 * What it adds to `FloatingPanel`:
 *
 *  - The MENU surface (radius 16, 1px border, dropdown shadow, 150ms fade +
 *    `scale-95` + 2px blur), NON-modal: nothing is laid over the app, so the
 *    page under a hover card stays scrollable and clickable, and an outside
 *    press or Escape dismisses it.
 *  - `overflow: visible` and its own inset. The menu panel clips and pads for
 *    rows; a hover card's content is arbitrary, and `UserHoverCard`'s `footer`
 *    is documented as unclipped.
 *  - The pointer BRIDGE, on a `View` inside the panel that fills it. It listens
 *    to `pointerenter`/`pointerleave`, never to a `Pressable`'s hover: RNW's
 *    `Pressable` dispatches a bubbling `react-gui:hover:lock` on itself, and a
 *    hovered ancestor `Pressable` ends its own hover for any lock it did not
 *    send — so a `Pressable` bridge dismissed the card the moment the cursor
 *    reached a button inside it. Pointer enter/leave do not bubble and do not
 *    fire between descendants.
 */
import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { FloatingPanel } from '../floating/FloatingPanel';
import type { FloatingAnchor, FloatingPositionProps } from '../floating/types';
import type { WebCssStyle } from '../styles/web-view-style';
import { HOVER_CARD_INSET, HOVER_CARD_SIDE_OFFSET } from './constants';
import { HoverCardSurfaceProvider } from './context';

export interface HoverCardPanelProps extends FloatingPositionProps {
  open: boolean;
  anchor: FloatingAnchor | null;
  onDismiss: () => void;
  /** The pointer reached the card. */
  onPointerEnter: () => void;
  /** The pointer left the card. */
  onPointerLeave: () => void;
  label: string;
  padded?: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  children?: React.ReactNode;
}

export function HoverCardPanel({
  open,
  anchor,
  onDismiss,
  onPointerEnter,
  onPointerLeave,
  label,
  padded = true,
  side = 'bottom',
  align = 'center',
  sideOffset = HOVER_CARD_SIDE_OFFSET,
  alignOffset,
  className,
  style,
  testID,
  children,
}: HoverCardPanelProps) {
  return (
    <FloatingPanel
      open={open}
      anchor={anchor}
      surface="menu"
      modal={false}
      role="dialog"
      label={label}
      side={side}
      align={align}
      sideOffset={sideOffset}
      alignOffset={alignOffset}
      onDismiss={onDismiss}
      className={className}
      style={[styles.panel, style]}
      testID={testID}>
      <View
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        style={padded ? styles.padded : null}>
        <HoverCardSurfaceProvider value>{children}</HoverCardSurfaceProvider>
      </View>
    </FloatingPanel>
  );
}

const panel: WebCssStyle = {
  // The menu class pads and clips for ROWS; the bridge has to cover the whole
  // panel, so the inset moves onto it.
  paddingTop: 0,
  paddingBottom: 0,
  paddingLeft: 0,
  paddingRight: 0,
  overflow: 'visible',
};

const styles = StyleSheet.create({
  panel,
  padded: {
    paddingTop: HOVER_CARD_INSET,
    paddingBottom: HOVER_CARD_INSET,
    paddingLeft: HOVER_CARD_INSET,
    paddingRight: HOVER_CARD_INSET,
  },
});
