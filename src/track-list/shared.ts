import { Platform, type ViewProps } from 'react-native';

import { mixColor, resolveButtonRamps } from '../button/shared';
import { resolveMenuPalette } from '../floating/menu-palette';
import { BREAKPOINTS } from '../styles/breakpoints';
import type { Theme } from '../theme/types';
import type {
  TrackListColumn,
  TrackListDensity,
  TrackListLabels,
} from './types';

export const IS_WEB = Platform.OS === 'web';

/**
 * `role="gridcell"`, typed for React Native's `role` union, which has `cell`
 * (a TABLE's cell) but not a grid's. A row of a `grid` may only own
 * `gridcell`/`columnheader`/`rowheader`, and react-native-web passes the role
 * through verbatim. Native ignores it.
 */
export const ROLE_GRIDCELL = 'gridcell' as ViewProps['role'];

export const ALL_COLUMNS: readonly TrackListColumn[] = [
  'index',
  'title',
  'album',
  'dateAdded',
  'plays',
  'duration',
  'actions',
];

/** Below this the table becomes a list: cover, title/artists and the more button. */
export const NARROW_WIDTH = BREAKPOINTS.sm;
/** `album` and `plays` need at least this. */
export const ALBUM_MIN_WIDTH = BREAKPOINTS.md;
/** `dateAdded` needs at least this. */
export const DATE_MIN_WIDTH = BREAKPOINTS.lg;

export function isNarrow(width: number): boolean {
  return width < NARROW_WIDTH;
}

/**
 * The columns that fit `width`, in layout order.
 *
 *   < 640    title, actions (the narrow list layout)
 *   < 768    album and plays hidden
 *   < 1024   date added hidden
 */
export function resolveVisibleColumns(
  columns: readonly TrackListColumn[] = ALL_COLUMNS,
  width: number,
): TrackListColumn[] {
  const offered = new Set(columns);
  return ALL_COLUMNS.filter((column) => {
    if (!offered.has(column)) return false;
    if (isNarrow(width)) return column === 'title' || column === 'actions';
    if ((column === 'album' || column === 'plays') && width < ALBUM_MIN_WIDTH) return false;
    if (column === 'dateAdded' && width < DATE_MIN_WIDTH) return false;
    return true;
  });
}

/** Row geometry by density and layout. */
export interface RowGeometry {
  height: number;
  radius: number;
  paddingX: number;
  gap: number;
  cover: number;
  coverRadius: number;
}

export function rowGeometry(density: TrackListDensity, narrow: boolean): RowGeometry {
  if (narrow) {
    return density === 'compact'
      ? { height: 48, radius: 4, paddingX: 8, gap: 12, cover: 40, coverRadius: 4 }
      : { height: 64, radius: 6, paddingX: 8, gap: 12, cover: 48, coverRadius: 4 };
  }
  return density === 'compact'
    ? { height: 40, radius: 4, paddingX: 12, gap: 12, cover: 28, coverRadius: 3 }
    : { height: 56, radius: 6, paddingX: 16, gap: 16, cover: 40, coverRadius: 4 };
}

/** Fixed cell widths; `title`, `album` and `dateAdded` share the rest 4 : 3 : 2. */
export const CELL = {
  handle: 16,
  index: 32,
  plays: 112,
  duration: 48,
  button: 32,
  flex: { title: 4, album: 3, dateAdded: 2 },
} as const;

/** Every colour the family paints, from the theme only. */
export interface TrackListPaint {
  text: string;
  textMuted: string;
  accent: string;
  rowHover: string;
  rowSelected: string;
  rowSelectedHover: string;
  hairline: string;
  coverPlaceholder: string;
  ring: string;
  dragSurface: string;
  dragShadow: string;
  rail: string;
  panel: string;
  panelBorder: string;
  panelShadow: string;
}

export function resolveTrackListPaint(theme: Theme): TrackListPaint {
  const { accent, neutral: n } = resolveButtonRamps(theme);
  const dark = theme.isDark;
  const menu = resolveMenuPalette(theme);
  return {
    text: theme.colors.text,
    textMuted: dark ? n[400] : n[500],
    accent: dark ? accent[400] : accent[600],
    rowHover: dark ? n[800] : n[100],
    rowSelected: dark ? n[700] : n[200],
    rowSelectedHover: dark ? mixColor(n[700], n[600], 0.5) : mixColor(n[200], n[300], 0.5),
    hairline: dark ? n[800] : n[200],
    coverPlaceholder: dark ? n[800] : n[100],
    ring: accent[500],
    dragSurface: menu.surface,
    dragShadow: dark
      ? '0 8px 24px rgba(0, 0, 0, 0.45), 0 1px 2px rgba(0, 0, 0, 0.3)'
      : '0 8px 24px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.06)',
    rail: dark ? n[700] : n[200],
    panel: menu.surface,
    panelBorder: menu.border,
    panelShadow: dark
      ? '0 12px 32px rgba(0, 0, 0, 0.5), 0 1px 2px rgba(0, 0, 0, 0.3)'
      : '0 12px 32px rgba(0, 0, 0, 0.14), 0 1px 2px rgba(0, 0, 0, 0.06)',
  };
}

export const DEFAULT_LABELS: Required<TrackListLabels> = {
  index: '#',
  title: 'Title',
  album: 'Album',
  dateAdded: 'Date added',
  plays: 'Plays',
  duration: 'Duration',
  moreOptions: 'More options',
  moveUp: 'Move up',
  moveDown: 'Move down',
  reorder: 'Reorder',
  downloaded: 'Downloaded',
  unavailable: 'Unavailable',
};

// ---------------------------------------------------------------------------
//  Selection
// ---------------------------------------------------------------------------

export type SelectionMode = 'replace' | 'toggle' | 'range';

export interface SelectionState {
  selected: string[];
  /** Where the next Shift-click range starts. */
  anchor: string | null;
}

/**
 * The selection after a click on `id`.
 *
 *   replace   just `id` (a plain click); the anchor moves to it
 *   toggle    `id` added or removed (Cmd/Ctrl-click); the anchor moves to it
 *   range     every id from the anchor to `id` inclusive, in list order
 *             (Shift-click); the anchor stays, so a second Shift-click
 *             re-draws the range from the same start
 *
 * The result is always in list order, whatever order the clicks came in.
 */
export function nextSelection(
  order: readonly string[],
  state: SelectionState,
  id: string,
  mode: SelectionMode,
): SelectionState {
  const inOrder = (ids: Set<string>) => order.filter((key) => ids.has(key));
  if (mode === 'replace') return { selected: [id], anchor: id };
  if (mode === 'toggle') {
    const next = new Set(state.selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return { selected: inOrder(next), anchor: id };
  }
  const anchor = state.anchor !== null && order.includes(state.anchor) ? state.anchor : id;
  const a = order.indexOf(anchor);
  const b = order.indexOf(id);
  if (b === -1) return state;
  const [from, to] = a <= b ? [a, b] : [b, a];
  return { selected: order.slice(from, to + 1), anchor };
}

/** The index a dragged row lands on after moving `dy` px through rows `rowHeight` tall. */
export function reorderTarget(from: number, dy: number, rowHeight: number, count: number): number {
  if (count <= 0 || rowHeight <= 0) return from;
  const target = from + Math.round(dy / rowHeight);
  return Math.min(count - 1, Math.max(0, target));
}

/**
 * How far row `index` shifts while row `from` is dragged over `to`: the rows
 * between close the gap the dragged row left and open one where it will land.
 */
export function dragShift(index: number, from: number, to: number, rowHeight: number): number {
  if (index === from) return 0;
  if (from < to && index > from && index <= to) return -rowHeight;
  if (to < from && index >= to && index < from) return rowHeight;
  return 0;
}

// ---------------------------------------------------------------------------
//  Web CSS — hover/focus reveals and focus rings have no inline spelling, so
//  they hang off `dataSet` attributes in one adopted sheet.
// ---------------------------------------------------------------------------

export const TRACK_LIST_STYLE_ID = 'bloom-track-list-web-css';

const ROW = '[data-bloom-track-row]';

export const TRACK_LIST_CSS = `
${ROW} {
  outline: none;
  cursor: default;
  user-select: none;
  -webkit-user-select: none;
}
${ROW}:focus-visible {
  box-shadow: inset 0 0 0 2px var(--bloom-track-ring);
}
${ROW}:focus-within [data-bloom-track-reveal],
${ROW}:focus-visible [data-bloom-track-play] {
  opacity: 1 !important;
}
${ROW}:focus-visible [data-bloom-track-number] {
  opacity: 0 !important;
}
[data-bloom-track-focusable] {
  outline: none;
  cursor: pointer;
}
[data-bloom-track-focusable]:focus-visible {
  outline: 2px solid var(--bloom-track-ring, currentColor);
  outline-offset: 2px;
}
[data-bloom-track-link] {
  cursor: pointer;
}
[data-bloom-track-link]:hover {
  color: var(--bloom-track-link-hover) !important;
}
[data-bloom-track-handle] {
  cursor: grab;
  touch-action: none;
}
[data-bloom-track-dragging="true"],
[data-bloom-track-dragging="true"] [data-bloom-track-handle] {
  cursor: grabbing;
}
[data-bloom-track-shift] {
  transition: transform 150ms ease-out;
}
@media (prefers-reduced-motion: reduce) {
  [data-bloom-track-shift] {
    transition: none;
  }
}
`;

// ---------------------------------------------------------------------------
//  Episode times
// ---------------------------------------------------------------------------

/** "45 min", "1 hr", "1 hr 12 min". Under a minute rounds up to "1 min". */
export function formatEpisodeLength(seconds: number): string {
  const total = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
  const minutes = Math.max(total > 0 ? 1 : 0, Math.round(total / 60));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

/** "12 min left". */
export function formatEpisodeRemaining(seconds: number): string {
  return `${formatEpisodeLength(seconds)} left`;
}
