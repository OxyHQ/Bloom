import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

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

/** Visual-only entrance; the accessible value always remains the real measurement. */
export interface MeterReveal {
  visible: boolean;
  /** Retain the revealed state after the first visible observation. Default false. */
  once?: boolean;
  /** Non-negative milliseconds. Default 300. */
  duration?: number;
  /** Non-negative milliseconds before motion begins. Default 0. */
  delay?: number;
  /** CSS cubic-bezier control points. Default ease. */
  easing?: readonly [number, number, number, number];
}

interface MeterGeometryProps {
  /** Animate only the fill from empty when visible; reduced motion displays the real value immediately. */
  reveal?: MeterReveal;
  /** Classes on the track. Unclaimed properties retain the normal Meter defaults. */
  className?: string;
  /** Classes on the fill. Width continues to represent value/max. */
  fillClassName?: string;
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
  /**
   * The amount is not known yet — a file transcoding, a step that reports none:
   * a segment 40% of the track wide sweeps across it every 1.4 s (parked 30%
   * along under reduced motion), and the bar is a `progressbar` that reports no
   * value (`aria-valuenow` absent, `aria-busy`), which is what makes it
   * indeterminate to assistive technology. `value`, `reveal` and `transitionMs`
   * are not drawn meanwhile.
   * @default false
   */
  indeterminate?: boolean;
  /** Container style override. Applied to the track. */
  style?: StyleProp<ViewStyle>;
  testID?: string;
  /**
   * The fill's own `testID`.
   * @default `${testID}-fill`
   */
  fillTestID?: string;
}

/**
 * What a meter is to assistive technology, as ARIA and a Mac name the two:
 *
 * - `meter` (the default): a measurement within a known range — a score, a
 *   share of the ratings, a charge, how full something is. A level indicator
 *   ("level indicator" on a Mac, ARIA's `meter`).
 * - `progressbar`: how far a TASK has got — an upload, a download, an
 *   install, an episode listened, a lease's elapsed time, steps done. A
 *   progress indicator. An indeterminate ring is always one.
 */
export type MeterRole = 'meter' | 'progressbar';

/** A determinate bar that IS the `meter` or `progressbar` — the usual case. */
export interface MeterProps extends MeterGeometryProps {
  /**
   * What the bar measures. Required: ARIA never computes a name for a `meter`
   * or a `progressbar` from its contents, and the bar draws no text of its own,
   * so without this it announces "level indicator, 40%" with no subject.
   */
  accessibilityLabel: string;
  /**
   * `aria-valuetext` — the reading a screen reader says ("4 of 5"). Without
   * it, the share of the track in the reader's locale (`formatPercent`: "80%",
   * "80 %"), which is what a screen reader says of a bare number.
   */
  valueText?: string;
  /** @default 'meter' — see {@link MeterRole}. */
  role?: MeterRole;
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
  role?: never;
}

export type AnyMeterProps = MeterProps | MeterDecorativeProps;

/** The same measurement drawn as a ring. */
interface MeterRingGeometryProps {
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
   * A disc painted under the whole ring — the scrim that lets an upload ring
   * read over a photo. None by default.
   */
  backdrop?: string;
  /**
   * The arc's end cap. `'round'` reads as a needle tip; at value 0 it would
   * draw a dot on an empty ring, so `'round'` degrades to `'butt'` there.
   * @default 'round'
   */
  cap?: 'round' | 'butt';
  /**
   * Milliseconds the arc eases over, on WEB only — native snaps. Ignored under
   * `prefers-reduced-motion`.
   * @default 0
   */
  transitionMs?: number;
  /**
   * The amount is not known yet — a download that has not started, a step that
   * reports none: a quarter of the ring turns around it, and the progressbar
   * reports no value (`aria-valuenow` absent, `aria-busy`), which is what makes
   * it indeterminate to assistive technology. `value` is not drawn meanwhile.
   * @default false
   */
  indeterminate?: boolean;
  /** Centred content — the score, a glyph. Hidden from assistive technology. */
  children?: ReactNode;
  /** Container style override. */
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

interface MeterRingAccessibleProps extends MeterRingGeometryProps {
  /** Current value. Clamped into `[0, max]`. */
  value: number;
  /** What the ring measures. Required, for the reason `Meter` states. */
  accessibilityLabel: string;
  /** `aria-valuetext`. Without it, the share of the ring, as `Meter`'s. */
  valueText?: string;
  /**
   * @default 'meter' — see {@link MeterRole}. A download's or an install's ring
   * (`indeterminate`, `onStop`) is a `progressbar`.
   */
  role?: MeterRole;
  decorative?: false;
  progress?: never;
}

/**
 * A ring with NO role, hidden from assistive technology: the drawing inside a
 * control that carries its own name (a cancel button, a download toggle), a
 * video note's playback position, a plan's progress beside its own text.
 */
export interface MeterRingDecorativeProps extends MeterRingGeometryProps {
  decorative: true;
  /** Current value. Clamped into `[0, max]`. Ignored when `progress` is given. */
  value?: number;
  /**
   * The drawn share, 0–1, followed on the UI thread from a Reanimated shared
   * value — a loader that fills over its own duration, a ring that eases
   * between steps — instead of `value`. A shared value has no accessible
   * reading, which is why only a decorative ring takes one. The cap stays
   * `'round'` throughout.
   */
  progress?: SharedValue<number>;
  accessibilityLabel?: never;
  valueText?: never;
  role?: never;
  onStop?: never;
  stopLabel?: never;
}

/**
 * {@link MeterRing}'s props. `onStop` makes the ring the control that stops what
 * it measures, as an app store's download ring is: a stop square in its centre
 * and the whole ring pressable, named by `stopLabel` ("Stop downloading Notes"),
 * which it then requires. Without it the ring is not interactive. `children` are
 * not drawn with it. `decorative` draws the ring with no role at all.
 */
export type MeterRingProps =
  | (MeterRingAccessibleProps &
      ({ onStop?: undefined; stopLabel?: undefined } | { onStop: () => void; stopLabel: string }))
  | MeterRingDecorativeProps;
