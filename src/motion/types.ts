import React from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';

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
