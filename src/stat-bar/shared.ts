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

// ---------------------------------------------------------------------------
//  Web transition
//
//  A meter that eases has to do it in CSS: react-native-web renders a real DOM
//  node, and an inline style cannot carry a `prefers-reduced-motion` rule. The
//  hooks are `data-*` attributes through `dataSet` (a `className` never reaches
//  the DOM — react-native-css consumes it into `style`), and the DURATION rides
//  in on a custom property so one stylesheet serves every caller instead of one
//  sheet per duration. `adoptStyleSheet` uses a CONSTRUCTED sheet, so a
//  `style-src 'self'` policy cannot drop the rules (see AGENTS.md).
// ---------------------------------------------------------------------------

const STYLE_ID = 'bloom-meter-web-css';
/** The custom property the duration rides in on; `0ms` when nobody sets it. */
export const METER_DURATION_VAR = '--bloom-meter-ms';
const FILL = '[data-bloom-meter-fill]';
const ARC = '[data-bloom-meter-arc] circle:last-child';

const CSS = `
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
}
`;

/** Adopts the meter stylesheet. A no-op without a `document`. */
export function adoptMeterStyleSheet(): void {
  adoptStyleSheet(STYLE_ID, CSS);
}
