import { motionCss, motionDurationMs, motionProgressAt, type MotionSpec } from '../motion/spec';

/** Collapsing: the bar takes this ease-out-quad, 150ms. */
export const AUTO_HIDE_BAR_HIDE: MotionSpec = { duration: 150, easing: [0.25, 0.46, 0.45, 0.94] };
/** Coming back (revealed or peeked): ease-out-cubic, 200ms. */
export const AUTO_HIDE_BAR_SHOW: MotionSpec = { duration: 200, easing: [0.215, 0.61, 0.355, 1] };
/** Under reduced motion the geometry lands at once and only this fade remains. */
export const AUTO_HIDE_BAR_REDUCED_FADE: MotionSpec = { duration: 120, easing: [0, 0, 1, 1] };
/** The collapsed bar's scale: it recedes rather than sliding away. */
export const AUTO_HIDE_BAR_SHRINK = 0.94;
/** Extra lift of the receding controls, beyond the half the scale takes off. */
export const AUTO_HIDE_BAR_LIFT = 3;

type Stops = readonly (readonly [number, number])[];

/** The controls go early: gone by 60% of the collapse, before the summary arrives. */
export const CONTROLS_OPACITY: Stops = [
  [0, 1],
  [0.2, 0.45],
  [0.4, 0.15],
  [0.6, 0],
  [1, 0],
];
/** The summary arrives over the second half. */
export const SUMMARY_OPACITY: Stops = [
  [0, 0],
  [0.5, 0],
  [1, 1],
];

/** Piecewise-linear value of `stops` at `x`, clamped at both ends. */
export function interpolateStops(stops: Stops, x: number): number {
  'worklet';
  if (x <= stops[0]![0]) return stops[0]![1];
  for (let index = 1; index < stops.length; index++) {
    const [x1, y1] = stops[index]!;
    if (x <= x1) {
      const [x0, y0] = stops[index - 1]!;
      return x1 === x0 ? y1 : y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
    }
  }
  return stops[stops.length - 1]![1];
}

export type AutoHideBarMode = 'shown' | 'collapsed' | 'peek';

/** What the bar draws: `collapsed` alone recedes; a peek shows the whole bar. */
export function autoHideBarMode(collapsed: boolean, peeking: boolean): AutoHideBarMode {
  if (!collapsed) return 'shown';
  return peeking ? 'peek' : 'collapsed';
}

/** The geometry of the bar at `progress` (0 shown, 1 collapsed). */
export function autoHideBarGeometry(progress: number, height: number, collapsedHeight: number) {
  'worklet';
  const room = Math.max(0, height - collapsedHeight);
  const bandScale = height > 0 ? collapsedHeight / height : 1;
  return {
    bandTranslateY: (-room / 2) * progress,
    bandScaleY: 1 + (bandScale - 1) * progress,
    controlsTranslateY:
      (-((1 - AUTO_HIDE_BAR_SHRINK) * height) / 2 - AUTO_HIDE_BAR_LIFT) * progress,
    controlsScale: 1 + (AUTO_HIDE_BAR_SHRINK - 1) * progress,
  };
}

const SAMPLES = 32;
const round = (value: number) => Math.round(value * 10000) / 10000;

/**
 * A CSS transition whose value follows `stops` of a progress that itself
 * moves on `spec`, from `from` to `to`. The browser interpolates a property
 * between its two end values on the timing function, so the timing function
 * IS the composition: `(stops(progress(t)) - start) / (end - start)`.
 */
export function composedCss(
  spec: MotionSpec,
  stops: Stops,
  from: number,
  to: number,
  reducedMotion = false,
): { duration: string; easing: string } {
  const base = motionCss(spec, reducedMotion);
  const start = interpolateStops(stops, from);
  const end = interpolateStops(stops, to);
  if (start === end) return base;
  const total = motionDurationMs(spec);
  const points: number[] = [];
  for (let index = 0; index <= SAMPLES; index++) {
    const progress = from + (to - from) * motionProgressAt(spec, (total * index) / SAMPLES);
    points.push(round((interpolateStops(stops, progress) - start) / (end - start)));
  }
  return { duration: base.duration, easing: `linear(${points.join(',')})` };
}
