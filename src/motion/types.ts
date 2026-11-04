import React from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import type { EasingFunction, EasingFunctionFactory } from 'react-native-reanimated';
import type { TypeScaleVariant } from '../typography/scale';

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

/** How {@link RollingTextProps} rolls a change. */
export type RollingTextMode = 'whole' | 'digits';

export interface RollingTextProps {
  /** The text shown. A change rolls the old text out and the new one in. */
  value: string;
  /**
   * `'whole'` (default): the old text leaves as the new one arrives.
   * `'digits'`: every figure turns on its own 0–9 wheel; other characters stay put.
   */
  mode?: RollingTextMode;
  /**
   * `'whole'` only: roll from this text when mounting — for a roll mounted for
   * one change (an engagement count that moved on press). Without it the first
   * render is still.
   */
  from?: string;
  /**
   * `'whole'` only: `'up'` (default) brings the new text in from below while the
   * old leaves upward — a count going up; `'down'` the other way.
   */
  direction?: 'up' | 'down';
  /** `'whole'` only: px each text travels. Default 10. */
  distance?: number;
  /** Milliseconds. Default 220 (`'whole'`), 350 (`'digits'`). */
  duration?: number;
  /** Default CSS `ease-out` (`'whole'`), ease-out cubic (`'digits'`). */
  easing?: EasingFunction | EasingFunctionFactory;
  /** `'whole'` only: where the text sits in its box. Default `'start'`. */
  align?: 'start' | 'center';
  /** `'whole'` only: clip the travelling text to the box, so it reads as a counter tick. */
  clip?: boolean;
  /** `'whole'` only: forwarded to the text, for a label that truncates. */
  numberOfLines?: number;
  /** Bloom's type ramp step. In `'digits'` its line height is the wheel's. */
  variant?: TypeScaleVariant;
  /** The text's style. In `'digits'` its `fontSize` / `lineHeight` size the wheels. */
  style?: StyleProp<TextStyle>;
  /** The box's style. */
  containerStyle?: StyleProp<ViewStyle>;
  /** `'whole'` only: called when a roll has landed (at once under reduced motion). */
  onRollEnd?: () => void;
  /** `'digits'` only: the one name the wheels are read by. Default `value`. */
  accessibilityLabel?: string;
  testID?: string;
}
