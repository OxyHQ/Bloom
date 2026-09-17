import type { StyleProp, ViewStyle } from 'react-native';

import type { FloatingPositionProps, OverlayOpenProps } from '../floating/types';

export interface HoverCardProps extends OverlayOpenProps {
  children?: React.ReactNode;
  /**
   * Milliseconds the pointer (or keyboard focus) has to rest on the trigger
   * before the card opens. Web only. Defaults to `400`.
   */
  openDelay?: number;
  /**
   * Milliseconds the card stays up after the pointer leaves the trigger or the
   * card — long enough to cross the gap between them. Web only. Defaults to
   * `150`.
   */
  closeDelay?: number;
}

export interface HoverCardTriggerProps {
  children?: React.ReactNode;
  /**
   * NATIVE: merge the long-press into the single element child instead of
   * wrapping it in Bloom's own `Pressable`. Use it whenever the child is itself
   * pressable (a link, an avatar that opens a profile) — a wrapping `Pressable`
   * never receives the long press, because the inner one wins the responder.
   * WEB: ignored; the trigger listens for pointer and focus on a wrapper, so
   * there is nothing to merge.
   */
  asChild?: boolean;
  /** A disabled trigger never opens the card. */
  disabled?: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface HoverCardContentProps extends FloatingPositionProps {
  children?: React.ReactNode;
  /** Accessible name of the card. Defaults to `'Hover card'`. */
  label?: string;
  /**
   * Draw Bloom's floating surface around the content (radius 16, 1px border,
   * dropdown shadow, 15px inset). Defaults to `true`. A child that paints its
   * own surface — `UserHoverCard` does, and detects this panel by itself — does
   * not need `false`.
   */
  padded?: boolean;
  /** Appended to the panel's own classes. */
  className?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
