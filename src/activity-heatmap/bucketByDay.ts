import type { ActivityHeatmapDay } from './types';

const DATE_KEY_RE = /^(\d{4})-(\d{2})-(\d{2})/;

/**
 * Normalize a date input to a `YYYY-MM-DD` key in UTC, or `null` if it can't be
 * parsed. Strings already prefixed with an ISO date are sliced directly (no
 * timezone shift); everything else is parsed and formatted in UTC.
 */
function toDateKey(value: string | Date): string | null {
  if (value instanceof Date) {
    const ts = value.getTime();
    if (Number.isNaN(ts)) return null;
    return formatUtcKey(ts);
  }
  if (DATE_KEY_RE.test(value)) return value.slice(0, 10);
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return null;
  return formatUtcKey(parsed);
}

function formatUtcKey(ts: number): string {
  const d = new Date(ts);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Group arbitrary items by their `YYYY-MM-DD` day and count how many fall on
 * each day. Returns entries sorted ascending by date — ready to hand to
 * {@link ActivityHeatmap}'s `data` prop. Items whose date can't be parsed are
 * skipped.
 */
export function bucketByDay<T>(
  items: T[],
  getDate: (item: T) => string | Date,
): ActivityHeatmapDay[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = toDateKey(getDate(item));
    if (key === null) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}
