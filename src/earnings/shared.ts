/**
 * What the earnings panel paints, and the two pure decisions it is built on.
 *
 * The paint is RELATIVE for the reason every family here computes one the same
 * way: the panel is on a page, in a sheet and inside a card, and a ramp stop
 * picked here would be right for one of them and invisible on the others.
 */
import { hairlineOn, surfaceFillOn, surfaceTextOn } from '../styles/surface-levels';
import type { SurfaceTextPaint } from '../styles/surface-levels';
import type { Theme } from '../theme/types';
import type { EarningsBar, EarningsPeriod } from './types';

export interface EarningsPaint {
  /** The fill the panel's own content lands on. */
  surface: string;
  /** The rule under a section heading. */
  hairline: string;
  /** The next fill UP: a stat tile, the payout row's glyph. */
  tile: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  /** The text rungs that clear AA on a TILE, which is not the panel's fill. */
  tileText: SurfaceTextPaint;
}

export function resolveEarningsPaint(theme: Theme, surface: string): EarningsPaint {
  const text = surfaceTextOn(theme, surface);
  const tile = surfaceFillOn(theme, surface);
  return {
    surface,
    hairline: hairlineOn(theme, surface),
    tile,
    text: text.text,
    textSecondary: text.textSecondary,
    textTertiary: text.textTertiary,
    tileText: surfaceTextOn(theme, tile),
  };
}

/**
 * The period the panel is showing, by id.
 *
 * An id that names no period falls back to the FIRST rather than to nothing: a
 * panel with a stale id in its state would otherwise draw an empty figure, and
 * an empty figure reads as "you earned nothing" rather than as "this app asked
 * for a period that is not on the list".
 */
export function resolveEarningsPeriod(
  periods: readonly EarningsPeriod[],
  id: string | undefined,
): EarningsPeriod | undefined {
  return periods.find((period) => period.id === id) ?? periods[0];
}

/**
 * What the chart's headline says, given which bar the reader is on.
 *
 * THE HEADLINE IS NEVER COMPUTED. At rest it is the period's own `total`; over
 * a bar it is that bar's own `amount`. Both are strings the app formatted, so
 * this function chooses between two answers rather than producing one — which
 * is the whole of what "money arrives pre-formatted" means here.
 *
 * An index outside the bars is treated as no index: an active index that
 * outlived its data must not read a hole.
 */
export function earningsHeadline(
  total: string,
  bars: readonly EarningsBar[] | undefined,
  activeIndex: number | null,
): string {
  if (activeIndex === null || bars === undefined) return total;
  return bars[activeIndex]?.amount ?? total;
}

/** The label over the headline: the period's own name, or the bar the reader is on. */
export function earningsHeadlineLabel(
  rest: string,
  bars: readonly EarningsBar[] | undefined,
  activeIndex: number | null,
): string {
  if (activeIndex === null || bars === undefined) return rest;
  return bars[activeIndex]?.label ?? rest;
}

/** Joins the non-empty parts of an accessible name. */
export function joinEarningsName(
  parts: ReadonlyArray<string | false | null | undefined>,
  separator = ', ',
): string {
  return parts.filter((part): part is string => typeof part === 'string' && part !== '').join(separator);
}
