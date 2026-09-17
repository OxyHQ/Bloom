import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export type StatBarVariant = 'progress' | 'split';

interface StatBarBaseProps {
  /** Label shown at the top-left of the bar. */
  label: string;
  /**
   * Fill color of the (active portion of the) track.
   * @default the accent (`accent-500`), via `resolveMeterColors`
   */
  fillColor?: string;
  /**
   * Color of the empty/track portion.
   * @default `neutral-200` (dark `neutral-700`), via `resolveMeterColors`
   */
  trackColor?: string;
  /**
   * Height of the capsule track in px.
   * @default 6
   */
  height?: number;
  /** Optional node rendered at the top-right of the label row (e.g. a trophy icon). */
  icon?: ReactNode;
  /** Container style override. */
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** A labeled progress bar with an optional min/max footer row. */
export interface StatBarProgressProps extends StatBarBaseProps {
  variant?: 'progress';
  /** Current value; the fill spans `value / max` of the track. */
  value: number;
  /** Maximum value (the full track). */
  max: number;
  /** Optional label shown at the bottom-left (e.g. the range minimum). */
  minLabel?: string;
  /** Optional label shown at the bottom-right (e.g. the range maximum). */
  maxLabel?: string;
}

/** A two-sided split bar showing an inflow/outflow-style ratio. */
export interface StatBarSplitProps extends StatBarBaseProps {
  variant: 'split';
  /** Share of the track filled from the left, 0–100. Shown right of the label. */
  percent: number;
  /** Value label shown at the bottom-left. */
  leftValue: string;
  /** Value label shown at the bottom-right. */
  rightValue: string;
  /**
   * Color of the left (active) portion.
   * @default fillColor (the accent)
   */
  leftColor?: string;
  /**
   * Color of the right portion.
   * @default trackColor (`neutral-200`, dark `neutral-700`)
   */
  rightColor?: string;
}

export type StatBarProps = StatBarProgressProps | StatBarSplitProps;

// ---------------------------------------------------------------------------
//  Meter — the bare determinate bar every progress bar in Bloom is built from
// ---------------------------------------------------------------------------

interface MeterGeometryProps {
  /** Current value. Clamped into `[0, max]`; `NaN` reads as empty. */
  value: number;
  /**
   * The full track.
   * @default 1
   */
  max?: number;
  /**
   * Track height in px.
   * @default 6
   */
  height?: number;
  /**
   * Corner radius of both the track and the fill.
   * @default height / 2 — a capsule
   */
  radius?: number;
  /**
   * The filled portion's colour.
   * @default the accent (`accent-500`)
   */
  fill?: string;
  /**
   * The rail behind the fill.
   * @default `neutral-200`, `neutral-700` in dark
   */
  track?: string;
  /**
   * A fixed width. Without one the bar fills its parent (`width: '100%'`), so a
   * caller that wants it to flex passes `style={{ flex: 1 }}` instead.
   */
  width?: number;
  /**
   * Milliseconds the fill eases its width over, on WEB only — native snaps.
   * Ignored under `prefers-reduced-motion`.
   * @default 0
   */
  transitionMs?: number;
  /** Container style override. Applied to the track. */
  style?: StyleProp<ViewStyle>;
  testID?: string;
  /**
   * The fill's own `testID`.
   * @default `${testID}-fill`
   */
  fillTestID?: string;
}

/** A determinate bar that IS the `progressbar` — the usual case. */
export interface MeterProps extends MeterGeometryProps {
  /**
   * What the bar measures. Required: ARIA never computes a name for
   * `progressbar` from its contents, and the bar draws no text of its own, so
   * without this it announces "progress bar, 40%" with no subject.
   */
  accessibilityLabel: string;
  /**
   * `aria-valuetext` — the reading a screen reader says instead of the raw
   * number, which is otherwise announced as a percentage ("4 of 5" vs "80%").
   */
  valueText?: string;
  decorative?: false;
}

/**
 * A determinate bar with NO role, for one segment of a larger `progressbar`
 * that carries the value itself (`WizardProgress`' step segments). Hidden from
 * assistive technology rather than silently unnamed.
 */
export interface MeterDecorativeProps extends MeterGeometryProps {
  decorative: true;
  accessibilityLabel?: never;
  valueText?: never;
}

export type AnyMeterProps = MeterProps | MeterDecorativeProps;

/** The same measurement drawn as a ring. */
export interface MeterRingProps {
  /** Current value. Clamped into `[0, max]`. */
  value: number;
  /** @default 1 */
  max?: number;
  /**
   * Outer diameter in px. The stroke is drawn INSIDE it, so the ring occupies
   * exactly `size × size`.
   * @default 56
   */
  size?: number;
  /**
   * Stroke width in px.
   * @default 5
   */
  thickness?: number;
  /**
   * The arc's colour.
   * @default the accent (`accent-500`)
   */
  fill?: string;
  /**
   * The ring behind it.
   * @default `neutral-200`, `neutral-700` in dark
   */
  track?: string;
  /**
   * The arc's end cap. `'round'` reads as a needle tip; at value 0 it would
   * draw a dot on an empty ring, so `'round'` degrades to `'butt'` there.
   * @default 'round'
   */
  cap?: 'round' | 'butt';
  /** What the ring measures. Required, for the reason `Meter` states. */
  accessibilityLabel: string;
  /** `aria-valuetext`. */
  valueText?: string;
  /**
   * Milliseconds the arc eases over, on WEB only — native snaps. Ignored under
   * `prefers-reduced-motion`.
   * @default 0
   */
  transitionMs?: number;
  /** Centred content — the score, a glyph. Hidden from assistive technology. */
  children?: ReactNode;
  /** Container style override. */
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
