/**
 * The pure half of `LeadScoreCard`: which band a score falls in, how a signed
 * contribution reads, and what the card's two panels are painted with.
 *
 * Pure so the suite can walk the boundaries without rendering — a band that
 * flips one point early is invisible in a screenshot and obvious in a table.
 */
import { resolveMeterColors } from '../stat-bar/shared';
import { mixColors } from '../styles/color-contrast';
import {
  hairlineOn,
  surfaceFillOn,
  surfaceTextOn,
  type SurfaceTextPaint,
} from '../styles/surface-levels';
import { resolveAccentColors, type AccentTone } from '../theme/accent-colors';
import { parseRgba } from '../theme/color-utils';
import type { Theme } from '../theme/types';
import { LEAD_SCORE_THRESHOLDS } from './constants';
import type { LeadScoreBand } from './types';

export interface LeadScorePaint {
  /** The card's own fill — what both panels are stepped off. */
  surface: string;
  /**
   * The TINTED header panel: the band tone's subtle member from
   * `resolveAccentColors`, FLATTENED over the card behind it. Never the fill
   * colour with an alpha appended to it — react-native-web reads that back as
   * fully opaque (`docs/badge.mdx`).
   */
  header: string;
  /** The neutral panel under it, one surface step off the card. */
  panel: string;
  /** The rule between two factor rows, read off the panel it divides. */
  rowRule: string;
  /**
   * The ring's unearned arc. Read off the HEADER, not from `stat-bar`'s
   * default rail: that rail is a neutral computed for the page, and on a tinted
   * panel it reads as a foreign grey ring rather than as the empty part of this
   * one.
   */
  track: string;
  /**
   * The earned arc, and a positive factor's mark: `stat-bar`'s own accent, so
   * this card's measurement is the same object as every other measurement in
   * the library. A status colour says something else — a green ring claims
   * "healthy", which is not the claim "82 of 100" makes.
   */
  fill: string;
  /**
   * A negative factor's mark: the quiet graphical rung read off the PANEL it is
   * drawn on, so it clears that fill at 3:1 rather than being a ramp stop
   * picked by eye. `chart-cards`' `neutralSeries` is the obvious candidate and
   * is the wrong one — it is `neutral-800` in dark, which is the panel's own
   * neighbourhood, and the mark would disappear.
   */
  negativeMark: string;
  /** Text rungs on the tinted header. */
  headerText: SurfaceTextPaint;
  /** Text rungs on the neutral panel. They are NOT the header's. */
  panelText: SurfaceTextPaint;
}

/**
 * A translucent token as it is actually PAINTED: composited over the fill
 * behind it.
 *
 * The `*Subtle` members are `rgba()` on purpose — a tint IS an alpha of a fill
 * — and painting one renders correctly. What does NOT work is DERIVING off it:
 * every reader in `styles/color-contrast.ts` treats a colour as opaque, so a
 * text rung or a hairline read from `rgba(16 185 129 / 0.24)` is computed
 * against solid emerald and lands on a panel that is nothing like it. Measured
 * on this card before it was flattened: the header's secondary label came back
 * at 1.96:1 against its own panel in dark mode.
 *
 * So the tint is composited ONCE, here, and the flattened colour is what the
 * panel paints and what every rung is read off — the two can then never
 * disagree. This is parse-and-re-emit, not concatenation, and it is the same
 * move `chip/hue-colors.ts` makes for a translucent hue.
 */
export function flattenOver(parent: string, translucent: string): string {
  const top = parseRgba(translucent);
  if (top === null) return translucent;
  return mixColors(parent, `rgb(${top.r} ${top.g} ${top.b})`, top.a);
}

export function resolveLeadScorePaint(
  theme: Theme,
  surface: string,
  tone: AccentTone,
): LeadScorePaint {
  const header = flattenOver(surface, resolveAccentColors(theme.colors, tone, 'subtle').background);
  const panel = surfaceFillOn(theme, surface);
  return {
    surface,
    header,
    panel,
    rowRule: hairlineOn(theme, panel),
    track: hairlineOn(theme, header),
    fill: resolveMeterColors(theme).fill,
    negativeMark: surfaceTextOn(theme, panel).textGraphical,
    headerText: surfaceTextOn(theme, header),
    panelText: surfaceTextOn(theme, panel),
  };
}

/**
 * The band a score falls in, by FRACTION of the scale. The boundaries are
 * inclusive upward: exactly 0.4 is warm and exactly 0.7 is hot, so a score
 * sitting on a threshold reads as having reached it.
 *
 * A non-positive `max` has no scale to divide, so the score is `cold` rather
 * than `NaN` — a card that renders is better than one that throws over data it
 * did not choose.
 */
export function resolveLeadScoreBand(score: number, max: number): LeadScoreBand {
  if (!(max > 0) || Number.isNaN(score)) return 'cold';
  const fraction = Math.min(Math.max(score / max, 0), 1);
  if (fraction >= LEAD_SCORE_THRESHOLDS.hot) return 'hot';
  if (fraction >= LEAD_SCORE_THRESHOLDS.warm) return 'warm';
  return 'cold';
}

/** A signed contribution as it is drawn and announced: `+12`, `-6`, `0`. */
export function formatContribution(contribution: number): string {
  return contribution > 0 ? `+${contribution}` : String(contribution);
}

/**
 * The row's reading line: the label, and the detail after it when there is one.
 *
 * One string rather than two nodes, because the row truncates as a SENTENCE —
 * two independently shrinking texts drop the label to "Fits the ide…" while the
 * detail beside it still has room.
 */
export function factorLine(label: string, detail?: string): string {
  return detail === undefined || detail === '' ? label : `${label}: ${detail}`;
}
