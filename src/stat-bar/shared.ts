import { formatPercent } from '../locale/format-number';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import type { Theme } from '../theme/types';

/**
 * ONE determinate meter's colours.
 *
 * THE FILL IS THE ACCENT. Before this existed, nine hand-rolled bars disagreed:
 * `rating`, `wizard` and `tenancy` painted the fill `theme.colors.text` — a
 * near-black bar — while `listing-actions`, `listing-editor`,
 * `property-insights`, `creator-studio`, `track-list`, `media-card` and
 * `media-header` used the accent. A near-black fill reads as ink, not as a
 * measurement: on a neutral rail it is the highest-contrast thing on the row,
 * so a 20%-full bar shouts louder than the text beside it, and in dark mode it
 * inverts into whatever `colors.text` resolves to. The accent is the one colour
 * in the theme that means "this is the quantity" — which is why the majority
 * already used it. `fill` stays overridable for the cases that genuinely encode
 * something else (a status tone, a chart series).
 *
 * THE TRACK IS `neutral-200` / `neutral-700`. Measured across the tree before
 * this landed: `n[200]/n[700]` in `media-controls`, `media-card`,
 * `media-header`, `track-list`, `tenancy`, `listing-actions` and
 * `listing-editor` (seven), `n[200]/n[800]` in `rating` and `creator-studio`
 * (two), `n[300]/n[700]` in `wizard` (one) and `n[100]/n[800]` in
 * `property-insights` (one). The majority wins on numbers, and it is also the
 * one that holds in both modes: `n[100]` is invisible on a card, and `n[800]`
 * against a `n[900]` surface is a rail you have to look for.
 *
 * A CHART IS NOT A METER and does not come here. A data series is coloured from
 * `chart-cards/palette.ts` (`chartHueTone`, `resolveMonoTone`), because a
 * series' colour encodes WHICH datum it is; a meter's fill encodes HOW MUCH of
 * one. `property-insights/PricePerAreaComparison` is the case that moved.
 */
export interface MeterColors {
  /** The filled portion — `accent-500`. */
  fill: string;
  /** The rail behind it — `neutral-200`, `neutral-700` in dark. */
  track: string;
}

export function resolveMeterColors(theme: Theme): MeterColors {
  return { fill: theme.colors.primary, track: theme.colors.backgroundTertiary };
}

/** `value` clamped into `[0, max]`, with a non-finite `value` read as 0. */
export function meterValue(value: number, max: number): number {
  if (!Number.isFinite(value)) return 0;
  if (!Number.isFinite(max) || max <= 0) return 0;
  return Math.min(max, Math.max(0, value));
}

/** The filled share, 0..1. A non-finite value or a non-positive `max` read as empty. */
export function meterFraction(value: number, max: number): number {
  if (!Number.isFinite(max) || max <= 0) return 0;
  return meterValue(value, max) / max;
}

/**
 * What a meter says without its caller's words: the share of the track, in the
 * reader's locale (`0.42` of 1 → `42%`, `42 %` in Spanish), as a screen reader
 * says a bare number. React Native keeps `aria-valuenow` as a WHOLE number, so
 * a fraction of 1 would otherwise read as nothing, natively.
 */
export function meterValueText(value: number, max: number, locale?: string): string {
  return formatPercent(meterFraction(value, max), locale);
}

// ---------------------------------------------------------------------------
//  Web transition
//
//  A meter that eases has to do it in CSS: react-native-web renders a real DOM
//  node, and an inline style cannot carry a `prefers-reduced-motion` rule. The
//  hooks are `data-*` attributes through `dataSet` (a `className` never reaches
//  the DOM — react-native-css consumes it into `style`), and the DURATION rides
//  in on a custom property so one stylesheet serves every caller instead of one
//  sheet per duration. `adoptStyleSheet` uses a CONSTRUCTED sheet, so a
//  `style-src 'self'` policy cannot drop the rules (see AGENTS.md). An
//  indeterminate ring turns the same way (`data-bloom-meter-spin`): it is an
//  activity indicator, so it keeps turning under reduced motion, as the
//  spinner does.
// ---------------------------------------------------------------------------

const STYLE_ID = 'bloom-meter-web-css';
/** The custom property the duration rides in on; `0ms` when nobody sets it. */
export const METER_DURATION_VAR = '--bloom-meter-ms';
const FILL = '[data-bloom-meter-fill]';
const ARC = '[data-bloom-meter-arc] circle:last-child';
const SPIN = '[data-bloom-meter-spin]';
const SWEEP = '[data-bloom-meter-sweep]';
/** One turn of an indeterminate ring, in ms: the same on native (MeterRing.tsx). */
export const METER_SPIN_MS = 1000;
/** One pass of an indeterminate bar's segment across the track, in ms: the same on native (Meter.tsx). */
export const METER_SWEEP_MS = 1400;
/**
 * The indeterminate segment's width, as a share of the track. It travels from
 * fully off the left edge to fully off the right one, and parks
 * {@link METER_SWEEP_PARKED} along under reduced motion.
 */
export const METER_SWEEP_SHARE = 0.4;
/** Where the parked segment's left edge sits, as a share of the track. */
export const METER_SWEEP_PARKED = 0.3;

/** A share as a CSS percentage, rounded so float error never reaches a style. */
export const sharePercent = (share: number): `${number}%` => `${Math.round(share * 1000) / 10}%`;

const CSS = `
@keyframes bloomMeterSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
${SPIN} {
  animation: bloomMeterSpin ${METER_SPIN_MS}ms linear infinite;
}
@keyframes bloomMeterSweep {
  from { transform: translateX(-100%); }
  to { transform: translateX(${sharePercent(1 / METER_SWEEP_SHARE)}); }
}
${SWEEP} {
  animation: bloomMeterSweep ${METER_SWEEP_MS}ms ease-in-out infinite;
}
${FILL} {
  transition: width var(${METER_DURATION_VAR}, 0ms) ease-out;
}
${ARC} {
  transition: stroke-dashoffset var(${METER_DURATION_VAR}, 0ms) ease-out;
}
@media (prefers-reduced-motion: reduce) {
  ${FILL},
  ${ARC} {
    transition: none;
  }
  ${SWEEP} {
    animation: none;
    transform: translateX(${sharePercent(METER_SWEEP_PARKED / METER_SWEEP_SHARE)});
  }
}
`;

/** Adopts the meter stylesheet. A no-op without a `document`. */
export function adoptMeterStyleSheet(): void {
  adoptStyleSheet(STYLE_ID, CSS);
}
