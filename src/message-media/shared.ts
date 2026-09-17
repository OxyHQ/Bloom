import { Platform } from 'react-native';

import { colorRamp, mixColor, neutralRamp, resolveButtonRamps, ACCENT_TABLE } from '../button/shared';
import { formatFileSize } from '../file-upload/shared';
import { contrastRatio, relativeLuminance } from '../styles/color-contrast';
import type { Theme } from '../theme/types';
import type { FileKind, MessageTone, VoicePlaybackRate } from './types';

export const IS_WEB = Platform.OS === 'web';

// ---------------------------------------------------------------------------
//  Contrast
// ---------------------------------------------------------------------------

/** AA for body text. Every foreground this family derives clears it. */
export const AA_TEXT = 4.5;
/** AA for large text and for non-text UI (a rail, a pill edge, a glyph). */
export const AA_LARGE = 3;

/**
 * `foreground` mixed over `background` at the SMALLEST alpha that reaches
 * `ratio`, or the full colour when even that does not.
 *
 * This is the one move that makes a block work on both bubbles. A secondary
 * label cannot be `colors.textSecondary` here: over the accent bubble that is a
 * grey on a saturated fill, and it lands anywhere between 1.1:1 and 3:1
 * depending on the preset. Mixing the bubble's OWN on-colour up from the fill
 * until it clears the bar gives a muted label that is muted by the same amount
 * on every preset, in both modes, and is never illegible.
 */
export function mixToContrast(
  background: string,
  foreground: string,
  ratio: number,
  minAlpha = 0,
): string {
  const start = Math.round(minAlpha * 100);
  for (let step = start; step <= 100; step++) {
    const candidate = mixColor(background, foreground, step / 100);
    if (contrastRatio(background, candidate) >= ratio) return candidate;
  }
  return foreground;
}

/**
 * `color`, darkened or lightened until it clears `ratio` against `background`.
 *
 * Unlike {@link mixToContrast} this keeps the HUE — it is how a file-kind colour
 * survives being drawn on a near-white disc on the accent bubble, and how the
 * live-location dot stays red on one.
 *
 * It tries BOTH directions and takes whichever reaches the ratio with the
 * SMALLER mix, because that is the one that loses the least hue. Picking the
 * direction from the background's luminance alone is wrong in the middle of the
 * range: over a mid-tone accent (a 0.28-luminance blue) "background is dark, so
 * go lighter" turned the negative red into a near-white dot — technically
 * visible, and no longer red, which is the one thing that dot has to say. A tie
 * goes to the darker candidate: a dark red still reads as red, a pale one reads
 * as pink.
 */
export function ensureContrast(background: string, color: string, ratio: number): string {
  if (contrastRatio(background, color) >= ratio) return color;
  const STEPS = 20;
  let darker: string | undefined;
  let lighter: string | undefined;
  let darkerStep = STEPS + 1;
  let lighterStep = STEPS + 1;
  for (let step = 1; step <= STEPS; step++) {
    if (darker === undefined) {
      const candidate = mixColor(color, '#000000', step / STEPS);
      if (contrastRatio(background, candidate) >= ratio) {
        darker = candidate;
        darkerStep = step;
      }
    }
    if (lighter === undefined) {
      const candidate = mixColor(color, '#ffffff', step / STEPS);
      if (contrastRatio(background, candidate) >= ratio) {
        lighter = candidate;
        lighterStep = step;
      }
    }
    if (darker !== undefined && lighter !== undefined) break;
  }
  if (darker !== undefined && darkerStep <= lighterStep) return darker;
  if (lighter !== undefined) return lighter;
  return darker ?? ((relativeLuminance(background) ?? 0) > 0.45 ? '#000000' : '#ffffff');
}

// ---------------------------------------------------------------------------
//  Paint
// ---------------------------------------------------------------------------

/** Every colour this family paints, for ONE tone. */
export interface MessageMediaPaint {
  tone: MessageTone;
  /** The bubble fill the block believes it is on — contrast maths only. */
  bubble: string;
  /** Primary label. */
  text: string;
  /** Secondary label / meta, AA against the bubble. */
  textMuted: string;
  /** The interactive accent ON the bubble (a link, a filled bar, a vote mark). */
  accent: string;
  /** A label that is legible on `accent`. */
  onAccent: string;
  /** An unfilled rail / track. */
  rail: string;
  /** A hairline on the bubble. */
  border: string;
  /** A nested surface on the bubble (a file disc, the map placeholder). */
  wash: string;
  /** A stronger nested surface (a pressed row, a pill). */
  washStrong: string;
  /** The flat colour behind an image that has not loaded. */
  placeholder: string;
  /** The scrim a duration pill / "+N" sits on, over a photo. */
  scrim: string;
  /** A label on `scrim` — always light, because a scrim is always dark. */
  onScrim: string;
  /** Under a spoiler, on native, where there is no blur to hide behind. */
  spoilerScrim: string;
  /** Negative (a failed send, a wrong quiz answer). */
  danger: string;
  /** Positive (a right quiz answer). */
  correct: string;
  /** The live-location pulse. */
  live: string;
  /** Focus ring colour for the web CSS. */
  ring: string;
}

/** The bubble fill for a tone — the one both this family and the shell agree on. */
export function resolveBubbleColor(theme: Theme, tone: MessageTone): string {
  const { neutral } = resolveButtonRamps(theme);
  if (tone === 'outgoing') return theme.colors.primary;
  return theme.isDark ? neutral[800] : neutral[100];
}

/**
 * The palette for one tone.
 *
 * `onColor` and `bubbleColor` override the two ends; everything between them is
 * re-derived from whatever they are, so an app painting its own bubble gets the
 * same contrast guarantees as the built-in tones.
 */
export function resolveMessageMediaPaint(
  theme: Theme,
  tone: MessageTone = 'incoming',
  onColor?: string,
  bubbleColor?: string,
): MessageMediaPaint {
  const { accent, neutral } = resolveButtonRamps(theme);
  const { colors } = theme;
  const dark = theme.isDark;
  const bubble = bubbleColor ?? resolveBubbleColor(theme, tone);
  const outgoing = tone === 'outgoing';
  const text = onColor ?? (outgoing ? colors.primaryForeground : colors.text);

  // The accent ON the bubble. Over the neutral bubble it is the theme accent.
  // Over the accent bubble an accent-on-accent is invisible, so the block's own
  // on-colour becomes the accent and the fill under it is a wash of the bubble.
  const accentOnBubble = outgoing
    ? text
    : ensureContrast(bubble, dark ? accent[400] : accent[600], AA_TEXT);

  const danger = ensureContrast(bubble, colors.error, AA_TEXT);
  const correct = ensureContrast(bubble, colors.success, AA_TEXT);

  return {
    tone,
    bubble,
    text,
    // 4.5:1 rather than the 3:1 a "secondary" usually settles for: timestamps
    // and file meta inside a bubble are 11–13px, which is not large text.
    textMuted: mixToContrast(bubble, text, AA_TEXT, 0.55),
    accent: accentOnBubble,
    onAccent: outgoing ? bubble : colors.primaryForeground,
    rail: mixColor(bubble, text, 0.2),
    border: mixColor(bubble, text, 0.14),
    wash: mixColor(bubble, text, 0.08),
    washStrong: mixColor(bubble, text, 0.16),
    placeholder: dark ? neutral[700] : neutral[200],
    scrim: 'rgba(0, 0, 0, 0.45)',
    onScrim: '#ffffff',
    spoilerScrim: dark ? neutral[700] : neutral[300],
    danger: outgoing ? text : danger,
    correct: outgoing ? text : correct,
    live: ensureContrast(bubble, colors.error, AA_LARGE),
    ring: accent[500],
  };
}

/**
 * The colour a file KIND is drawn in, and the disc it is drawn on.
 *
 * On the neutral bubble the disc is a light tint of the hue and the glyph is the
 * hue itself. On the accent bubble a tint of the hue would be a tint of a
 * saturated fill, so the disc is nearly the bubble's on-colour (a light disc) and
 * the hue is darkened onto it — the kind stays colour-coded in BOTH tones, which
 * it does not if the accent bubble simply drops the colour.
 */
export function resolveFileKindPaint(
  theme: Theme,
  kind: FileKind,
  paint: MessageMediaPaint,
): { disc: string; glyph: string } {
  const hue = FILE_KIND_COLORS[kind](theme);
  if (paint.tone === 'outgoing') {
    const disc = mixColor(paint.bubble, paint.text, 0.92);
    return { disc, glyph: ensureContrast(disc, hue, AA_LARGE) };
  }
  const disc = mixColor(paint.bubble, hue, theme.isDark ? 0.22 : 0.14);
  return { disc, glyph: ensureContrast(disc, hue, AA_LARGE) };
}

/** One hue per kind, all from the theme's own status / accent roles. */
const FILE_KIND_COLORS: Record<FileKind, (theme: Theme) => string> = {
  pdf: (t) => t.colors.error,
  doc: (t) => t.colors.info,
  sheet: (t) => t.colors.success,
  slides: (t) => t.colors.warning,
  zip: (t) => t.colors.tertiary,
  audio: (t) => t.colors.secondary,
  video: (t) => t.colors.primary,
  image: (t) => colorRamp(t.colors.primary, ACCENT_TABLE)[400],
  code: (t) => t.colors.tertiary,
  other: (t) => neutralRamp(t.colors.text)[t.isDark ? 400 : 500],
};

// ---------------------------------------------------------------------------
//  Files
// ---------------------------------------------------------------------------

/** The extension, lower case, without the dot. `""` when the name has none. */
export function fileExtension(name: string): string {
  const base = name.split('/').pop() ?? name;
  const dot = base.lastIndexOf('.');
  if (dot <= 0 || dot === base.length - 1) return '';
  return base.slice(dot + 1).toLowerCase();
}

const EXTENSION_KINDS: Record<string, FileKind> = {
  pdf: 'pdf',
  doc: 'doc', docx: 'doc', rtf: 'doc', odt: 'doc', txt: 'doc', md: 'doc', pages: 'doc',
  xls: 'sheet', xlsx: 'sheet', csv: 'sheet', ods: 'sheet', numbers: 'sheet',
  ppt: 'slides', pptx: 'slides', odp: 'slides', key: 'slides',
  zip: 'zip', rar: 'zip', '7z': 'zip', gz: 'zip', tar: 'zip', bz2: 'zip',
  mp3: 'audio', m4a: 'audio', wav: 'audio', aac: 'audio', flac: 'audio', ogg: 'audio', opus: 'audio',
  mp4: 'video', mov: 'video', mkv: 'video', webm: 'video', avi: 'video', m4v: 'video',
  png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', webp: 'image', heic: 'image',
  svg: 'image', avif: 'image',
  js: 'code', ts: 'code', tsx: 'code', jsx: 'code', json: 'code', py: 'code', rb: 'code',
  go: 'code', rs: 'code', java: 'code', html: 'code', css: 'code', sh: 'code', yml: 'code',
  yaml: 'code', xml: 'code',
};

const MIME_KINDS: ReadonlyArray<readonly [string, FileKind]> = [
  ['application/pdf', 'pdf'],
  ['application/zip', 'zip'],
  ['application/x-tar', 'zip'],
  ['application/gzip', 'zip'],
  ['application/vnd.openxmlformats-officedocument.spreadsheet', 'sheet'],
  ['application/vnd.ms-excel', 'sheet'],
  ['text/csv', 'sheet'],
  ['application/vnd.openxmlformats-officedocument.presentation', 'slides'],
  ['application/vnd.ms-powerpoint', 'slides'],
  ['application/msword', 'doc'],
  ['application/vnd.openxmlformats-officedocument.wordprocessing', 'doc'],
  ['audio/', 'audio'],
  ['video/', 'video'],
  ['image/', 'image'],
  ['text/', 'doc'],
];

/**
 * The kind a file is drawn as, from its NAME first and its MIME type second.
 *
 * The name wins because it is the one the user sees: a `.csv` served as
 * `text/plain` is still a spreadsheet to the person who sent it.
 */
export function fileKindFor(name: string, mimeType?: string): FileKind {
  const ext = fileExtension(name);
  const byExt = EXTENSION_KINDS[ext];
  if (byExt) return byExt;
  if (mimeType) {
    const mime = mimeType.toLowerCase();
    for (const [prefix, kind] of MIME_KINDS) if (mime.startsWith(prefix)) return kind;
  }
  return 'other';
}

/** The type word beside the size: `"PDF"`, or `"File"` when there is no extension. */
export function fileTypeLabel(name: string, mimeType?: string): string {
  const ext = fileExtension(name);
  if (ext) return ext.toUpperCase();
  const kind = fileKindFor(name, mimeType);
  return kind === 'other' ? 'File' : kind.toUpperCase();
}

/**
 * The `"2.4 MB · PDF"` meta line. Segments that are absent are dropped rather
 * than rendered as an empty separator.
 */
export function fileMetaLine(segments: ReadonlyArray<string | undefined>): string {
  return segments.filter((s): s is string => typeof s === 'string' && s.length > 0).join(' · ');
}


// ---------------------------------------------------------------------------
//  Album layout
// ---------------------------------------------------------------------------

/** How many cells fit before the last one becomes a "+N". */
export const MAX_ALBUM_TILES = 10;
/** The gap between album cells. Two pixels: a seam, not a gutter. */
export const ALBUM_GAP = 2;

export interface AlbumCellRect {
  /** Index into the caller's `items`. */
  index: number;
  left: number;
  top: number;
  width: number;
  height: number;
  /** Corner radii — only the GROUP's four outer corners are rounded. */
  radii: { topLeft: number; topRight: number; bottomLeft: number; bottomRight: number };
}

export interface AlbumLayout {
  cells: AlbumCellRect[];
  width: number;
  height: number;
  /** Cells per row, top to bottom. */
  rows: number[];
  /** How many items did NOT get a cell — the "+N" on the last one. */
  overflow: number;
}

/** `total` split into `parts` integers that sum to exactly `total`. */
function split(total: number, parts: number): number[] {
  const base = Math.floor(total / parts);
  const remainder = total - base * parts;
  return Array.from({ length: parts }, (_, i) => base + (i < remainder ? 1 : 0));
}

/**
 * Cells per row for `count` tiles.
 *
 * One row up to 2, two rows up to 6, three beyond — and within that the EXTRA
 * tiles go to the LAST rows, which is what puts the single big cell on top of a
 * three (`[1, 2]`), keeps four square (`[2, 2]`) and never draws more than four
 * in a row.
 *
 *   2 → [2]        5 → [2, 3]      8 → [2, 3, 3]
 *   3 → [1, 2]     6 → [3, 3]      9 → [3, 3, 3]
 *   4 → [2, 2]     7 → [2, 2, 3]  10 → [3, 3, 4]
 */
export function albumRows(count: number): number[] {
  if (count <= 1) return count === 1 ? [1] : [];
  const rows = count <= 2 ? 1 : count <= 6 ? 2 : 3;
  const base = Math.floor(count / rows);
  const remainder = count - base * rows;
  // The extra tiles go to the LAST rows, which is what puts the single big cell
  // on TOP of a three instead of under it.
  return Array.from({ length: rows }, (_, i) => base + (i >= rows - remainder ? 1 : 0));
}

/**
 * Frame height as a fraction of its width, per row count.
 *
 * One row is half its width, so two cells are square. Two rows sit at 3:4, which
 * makes a pair of half-width cells landscape and the full-width cell of a three a
 * banner. Three rows at 0.94 bring the ~third-width cells back to square.
 */
const FRAME_RATIO: Record<number, number> = { 1: 0.5, 2: 0.75, 3: 0.94 };

/**
 * The packed album grid, as absolute rectangles.
 *
 * Rows and columns are split with integer arithmetic that sums to the frame
 * EXACTLY, so no cell ends a pixel short of the outer edge — a half-pixel seam on
 * the outside of a rounded group reads as a rendering fault, not as a gap.
 */
export function albumLayout(
  count: number,
  width: number,
  options: { gap?: number; radius?: number; maxTiles?: number } = {},
): AlbumLayout {
  const gap = options.gap ?? ALBUM_GAP;
  const radius = options.radius ?? 16;
  const maxTiles = Math.max(1, options.maxTiles ?? MAX_ALBUM_TILES);
  const visible = Math.min(Math.max(0, count), maxTiles);
  const overflow = Math.max(0, count - visible);
  const rows = albumRows(visible);
  if (rows.length === 0) return { cells: [], width, height: 0, rows, overflow };

  const height = Math.round(width * (FRAME_RATIO[rows.length] ?? 1));
  const rowHeights = split(height - gap * (rows.length - 1), rows.length);

  const cells: AlbumCellRect[] = [];
  let index = 0;
  let top = 0;
  rows.forEach((columns, row) => {
    const rowHeight = rowHeights[row] ?? 0;
    const widths = split(width - gap * (columns - 1), columns);
    let left = 0;
    for (let column = 0; column < columns; column++) {
      const cellWidth = widths[column] ?? 0;
      cells.push({
        index,
        left,
        top,
        width: cellWidth,
        height: rowHeight,
        radii: {
          topLeft: row === 0 && column === 0 ? radius : 0,
          topRight: row === 0 && column === columns - 1 ? radius : 0,
          bottomLeft: row === rows.length - 1 && column === 0 ? radius : 0,
          bottomRight: row === rows.length - 1 && column === columns - 1 ? radius : 0,
        },
      });
      left += cellWidth + gap;
      index += 1;
    }
    top += rowHeight + gap;
  });

  return { cells, width, height, rows, overflow };
}

/**
 * A photo scaled into `maxWidth` × `maxHeight` keeping `aspectRatio`
 * (width / height). Both dimensions are integers so an image never lands on a
 * half pixel inside a rounded frame.
 */
export function fitMedia(
  aspectRatio: number,
  maxWidth: number,
  maxHeight: number,
): { width: number; height: number } {
  const ratio = Number.isFinite(aspectRatio) && aspectRatio > 0 ? aspectRatio : 1;
  let width = maxWidth;
  let height = Math.round(width / ratio);
  if (height > maxHeight) {
    height = maxHeight;
    width = Math.round(height * ratio);
  }
  return { width: Math.max(1, Math.round(width)), height: Math.max(1, height) };
}

// ---------------------------------------------------------------------------
//  Waveform
// ---------------------------------------------------------------------------

/** The floor a bar is drawn at, as a fraction of the track height. */
export const WAVEFORM_MIN_BAR = 0.18;

/**
 * `samples` resampled to exactly `count` bars, each clamped to 0..1.
 *
 * Down-sampling takes the MAXIMUM of each bucket rather than the mean: a voice
 * note is mostly silence with peaks in it, and averaging flattens the peaks into
 * the same grey slab for every recording. Up-sampling repeats the nearest
 * sample, which is honest about there being no more information.
 */
export function resampleWaveform(samples: readonly number[], count: number): number[] {
  const bars = Math.max(1, Math.floor(count));
  if (samples.length === 0) return Array.from({ length: bars }, () => 0);
  const clamp01 = (v: number) => (Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0);
  if (samples.length === bars) return samples.map(clamp01);
  if (samples.length < bars) {
    return Array.from({ length: bars }, (_, i) =>
      clamp01(samples[Math.floor((i * samples.length) / bars)] ?? 0),
    );
  }
  return Array.from({ length: bars }, (_, i) => {
    const start = Math.floor((i * samples.length) / bars);
    const end = Math.max(start + 1, Math.floor(((i + 1) * samples.length) / bars));
    let peak = 0;
    for (let s = start; s < end; s++) peak = Math.max(peak, clamp01(samples[s] ?? 0));
    return peak;
  });
}

/**
 * The seconds a press at `x` (px from the track's left edge) seeks to.
 *
 * Clamped into 0..`duration` at BOTH ends: a press inside the component's hit
 * slop reports a negative `locationX`, and a drag past the right edge reports
 * more than the width, so an unclamped reading seeks past the end of the file.
 */
export function seekPositionAt(x: number, trackWidth: number, duration: number): number {
  if (!(trackWidth > 0) || !(duration > 0)) return 0;
  const fraction = Math.min(1, Math.max(0, x / trackWidth));
  return fraction * duration;
}

/** How many of `barCount` bars are played at `position` of `duration`. */
export function playedBarCount(position: number, duration: number, barCount: number): number {
  if (!(duration > 0) || !(barCount > 0)) return 0;
  const fraction = Math.min(1, Math.max(0, position / duration));
  return Math.round(fraction * barCount);
}

/** 1 → 1.5 → 2 → 1. */
export function nextPlaybackRate(rate: VoicePlaybackRate): VoicePlaybackRate {
  return rate === 1 ? 1.5 : rate === 1.5 ? 2 : 1;
}

/** `"1×"`, `"1.5×"`, `"2×"` — the multiplication sign, not the letter x. */
export function formatPlaybackRate(rate: VoicePlaybackRate): string {
  return `${rate}×`;
}

// ---------------------------------------------------------------------------
//  Poll
// ---------------------------------------------------------------------------

/**
 * Whole percentages for `votes` that sum to exactly 100 (largest remainder).
 *
 * Rounding each share on its own is what makes a poll read "51% / 51%": three
 * equal options round to 33/33/33 and lose a point, and two 1.5-point remainders
 * both round up. The largest-remainder method hands each leftover point to the
 * option with the biggest fractional part, so the column always adds up.
 *
 * An empty poll, or one with no votes at all, is all zeroes — NOT an even split.
 * "Nobody has voted" and "everyone agrees" are different facts.
 */
export function pollPercentages(votes: readonly number[], total?: number): number[] {
  const counts = votes.map((v) => (Number.isFinite(v) && v > 0 ? Math.floor(v) : 0));
  const sum = total !== undefined && total > 0 ? total : counts.reduce((a, b) => a + b, 0);
  if (sum <= 0) return counts.map(() => 0);
  const exact = counts.map((c) => (c * 100) / sum);
  const floors = exact.map((v) => Math.floor(v));
  // The target is 100 only when the options ACCOUNT for the total. An explicit
  // `total` larger than the votes cast (a poll showing a subset of its options,
  // or one with abstentions) must not be inflated back up to 100 — that would
  // report shares nobody voted for.
  const target = Math.round(exact.reduce((a, b) => a + b, 0));
  let left = target - floors.reduce((a, b) => a + b, 0);
  if (left <= 0) return floors;
  const order = exact
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);
  const out = [...floors];
  for (const entry of order) {
    if (left <= 0) break;
    out[entry.index] = (out[entry.index] ?? 0) + 1;
    left -= 1;
  }
  return out;
}

/** "No votes" / "1 vote" / "n votes". */
export function formatVoteCount(total: number): string {
  const n = Number.isFinite(total) && total > 0 ? Math.floor(total) : 0;
  if (n === 0) return 'No votes';
  return n === 1 ? '1 vote' : `${n} votes`;
}

// ---------------------------------------------------------------------------
//  Geometry
// ---------------------------------------------------------------------------

/** The block's default width inside a bubble. */
export const MESSAGE_MEDIA_WIDTH = 260;
/** The corner radius a block uses when the bubble does not say otherwise. */
export const MESSAGE_MEDIA_RADIUS = 16;
/** The round-note diameter. */
export const VIDEO_NOTE_SIZE = 180;
/** Diameter of the sending / downloading ring. */
export const PROGRESS_RING_SIZE = 44;

// ---------------------------------------------------------------------------
//  Web CSS
//
//  Cursors and focus rings have no inline-style spelling that reaches both
//  platforms, so they hang off `dataSet` attributes in ONE adopted sheet —
//  constructed, never a `<style>` element, so a `style-src 'self'` policy does
//  not silently drop the rules.
// ---------------------------------------------------------------------------

export const MESSAGE_MEDIA_STYLE_ID = 'bloom-message-media-web-css';

const PRESSABLE = '[data-bloom-message-media-pressable]';
const TRACK = '[data-bloom-message-media-track]';

export const MESSAGE_MEDIA_CSS = `
${PRESSABLE} {
  outline: none;
  cursor: pointer;
}
${PRESSABLE}[aria-disabled="true"] {
  cursor: default;
}
${PRESSABLE}:focus-visible {
  outline: 2px solid var(--bloom-message-media-ring, currentColor);
  outline-offset: 2px;
}
${TRACK}:focus-visible {
  outline: 2px solid var(--bloom-message-media-ring, currentColor);
  outline-offset: 4px;
  border-radius: 4px;
}
@media (prefers-reduced-motion: reduce) {
  ${PRESSABLE} {
    transition: none !important;
  }
}
`;
