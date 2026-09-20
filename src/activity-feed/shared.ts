/**
 * What `ActivityFeed` paints, and the pure helpers it and its tests both read.
 *
 * Everything is read off the fill the feed actually lands on — a feed is as
 * likely to sit in a detail panel as on a page — through
 * `styles/surface-levels.ts`.
 */
import { hairlineOn, surfaceFillOn, surfaceTextOn } from '../styles/surface-levels';
import type { Theme } from '../theme/types';
import { ACTIVITY_BODY_CHARS_PER_LINE } from './constants';
import type { ActivityFeedEntry, ActivityFeedGroup } from './types';

export interface ActivityFeedPaint {
  surface: string;
  hairline: string;
  /** The ring punched around the kind mark so it reads as sitting on the avatar. */
  markRing: string;
  /** A day heading's own rule, and the tile behind an outcome. */
  raised: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
}

export function resolveActivityFeedPaint(theme: Theme, surface: string): ActivityFeedPaint {
  const text = surfaceTextOn(theme, surface);
  return {
    surface,
    hairline: hairlineOn(theme, surface),
    markRing: surface,
    raised: surfaceFillOn(theme, surface),
    text: text.text,
    textSecondary: text.textSecondary,
    textTertiary: text.textTertiary,
  };
}

/**
 * Entries bucketed by their own `day` STRING, in first-seen order, with each
 * bucket keeping the order it arrived in.
 *
 * By the string and never by a parsed date: the app formats the day, so it
 * already decided the timezone, the locale and whether today is called "Today".
 * Grouping by the formatted value means the feed cannot disagree with the
 * heading it draws.
 */
export function groupActivityByDay(
  entries: readonly ActivityFeedEntry[],
): readonly ActivityFeedGroup[] {
  const order: string[] = [];
  const buckets = new Map<string, ActivityFeedEntry[]>();
  for (const entry of entries) {
    const bucket = buckets.get(entry.day);
    if (bucket === undefined) {
      order.push(entry.day);
      buckets.set(entry.day, [entry]);
    } else {
      bucket.push(entry);
    }
  }
  return order.map((day) => ({ day, entries: buckets.get(day) ?? [] }));
}

/**
 * Whether a body is long enough to be worth a reveal. See
 * {@link ACTIVITY_BODY_CHARS_PER_LINE} for why this is a character count rather
 * than a measurement.
 */
export function activityBodyIsLong(body: string | undefined, lines: number): boolean {
  if (body === undefined || lines <= 0) return false;
  if (body.includes('\n')) return body.split('\n').length > lines;
  return body.length > lines * ACTIVITY_BODY_CHARS_PER_LINE;
}
