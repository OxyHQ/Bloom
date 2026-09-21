/**
 * What `JobCard` paints, and the pure decisions the board is built on.
 *
 * The paint is RELATIVE, for the reason every commerce family here computes one
 * the same way: the card is a `Card` on a board and a bare row inside a sheet,
 * and a ramp stop picked here would be right for one of them and invisible on
 * the other. Everything comes off the fill the content actually lands on
 * (`styles/surface-levels.ts`).
 *
 * The ORDER and the FILTER are pure and exported because both are claims about
 * a SET — ties, a job with no number for the key, a board of one — and those
 * are boundaries a render-level test can only reach by building six fixtures.
 */
import { interactiveWebCss } from '../styles/interactive-web-css';
import { hairlineOn, surfaceFillOn, surfaceTextOn } from '../styles/surface-levels';
import type { SurfaceTextPaint } from '../styles/surface-levels';
import type { Theme } from '../theme/types';
import type { JobBoardFilter, JobBoardSort, JobOffer } from './types';

export interface JobPaint {
  /** The fill the content lands on — the card's, or the ambient one at compact. */
  surface: string;
  /** The rule over the action footer, and the breakdown's own divider. */
  hairline: string;
  /** The next fill UP: a tile, the mark, the wash a bare press target takes. */
  tile: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  /** The text rungs that clear AA on a TILE, which is not the card's fill. */
  tileText: SurfaceTextPaint;
  /** The looked-at card's border, and the focus ring. */
  accent: string;
}

export function resolveJobPaint(theme: Theme, surface: string): JobPaint {
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
    accent: theme.colors.primary,
  };
}

/**
 * Whether the card's actions carry their LABELS at this width.
 *
 * A pure function of the measured width so the threshold can be walked without
 * a layout pass — `onLayout` never fires in jsdom, and a threshold only a
 * browser exercises is a threshold nothing pins. Before the first layout the
 * width is `null` and the labels are ON: an unmeasured card is one the caller
 * has not constrained, and the label is the better of the two guesses.
 */
export function jobActionsAreLabelled(width: number | null, narrowWidth: number): boolean {
  return width === null || width >= narrowWidth;
}

/**
 * The jobs in the order the board draws them.
 *
 * Every key is a NUMBER the caller supplied for comparison only — this family
 * never reads a formatted amount — so a job with no number for the current
 * order cannot be placed against one that has a number, and goes LAST. Within
 * the missing group the caller's own order is kept, because there is nothing
 * left to sort on and re-shuffling a group of equals makes a board jump for no
 * visible reason.
 *
 * PAY sorts HIGH first; everything else sorts LOW first. A courier scanning for
 * money wants the biggest number, and scanning for distance or for time wants
 * the smallest, so one direction for all four would be wrong three times.
 *
 * Stable: equal keys keep their input order.
 */
export function sortJobOffers(jobs: readonly JobOffer[], sort: JobBoardSort): JobOffer[] {
  const key = (job: JobOffer): number | undefined => {
    if (sort === 'pay') return job.payValue;
    if (sort === 'distance') return job.distanceKm;
    if (sort === 'soonest') return job.startsInMinutes;
    return job.expiresInMinutes;
  };
  const direction = sort === 'pay' ? -1 : 1;
  return jobs
    .map((job, index) => ({ job, index, key: key(job) }))
    .sort((a, b) => {
      if (a.key === undefined && b.key === undefined) return a.index - b.index;
      if (a.key === undefined) return 1;
      if (b.key === undefined) return -1;
      if (a.key === b.key) return a.index - b.index;
      return (a.key - b.key) * direction;
    })
    .map((entry) => entry.job);
}

/**
 * The jobs the filter admits, in the order they arrived.
 *
 * **A FILTER CANNOT EXCLUDE WHAT IT CANNOT MEASURE.** A job with no
 * `distanceKm` survives every distance band, and one with no `payValue`
 * survives every pay floor. The alternative — dropping it — hides work from a
 * courier because the app omitted a field, which is the failure mode of every
 * filter that treats a missing value as a zero.
 *
 * The four questions are independent and combine with AND. An omitted or `null`
 * band is "any" and asks nothing; an empty `vehicles` array is "any" too,
 * because a filter nobody has narrowed must not empty the board.
 *
 * STATE IS NOT A FILTER. A taken or expired job stays: see {@link JobOfferState}.
 */
export function filterJobOffers(
  jobs: readonly JobOffer[],
  filter: JobBoardFilter | undefined,
): JobOffer[] {
  if (filter === undefined) return [...jobs];
  const { maxDistanceKm, minPay, startsWithinMinutes, vehicles } = filter;
  return jobs.filter((job) => {
    if (
      maxDistanceKm !== undefined &&
      maxDistanceKm !== null &&
      job.distanceKm !== undefined &&
      job.distanceKm > maxDistanceKm
    )
      return false;
    if (
      minPay !== undefined &&
      minPay !== null &&
      job.payValue !== undefined &&
      job.payValue < minPay
    )
      return false;
    if (
      startsWithinMinutes !== undefined &&
      startsWithinMinutes !== null &&
      job.startsInMinutes !== undefined &&
      job.startsInMinutes > startsWithinMinutes
    )
      return false;
    if (
      vehicles !== undefined &&
      vehicles.length > 0 &&
      job.vehicleKind !== undefined &&
      !vehicles.includes(job.vehicleKind)
    )
      return false;
    return true;
  });
}

/** How many of the four dimensions the reader has narrowed. Pure. */
export function countActiveJobFilters(filter: JobBoardFilter | undefined): number {
  if (filter === undefined) return 0;
  let count = 0;
  if (filter.maxDistanceKm !== undefined && filter.maxDistanceKm !== null) count += 1;
  if (filter.minPay !== undefined && filter.minPay !== null) count += 1;
  if (filter.startsWithinMinutes !== undefined && filter.startsWithinMinutes !== null) count += 1;
  if (filter.vehicles !== undefined && filter.vehicles.length > 0) count += 1;
  return count;
}

/**
 * The vehicle set after pressing one of its chips.
 *
 * A vehicle row is a set of TOGGLES, not a radiogroup: a courier with a van can
 * take a bike job, and "van or box truck" is a sentence the board has to be able
 * to say. Pressing the only selected vehicle clears the dimension rather than
 * leaving a set nothing can be added to.
 */
export function toggleJobVehicle<T extends string>(
  vehicles: readonly T[] | undefined,
  vehicle: T,
): T[] {
  const current = vehicles ?? [];
  return current.includes(vehicle)
    ? current.filter((item) => item !== vehicle)
    : [...current, vehicle];
}

/** Joins the non-empty parts of an accessible name. */
export function joinJobName(
  parts: ReadonlyArray<string | number | false | null | undefined>,
  separator = ', ',
): string {
  return parts
    .map((part) => (typeof part === 'number' ? String(part) : part))
    .filter((part): part is string => typeof part === 'string' && part !== '')
    .join(separator);
}

// ---------------------------------------------------------------------------
//  Keyboard focus on web
//
//  The load block is a react-native-web `Pressable`: focusable, with the
//  outline reset, so without a `:focus-visible` rule a keyboard user tabs
//  through an invisible stop. Inline styles carry no pseudo-classes, so the
//  rule lives in an adopted sheet hanging off a `dataSet` attribute, and the
//  ring colour is a per-instance custom property because it is a resolved
//  token.
// ---------------------------------------------------------------------------

export const JOB_BOARD_STYLE_ID = 'bloom-job-board-web-css';

export const JOB_BOARD_WEB_CSS = interactiveWebCss({
  selector: '[data-bloom-job-subject]',
  varPrefix: 'bloom-job',
  reset: 'none',
  transition: 'background-color 150ms ease',
});
