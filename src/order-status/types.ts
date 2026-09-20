import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { BloomIconComponent } from '../icons/icon-component';
import type { AccentTone } from '../theme/accent-colors';

// ---------------------------------------------------------------------------
//  OrderStatusTimeline
// ---------------------------------------------------------------------------

/**
 * Where one step of a pipeline is.
 *
 * `done` is behind us, `current` is where the thing is right now, `upcoming`
 * has not happened, `failed` is the step that stopped the pipeline. A pipeline
 * has at most one `current` and at most one `failed`, and everything after
 * either of them is `upcoming` — that is the caller's job, because only the app
 * knows whether a failure is terminal or gets retried.
 */
export type OrderStatusStepState = 'done' | 'current' | 'upcoming' | 'failed';

/** `comfortable` is the detail-screen rung; `compact` fits a card or a sheet. */
export type OrderStatusDensity = 'comfortable' | 'compact';

/**
 * `vertical` stacks the steps with their notes; `horizontal` lays them on one
 * rail for a wide header. One component, because the DATA is identical and a
 * screen that switches at a breakpoint must not switch components.
 */
export type OrderStatusOrientation = 'vertical' | 'horizontal';

export interface OrderStatusStep {
  /** Stable key. Defaults to the index. */
  id?: string;
  /** The step's name — "Picked up", "Cooking", "Confirmed". */
  label: string;
  /**
   * Pre-formatted, and computed by the app: "14:20", "Yesterday, 09:05". The
   * component never reads a clock and never formats a date.
   */
  timestamp?: string;
  /** One more line under the timestamp — "Left the depot in Sant Andreu". Vertical only. */
  note?: string;
  /** Default `upcoming`. */
  state?: OrderStatusStepState;
  /**
   * The marker colour for `done` and `current`. Default `primary`; `failed`
   * always paints `error` and ignores this.
   */
  tone?: AccentTone;
  /**
   * Drawn inside a larger marker. Comfortable density only — a compact marker
   * is 8px and has no room for a glyph.
   */
  icon?: BloomIconComponent;
}

export interface OrderStatusTimelineProps {
  /** The steps, in the order they happen. */
  steps: readonly OrderStatusStep[];
  /** Default `vertical`. */
  orientation?: OrderStatusOrientation;
  /** Default `comfortable`. */
  density?: OrderStatusDensity;
  /** Names the list as a whole. Default `"Status"`. */
  accessibilityLabel?: string;
  /**
   * What a screen reader announces for each state, before the step's own label.
   * Defaults are `"Done"`, `"In progress"`, `"Not yet"`, `"Failed"`.
   */
  stateLabels?: Partial<Record<OrderStatusStepState, string>>;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  OrderStatusBar
// ---------------------------------------------------------------------------

/** The measurement `OrderStatusBar` draws through `Meter`. */
export interface OrderStatusProgress {
  /** Current value, clamped into `[0, max]`. */
  value: number;
  /** @default 1 */
  max?: number;
  /**
   * What the bar measures. Required for the reason `Meter` states: ARIA never
   * computes a name for a `progressbar`, and the bar draws no text.
   */
  accessibilityLabel: string;
  /** `aria-valuetext` — "3 of 4 stops" rather than "75%". */
  valueText?: string;
}

/** `surface` paints a strip of its own; `plain` draws only the content. */
export type OrderStatusBarVariant = 'surface' | 'plain';

export interface OrderStatusBarProps {
  /** The live line — "Out for delivery", "Cooking", "Driver on the way". */
  status: string;
  /**
   * The arrival reading, pre-formatted by the app: "Arrives 14:35", "12 min".
   * Drawn at the end of the status line, in tabular figures so it does not
   * jitter as it counts down.
   */
  eta?: string;
  /** A quieter second line — "Four stops away", "Table 6". */
  detail?: string;
  /** How far along. Without it no bar is drawn. */
  progress?: OrderStatusProgress;
  /** The tone of the glyph tile and the bar. Default `primary`. */
  tone?: AccentTone;
  /** A glyph in the leading tile. Without it (and without `leading`) no tile is drawn. */
  icon?: BloomIconComponent;
  /** An arbitrary leading node — an `Avatar`, a photo. Wins over `icon`. */
  leading?: ReactNode;
  /** A trailing control — a `Button`, a `GlyphButton`. */
  action?: ReactNode;
  /** Default `surface`. */
  variant?: OrderStatusBarVariant;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
