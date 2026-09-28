/**
 * What the place-details parts paint, and the pure text they assemble.
 *
 * Every colour is read RELATIVE to the surface the block was dropped on
 * (`styles/surface-levels.ts`) — the same body of a screen renders in a bottom
 * sheet on a phone, in a `ContentPanel` on a desktop and on the bare page in a
 * story, and nothing here picks a ramp stop.
 */
import {
  hairlineOn,
  surfaceFillOn,
  surfaceTextOn,
  type SurfaceTextPaint,
} from '../styles/surface-levels';
import { resolveAccentColors } from '../theme/accent-colors';
import type { Theme } from '../theme/types';
import { PLACE_INFO_ACTION_LABELS } from './constants';
import { PLACE_DETAILS_MESSAGES, type PlaceDetailsMessages } from './messages';
import type {
  PlaceBusyTrend,
  PlaceHoursDay,
  PlaceInfoAction,
  PlaceInfoItem,
  PlacePopularTimesDay,
  PlaceTransitDeparture,
  PlaceTransitMode,
  PlaceTransitStop,
} from './types';

export interface PlaceDetailsPaint extends SurfaceTextPaint {
  /** A rule between two rows, and a stop's spine. */
  hairline: string;
  /** One step off the surface — a chart's empty track, a quiet tile. */
  fill: string;
  /** The keyboard focus ring. */
  ring: string;
  /** A live reading: the success fill, and what reads on it. */
  live: string;
}

export function resolvePlaceDetailsPaint(theme: Theme, surface: string): PlaceDetailsPaint {
  return {
    ...surfaceTextOn(theme, surface),
    hairline: hairlineOn(theme, surface),
    fill: surfaceFillOn(theme, surface),
    ring: resolveAccentColors(theme.colors, 'primary', 'solid').background,
    // The dot AND the word beside it, so a live time is never colour-only: the
    // `subtle` pair is the one measured to read as text on its own surface.
    live: resolveAccentColors(theme.colors, 'success', 'subtle').foreground,
  };
}

// ---------------------------------------------------------------------------
//  PlaceInfoList
// ---------------------------------------------------------------------------

/** What pressing does, as a word. Empty means "say nothing". */
export function infoActionWord(
  action: PlaceInfoAction | undefined,
  override: string | undefined,
  labels: Partial<Record<PlaceInfoAction, string>> | undefined,
  words: Readonly<Record<PlaceInfoAction, string>> = PLACE_INFO_ACTION_LABELS,
): string {
  if (override !== undefined) return override;
  if (action === undefined) return '';
  return labels?.[action] ?? words[action];
}

/**
 * A row in one utterance: the kind, the value, then what pressing does.
 *
 * "Address: Carrer del Forn 12, Copy" rather than "Carrer del Forn 12,
 * Address" — a list of five rows is scanned by its KINDS, and a reader who
 * wants the third one should not have to listen to two addresses to find out
 * which is which. The verb is last because it is what happens IF they act.
 *
 * It is in the name rather than in `accessibilityHint` because web drops the
 * hint; the note on {@link PLACE_INFO_ACTION_LABELS} has the mechanism. An
 * explicit `accessibilityLabel` replaces the whole thing, verb included — a
 * caller spelling the name out is spelling all of it.
 */
export function describeInfoItem(
  item: PlaceInfoItem,
  labels?: Partial<Record<PlaceInfoAction, string>>,
  words?: Readonly<Record<PlaceInfoAction, string>>,
): string {
  if (item.accessibilityLabel) return item.accessibilityLabel;
  const name = item.label ? `${item.label}: ${item.value}` : item.value;
  const word = item.onPress ? infoActionWord(item.action, item.actionLabel, labels, words) : '';
  return word ? `${name}, ${word}` : name;
}

// ---------------------------------------------------------------------------
//  PlaceHours
// ---------------------------------------------------------------------------

export interface HoursFormat {
  /** Between the two ends of one stretch. */
  interval: string;
  /** Between two stretches of a split day. */
  split: string;
  /** A day with no stretches. */
  closed: string;
}

/** English; `PlaceHours` takes `closed` from the app's locale. */
export const DEFAULT_HOURS_FORMAT: HoursFormat = {
  interval: ' – ',
  split: ', ',
  closed: PLACE_DETAILS_MESSAGES.en.closed,
};

/**
 * A day's hours as ONE line: `07:30 – 14:00, 17:00 – 20:00`.
 *
 * A split day stays on one line rather than wrapping to two, because the week
 * is read as a COLUMN of days and a day that takes two rows breaks the
 * alignment that makes the column scannable. Both stretches are short; the pair
 * fits in the space one does.
 */
export function formatHoursDay(day: PlaceHoursDay, format: HoursFormat = DEFAULT_HOURS_FORMAT): string {
  const intervals = day.intervals ?? [];
  if (intervals.length === 0) return day.closedLabel ?? format.closed;
  return intervals.map(({ open, close }) => `${open}${format.interval}${close}`).join(format.split);
}

/**
 * A day row in one utterance, in reading order: today's word, the day, the
 * hours, then the exception.
 *
 * Today is SAID and not only marked, and so is the exception — a heavier weight
 * and a badge are both silent, and "Monday 07:30 to 14:00" read in the same
 * voice as the other six is exactly the row a reader was trying to find.
 */
export function describeHoursDay(
  day: PlaceHoursDay,
  format: HoursFormat = DEFAULT_HOURS_FORMAT,
  todayLabel: string = PLACE_DETAILS_MESSAGES.en.today,
): string {
  const parts: string[] = [];
  if (day.today) parts.push(todayLabel);
  parts.push(day.label);
  parts.push(formatHoursDay(day, format));
  if (day.exception) parts.push(day.exception);
  return parts.join(', ');
}

// ---------------------------------------------------------------------------
//  PlacePopularTimes
// ---------------------------------------------------------------------------

/** The trend sentence as drawn, or `null` when the day does not claim one. */
export function busyTrendLabel(
  day: PlacePopularTimesDay,
  messages: PlaceDetailsMessages = PLACE_DETAILS_MESSAGES.en,
): string | null {
  if (day.trendLabel) return day.trendLabel;
  const trend: PlaceBusyTrend | undefined = day.trend;
  return trend ? messages.busy[trend] : null;
}

/** 0–100, clamped. A closed hour draws no bar whatever it says. */
export function busyValue(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

/**
 * The chart in one sentence, because the chart is ONE element.
 *
 * Twenty-four bars two pixels wide are twenty-four tab stops that say a number
 * each, which is not a reading of anything. So the image is named with what a
 * person would actually take from the picture: which day, when it peaks, and
 * what is happening right now.
 */
export function describeBusyChart(
  day: PlacePopularTimesDay,
  messages: PlaceDetailsMessages = PLACE_DETAILS_MESSAGES.en,
): string {
  const hours = day.hours;
  const name = day.accessibilityLabel ?? day.label;
  if (hours.length === 0) return messages.chartNoData(name);
  // The busiest OPEN hour. A closed one may still carry a reading (an app
  // sending a whole day's curve and a separate opening calendar), and
  // "busiest at 3 in the morning" would be that reading leaking out of a
  // shuttered hour.
  let peak = -1;
  for (let i = 0; i < hours.length; i += 1) {
    if (hours[i]!.closed) continue;
    if (peak === -1 || busyValue(hours[i]!.value) > busyValue(hours[peak]!.value)) peak = i;
  }
  if (peak === -1) return messages.chartClosed(name);
  const peakHour = hours[peak]!;
  const parts = [messages.chartPeak(name, peakHour.accessibilityLabel ?? peakHour.label)];
  const currentIndex = day.currentHourIndex;
  if (currentIndex != null && currentIndex >= 0 && currentIndex < hours.length) {
    const now = hours[currentIndex]!;
    const trend = busyTrendLabel(day, messages);
    const reading = messages.chartNow(now.accessibilityLabel ?? now.label);
    parts.push(trend ? `${reading}, ${trend}` : reading);
  }
  return parts.join(', ');
}

/**
 * Which hour labels are drawn: every `step`-th one, where the step is the
 * smallest that keeps neighbouring labels `pitch` apart.
 *
 * Every hour labelled is unreadable below about 600px — twenty-four labels
 * over a phone's width is 16px each — and dropping the ones that do not fit is
 * the axis's own job, not the caller's.
 */
export function hourLabelStep(count: number, width: number, pitch: number): number {
  if (count <= 0 || width <= 0) return 1;
  const band = width / count;
  if (band >= pitch) return 1;
  return Math.ceil(pitch / band);
}

// ---------------------------------------------------------------------------
//  PlaceTransit
// ---------------------------------------------------------------------------

/** A stop in one utterance: what it is, its name, how far. */
export function describeTransitStop(
  stop: PlaceTransitStop,
  messages: PlaceDetailsMessages = PLACE_DETAILS_MESSAGES.en,
): string {
  const mode: PlaceTransitMode = stop.mode ?? 'bus';
  const parts = [messages.transitModes[mode], stop.name];
  if (stop.distance) parts.push(stop.distance);
  if (stop.note) parts.push(stop.note);
  return parts.join(', ');
}

/**
 * A departure in one utterance: the line, where it goes, when it leaves, and
 * whether the time came off a vehicle.
 *
 * "Live" is a WORD here and a colour on screen. A row that is only green says
 * nothing at all to a reader who cannot see it, and green is also the first
 * thing to go in a high-contrast mode.
 */
export function describeDeparture(
  departure: PlaceTransitDeparture,
  realtimeLabel?: string,
  messages: PlaceDetailsMessages = PLACE_DETAILS_MESSAGES.en,
): string {
  if (departure.accessibilityLabel) return departure.accessibilityLabel;
  const line = departure.line.accessibilityLabel ?? messages.line(departure.line.name);
  const parts = [line];
  const headsign = departure.headsign ?? departure.line.headsign;
  if (headsign) parts.push(messages.towards(headsign));
  parts.push(departure.time);
  if (departure.realtime) parts.push(realtimeLabel ?? messages.live);
  return parts.join(', ');
}
