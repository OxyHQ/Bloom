import { Platform } from 'react-native';

import { ACCENT_TABLE, colorRamp, mixColor, resolveButtonRamps, type RampStop } from '../button/shared';
import { parseRgba } from '../theme/color-utils';
import type { Theme } from '../theme/types';
import type { TypeScaleVariant } from '../typography/scale';
import type { LyricLine, LyricsPalette, LyricsSize } from './types';

export const IS_WEB = Platform.OS === 'web';

export const DEFAULT_EMPTY_TEXT = 'Lyrics aren’t available for this track';

// ---------------------------------------------------------------------------
//  Lines
// ---------------------------------------------------------------------------

/** Whether every line carries a finite `time` (and there is at least one line). */
export function isSyncedLyrics(lines: readonly LyricLine[] | undefined): boolean {
  return (
    !!lines &&
    lines.length > 0 &&
    lines.every((line) => typeof line.time === 'number' && Number.isFinite(line.time))
  );
}

/**
 * The lines the view draws. Synced lines are sorted by `time` (stable, so two
 * lines with one time keep their order); unsynced `lines` pass through; with no
 * lines, `text` is split on line breaks into unsynced lines.
 */
export function normalizeLyricLines(
  lines: readonly LyricLine[] | undefined,
  text: string | undefined,
): { lines: readonly LyricLine[]; synced: boolean } {
  if (lines && lines.length > 0) {
    if (!isSyncedLyrics(lines)) return { lines, synced: false };
    const sorted = lines
      .map((line, index) => ({ line, index }))
      .sort((a, b) => (a.line.time as number) - (b.line.time as number) || a.index - b.index)
      .map(({ line }) => line);
    return { lines: sorted, synced: true };
  }
  if (text && text.trim().length > 0) {
    return {
      lines: text.replace(/\r\n?/g, '\n').split('\n').map((t) => ({ text: t.trim() })),
      synced: false,
    };
  }
  return { lines: [], synced: false };
}

/**
 * The index of the line playing at `time`: the LAST line whose `time` is at or
 * before it. `-1` before the first line, with no lines, or for a non-finite
 * time; the last line from its start onwards (lyrics have no end time). A line
 * whose time equals `time` is active. Binary search — `lines` must be sorted
 * by `time` ascending (what {@link normalizeLyricLines} returns); lines without
 * a time are treated as `+∞`.
 */
export function activeLyricIndex(lines: readonly LyricLine[], time: number | undefined): number {
  if (time === undefined || !Number.isFinite(time) || lines.length === 0) return -1;
  let lo = 0;
  let hi = lines.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const start = lines[mid]?.time ?? Number.POSITIVE_INFINITY;
    if (start <= time) {
      found = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return found;
}

/**
 * The scroll offset that puts a line's CENTRE at `anchor` × the viewport's
 * height, clamped to the scrollable range.
 */
export function lyricsScrollTarget({
  lineTop,
  lineHeight,
  viewport,
  content,
  anchor = 1 / 3,
}: {
  lineTop: number;
  lineHeight: number;
  viewport: number;
  content: number;
  anchor?: number;
}): number {
  const target = lineTop + lineHeight / 2 - viewport * anchor;
  const max = Math.max(0, content - viewport);
  return Math.round(Math.min(max, Math.max(0, target)));
}

/**
 * The window of `count` lines a preview shows: the active line second from the
 * top where possible, clamped to the ends. Before the first line it starts at 0.
 */
export function lyricsPreviewWindow(
  length: number,
  active: number,
  count: number,
): { start: number; end: number } {
  const size = Math.min(count, length);
  const start = Math.min(Math.max(0, active - 1), Math.max(0, length - size));
  return { start, end: start + size };
}

/** The type step of a line, by size and whether it is the active one. */
export function lyricLineVariant(size: LyricsSize, active: boolean): TypeScaleVariant {
  if (size === 'large') return active ? 'display-4-bold' : 'display-4-semibold';
  if (size === 'medium') return active ? 'title-1-bold' : 'title-1-semibold';
  return active ? 'title-2-bold' : 'title-2-semibold';
}

/** The default size for a width: `large` from 720, `medium` from 480, `small` below. */
export function lyricsSizeForWidth(width: number): LyricsSize {
  return width >= 720 ? 'large' : width >= 480 ? 'medium' : 'small';
}

// ---------------------------------------------------------------------------
//  Colour
// ---------------------------------------------------------------------------

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** WCAG relative luminance, or `null` for an unparseable colour. */
export function relativeLuminance(color: string): number | null {
  const rgba = parseRgba(color);
  if (!rgba) return null;
  return 0.2126 * channel(rgba.r) + 0.7152 * channel(rgba.g) + 0.0722 * channel(rgba.b);
}

/** WCAG contrast ratio between two opaque colours (1..21); `1` if either does not parse. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  if (la === null || lb === null) return 1;
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * The smallest alpha (in hundredths) at which `foreground` mixed over
 * `background` reaches `ratio`, or `1` when even the full colour does not.
 */
function alphaForContrast(background: string, foreground: string, ratio: number): number {
  for (let step = 0; step <= 100; step++) {
    const alpha = step / 100;
    if (contrastRatio(background, mixColor(background, foreground, alpha)) >= ratio) return alpha;
  }
  return 1;
}

const WHITE = '#ffffff';
/** Contrast the active line keeps against the background. */
export const LYRICS_ACTIVE_CONTRAST = 7;
/** Upcoming lines and the footer: AA for body text. */
export const LYRICS_UPCOMING_CONTRAST = 4.5;
/** Past lines: AA for large text — they are 24px and up. */
export const LYRICS_PAST_CONTRAST = 3;

function paletteFrom(background: string, foreground: string, fromArtwork: boolean): LyricsPalette {
  const upcoming = mixColor(
    background,
    foreground,
    Math.max(0.72, alphaForContrast(background, foreground, LYRICS_UPCOMING_CONTRAST)),
  );
  const past = mixColor(
    background,
    foreground,
    Math.max(0.5, alphaForContrast(background, foreground, LYRICS_PAST_CONTRAST)),
  );
  return {
    background,
    active: foreground,
    upcoming,
    past,
    muted: upcoming,
    pill: foreground,
    pillHover: mixColor(foreground, background, 0.14),
    onPill: background,
    ring: foreground,
    fromArtwork,
  };
}

/**
 * The lyrics colours.
 *
 * With a parseable `artworkColor`: a deep shade of it — the first stop of its
 * ramp (from 800 in light mode, 900 in dark) where white keeps
 * {@link LYRICS_ACTIVE_CONTRAST}:1 — under white text. The ramp's 950 stop
 * always clears it, so a pale colour just lands deeper.
 *
 * Without one: the neutral surface (`neutral-100` light, `neutral-900` dark)
 * under the theme's text colour.
 *
 * Either way upcoming lines are the text colour mixed toward the background no
 * further than 4.5:1 (and at least 72% of it), past lines no further than 3:1
 * (and at least 50%).
 */
export function resolveLyricsPalette(theme: Theme, artworkColor?: string | null): LyricsPalette {
  if (artworkColor && parseRgba(artworkColor)) {
    const ramp = colorRamp(artworkColor, ACCENT_TABLE);
    const stops: RampStop[] = theme.isDark ? [900, 950] : [800, 900, 950];
    const background =
      stops.map((stop) => ramp[stop]).find((c) => contrastRatio(c, WHITE) >= LYRICS_ACTIVE_CONTRAST) ??
      ramp[950];
    return paletteFrom(background, WHITE, true);
  }
  const { neutral } = resolveButtonRamps(theme);
  return paletteFrom(theme.isDark ? neutral[900] : neutral[100], theme.colors.text, false);
}

// ---------------------------------------------------------------------------
//  Web CSS — the hidden scrollbar, cursor and keyboard ring have no inline
//  spelling, so they hang off `dataSet` attributes in one adopted sheet.
// ---------------------------------------------------------------------------

export const LYRICS_STYLE_ID = 'bloom-lyrics-web-css';

export const LYRICS_CSS = `
[data-bloom-lyrics-scroll] {
  scrollbar-width: none;
  overscroll-behavior: contain;
}
[data-bloom-lyrics-scroll]::-webkit-scrollbar {
  display: none;
}
[data-bloom-lyrics-line] {
  outline: none;
  user-select: text;
}
[data-bloom-lyrics-line="seek"] {
  cursor: pointer;
}
[data-bloom-lyrics-line]:focus-visible,
[data-bloom-lyrics-pill]:focus-visible {
  outline: 2px solid var(--bloom-lyrics-ring, currentColor);
  outline-offset: 4px;
  border-radius: 8px;
}
[data-bloom-lyrics-pill] {
  outline: none;
  cursor: pointer;
}
[data-bloom-lyrics-pill]:focus-visible {
  border-radius: 9999px;
}
[data-bloom-lyrics-line] {
  transition: color 200ms ease-out;
}
@media (prefers-reduced-motion: reduce) {
  [data-bloom-lyrics-line] {
    transition: none;
  }
}
`;
