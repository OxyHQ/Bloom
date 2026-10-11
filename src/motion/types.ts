import React from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';

/** Opt-in timing for a surface's panel and backdrop. Defaults remain owner-specific when omitted. */
export interface SurfaceTransition {
  /** Milliseconds, clamped to zero. Non-finite values fall back to 300. */
  duration: number;
  /** CSS cubic-bezier coordinates. Invalid curves fall back to ease. */
  easing?: readonly [number, number, number, number];
}

/** Direction the incoming screen travels. */
export type ScreenTransitionDirection = 'forward' | 'backward';

export interface ScreenTransitionProps {
  /**
   * `'forward'` slides the new screen in from the right, `'backward'` from the
   * left — matching a push / pop navigation gesture.
   */
  direction: ScreenTransitionDirection;
  /**
   * Enable the transition on web. Off by default: Reanimated layout animations
   * are fragile across web bundlers, so web opts in explicitly and gets a
   * lightweight cross-fade rather than a slide.
   */
  enabledWeb?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}
