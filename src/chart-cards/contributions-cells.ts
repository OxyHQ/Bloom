import type { ActivityHeatmapDay } from '../activity-heatmap';

/** One square of the contributions grid. */
export interface ContributionCell {
  /** Contributions that day (or that slot). */
  count: number;
  /** The day as the tooltip names it, e.g. `"Apr 26"`. */
  date?: string;
  /** Colour step 0 (none) → 5 (most). Derived from `count` with `CONTRIBUTION_TIER_THRESHOLDS` when omitted. */
  tier?: ContributionTier;
}

export type ContributionTier = 0 | 1 | 2 | 3 | 4 | 5;

/** Count bands: 0 · 1–4 · 5–9 · 10–15 · 16–24 · 25+. Each entry is a tier's lowest count. */
export const CONTRIBUTION_TIER_THRESHOLDS = [1, 5, 10, 16, 25] as const;

/** The dashboard card's grid: 37 columns × 7 rows. */
export const CONTRIBUTION_COLUMNS = 37;
export const CONTRIBUTION_ROWS = 7;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

export function contributionTier(cell: ContributionCell, thresholds: readonly number[] = CONTRIBUTION_TIER_THRESHOLDS): ContributionTier {
  if (cell.tier !== undefined) return cell.tier;
  let tier = 0;
  for (const t of thresholds) {
    if (cell.count >= t) tier += 1;
    else break;
  }
  return Math.min(5, tier) as ContributionTier;
}

/** Tooltip copy: "12 contributions on Apr 26" / "No contributions on Apr 26". */
export function contributionLabel(cell: ContributionCell): string {
  const on = cell.date ? ` on ${cell.date}` : '';
  if (cell.count === 0) return `No contributions${on}`;
  return `${cell.count} contribution${cell.count === 1 ? '' : 's'}${on}`;
}

/**
 * Deterministic per-cell hash: multiply, xor-shift, multiply, xor-shift, so
 * neighbouring cells scatter instead of striping. The pop-in animation
 * staggers cells by it.
 */
export function hashContributionCell(row: number, col: number): number {
  let h = row * 374761393 + col * 668265263;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

/**
 * Which grid slot a day lands in. The grid is not a calendar: cells run
 * column-major through the year, `columns × 7` slots spread evenly over
 * 365 days (first cell Jan 1, last Dec 31), so a 37-column card reads Jan → Dec
 * under its month labels.
 */
export function contributionCellIndex(dayOfYear: number, columns: number): number {
  const slots = columns * CONTRIBUTION_ROWS;
  return Math.max(0, Math.min(slots - 1, Math.round((dayOfYear / 364) * (slots - 1))));
}

/**
 * Folds per-day counts (`ActivityHeatmap`'s data — see `bucketByDay`) into the
 * card's `columns × 7` cells for one UTC year. Several days sharing a slot are
 * summed; each cell is named after the first day that lands in it.
 */
export function contributionCellsFromDays(
  days: readonly ActivityHeatmapDay[],
  year: number,
  columns: number = CONTRIBUTION_COLUMNS,
): ContributionCell[] {
  const slots = columns * CONTRIBUTION_ROWS;
  const cells: ContributionCell[] = Array.from({ length: slots }, (_, i) => {
    const dayOfYear = Math.round((i / (slots - 1)) * 364);
    const d = new Date(Date.UTC(year, 0, 1 + dayOfYear));
    return { count: 0, date: `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}` };
  });
  const start = Date.UTC(year, 0, 1);
  for (const day of days) {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(day.date);
    if (!match || Number(match[1]) !== year) continue;
    const dayOfYear = Math.round((Date.UTC(year, Number(match[2]) - 1, Number(match[3])) - start) / 86_400_000);
    const cell = cells[contributionCellIndex(Math.min(364, dayOfYear), columns)]!;
    cell.count += day.count;
  }
  return cells;
}
