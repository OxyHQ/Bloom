import { Platform } from 'react-native';

import { mixColor, resolveButtonRamps } from '../button/shared';
import { parseRgba } from '../theme/color-utils';
import type { Theme } from '../theme/types';
import type { TypeScaleVariant } from '../typography/scale';
import type { LyricLine, LyricsPalette, LyricsSize } from './types';
import {
  AAA_TEXT_CONTRAST,
  AA_LARGE_TEXT_CONTRAST,
  AA_TEXT_CONTRAST,
  contrastRatio,
  darkenUntilContrast,
  relativeLuminance,
} from '../styles/color-contrast';

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

function paletteFrom(background: string, foreground: string, fromArtwork: boolean): LyricsPalette {
  const upcoming = mixColor(
    background,
    foreground,
    Math.max(0.72, alphaForContrast(background, foreground, AA_TEXT_CONTRAST)),
  );
  const past = mixColor(
    background,
    foreground,
    Math.max(0.5, alphaForContrast(background, foreground, AA_LARGE_TEXT_CONTRAST)),
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
 * With a parseable `artworkColor`: the colour itself, pulled toward black only
 * as far as it takes for white to keep AAA on it, under white text. Black
 * clears any light foreground, so a pale colour just lands deeper.
 *
 * Without one: the neutral surface (`neutral-100` light, `neutral-900` dark)
 * under the theme's text colour.
 *
 * Either way upcoming lines are the text colour mixed toward the background no
 * further than AA (and at least 72% of it), past lines no further than AA for
 * large text (and at least 50%).
 *
 * It DARKENS the colour rather than walking its generated ramp, which is what
 * fixed two visible defects: a ramp re-derives every stop's lightness and
 * chroma from the hue, so a near-black `#101820` came back as a mid-slate ten
 * times lighter than it went in, and a vivid `#1db98a` lost its red channel
 * entirely. Scaling every channel by the same factor keeps their ratio, so a
 * darkened teal is still teal. The pane no longer differs between light and
 * dark mode, which is right: the artwork does not.
 */
export function resolveLyricsPalette(theme: Theme, artworkColor?: string | null): LyricsPalette {
  const shade = artworkColor ? darkenUntilContrast(artworkColor, WHITE, AAA_TEXT_CONTRAST) : null;
  if (shade) return paletteFrom(shade.color, WHITE, true);
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

export { contrastRatio, relativeLuminance };
