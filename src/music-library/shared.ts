import { useCallback, useState } from 'react';
import { Platform } from 'react-native';

import { mixColor, resolveButtonRamps } from '../button/shared';
import { parseRgb } from '../theme/color-utils';
import type { Theme } from '../theme/types';
import type {
  LibraryEntry,
  LibraryFilter,
  LibraryItemKind,
  LibraryKindLabels,
  LibraryPanelLabels,
  LibrarySort,
} from './types';

export const IS_WEB = Platform.OS === 'web';

// ---------------------------------------------------------------------------
//  Pure logic
// ---------------------------------------------------------------------------

/** Which filter chip an entry answers to. Folders hold playlists. */
export const LIBRARY_FILTER_OF_KIND: Record<LibraryItemKind, LibraryFilter> = {
  playlist: 'playlists',
  folder: 'playlists',
  artist: 'artists',
  album: 'albums',
  podcast: 'podcasts',
  audiobook: 'audiobooks',
};

export const LIBRARY_FILTERS: readonly LibraryFilter[] = [
  'playlists',
  'artists',
  'albums',
  'podcasts',
  'audiobooks',
];

export const DEFAULT_KIND_LABELS: LibraryKindLabels = {
  playlist: 'Playlist',
  artist: 'Artist',
  album: 'Album',
  podcast: 'Podcast',
  audiobook: 'Audiobook',
  folder: 'Folder',
};

export const DEFAULT_LIBRARY_LABELS: LibraryPanelLabels = {
  title: 'Your Library',
  create: 'Create playlist or folder',
  expand: 'Show more',
  collapse: 'Show less',
  collapseRail: 'Collapse Your Library',
  expandRail: 'Open Your Library',
  filters: 'Filters',
  clearFilters: 'Clear filters',
  filter: {
    playlists: 'Playlists',
    artists: 'Artists',
    albums: 'Albums',
    podcasts: 'Podcasts',
    audiobooks: 'Audiobooks',
  },
  downloaded: 'Downloaded',
  search: 'Search in Your Library',
  searchPlaceholder: 'Search in Your Library',
  clearSearch: 'Clear search',
  sortAndView: 'Sort and view',
  sortBy: 'Sort by',
  viewAs: 'View as',
  sort: {
    recents: 'Recents',
    'recently-added': 'Recently added',
    alphabetical: 'Alphabetical',
    creator: 'Creator',
  },
  view: { compact: 'Compact', list: 'List', grid: 'Grid' },
  empty: 'Nothing here yet',
  kind: DEFAULT_KIND_LABELS,
};

/** "Playlist · Maya", or the entry's own `meta`. */
export function libraryMeta(item: LibraryEntry, kindLabels: LibraryKindLabels = DEFAULT_KIND_LABELS): string {
  if (item.meta !== undefined) return item.meta;
  return [kindLabels[item.kind], item.subtitle].filter(Boolean).join(' · ');
}

function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLocaleLowerCase();
}

export interface LibraryFilterState {
  filter?: LibraryFilter | null;
  downloadedOnly?: boolean;
  query?: string;
}

/**
 * The entries a filter state keeps, in their input order. The kind filter and
 * Downloaded combine (AND); the query matches title, subtitle, meta or creator,
 * ignoring case and accents. Pure.
 */
export function filterLibraryItems(
  items: readonly LibraryEntry[],
  { filter = null, downloadedOnly = false, query = '' }: LibraryFilterState,
): LibraryEntry[] {
  const needle = fold(query.trim());
  return items.filter((item) => {
    if (filter && LIBRARY_FILTER_OF_KIND[item.kind] !== filter) return false;
    if (downloadedOnly && !item.downloaded) return false;
    if (!needle) return true;
    return [item.title, item.subtitle, item.meta, item.creator].some(
      (field) => field !== undefined && fold(field).includes(needle),
    );
  });
}

const collator =
  typeof Intl !== 'undefined' ? new Intl.Collator(undefined, { sensitivity: 'base', numeric: true }) : null;

function compareText(a: string, b: string): number {
  return collator ? collator.compare(a, b) : a.localeCompare(b);
}

/** Newest first; a missing timestamp sorts after every present one. */
function compareNewest(a: number | undefined, b: number | undefined): number {
  if (a === undefined && b === undefined) return 0;
  if (a === undefined) return 1;
  if (b === undefined) return -1;
  return b - a;
}

/**
 * The entries in display order: pinned first (keeping the sort among
 * themselves), then the rest by `sort`. Stable — ties keep their input order.
 * Pure; never mutates `items`.
 */
export function sortLibraryItems(items: readonly LibraryEntry[], sort: LibrarySort): LibraryEntry[] {
  const compare = (a: LibraryEntry, b: LibraryEntry): number => {
    switch (sort) {
      case 'recents':
        return compareNewest(a.lastPlayedAt, b.lastPlayedAt);
      case 'recently-added':
        return compareNewest(a.addedAt, b.addedAt);
      case 'alphabetical':
        return compareText(a.title, b.title);
      case 'creator':
        return (
          compareText(a.creator ?? a.subtitle ?? '', b.creator ?? b.subtitle ?? '') ||
          compareText(a.title, b.title)
        );
    }
  };
  return items
    .map((item, index) => ({ item, index }))
    .sort((x, y) => {
      const pinned = Number(Boolean(y.item.pinned)) - Number(Boolean(x.item.pinned));
      return pinned || compare(x.item, y.item) || x.index - y.index;
    })
    .map(({ item }) => item);
}

/** Columns that fit `width` at `minTile` wide with `gap` between. At least one. */
export function gridColumns(width: number, minTile: number, gap: number): number {
  if (!(width > 0) || !(minTile > 0)) return 1;
  return Math.max(1, Math.floor((width + gap) / (minTile + gap)));
}

function channel(v: number): number {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

/** WCAG relative luminance, or `null` for an unparseable colour. */
export function relativeLuminance(color: string): number | null {
  const rgb = parseRgb(color);
  if (!rgb) return null;
  return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  if (la === null || lb === null) return 1;
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

export const TILE_LIGHT_TEXT = '#ffffff';
export const TILE_DARK_TEXT = '#141414';

/**
 * A browse tile's fill and title colour, always at least 4.5:1.
 *
 * White when it clears 4.5:1 on the colour; otherwise near-black when THAT
 * does. A mid-grey clears neither (`#777777` is 4.48 against white), so the
 * fill is then darkened in 5% steps toward black until white clears — the
 * backend colour moves a little rather than the title failing. An unparseable
 * colour falls back to the neutral `fallback` pair.
 */
export function browseTilePaint(
  color: string,
  fallback: { background: string; text: string },
): { background: string; text: string } {
  if (relativeLuminance(color) === null) return fallback;
  if (contrastRatio(color, TILE_LIGHT_TEXT) >= 4.5) return { background: color, text: TILE_LIGHT_TEXT };
  if (contrastRatio(color, TILE_DARK_TEXT) >= 4.5) return { background: color, text: TILE_DARK_TEXT };
  for (let alpha = 0.05; alpha <= 1; alpha += 0.05) {
    const darker = mixColor(color, '#000000', alpha);
    if (contrastRatio(darker, TILE_LIGHT_TEXT) >= 4.5) return { background: darker, text: TILE_LIGHT_TEXT };
  }
  return { background: '#000000', text: TILE_LIGHT_TEXT };
}

// ---------------------------------------------------------------------------
//  Controlled-or-uncontrolled state
// ---------------------------------------------------------------------------

export function useControllable<T>(
  value: T | undefined,
  initial: T,
  onChange: ((next: T) => void) | undefined,
): [T, (next: T) => void] {
  const [inner, setInner] = useState<T>(initial);
  const controlled = value !== undefined;
  const set = useCallback(
    (next: T) => {
      if (!controlled) setInner(next);
      onChange?.(next);
    },
    [controlled, onChange],
  );
  return [controlled ? (value as T) : inner, set];
}

// ---------------------------------------------------------------------------
//  Paint
// ---------------------------------------------------------------------------

export interface MusicLibraryPaint {
  accent: string;
  text: string;
  textMuted: string;
  /** Panel and card surface. */
  surface: string;
  /** A row or card under the pointer, on `surface`. */
  hover: string;
  /** The open page's row, on `surface`. */
  selected: string;
  /** Behind a missing cover. */
  placeholder: string;
  /** The search pill's fill and its hover. */
  field: string;
  fieldHover: string;
  /** The search pill's focus border. */
  fieldFocusBorder: string;
  divider: string;
  ring: string;
}

/**
 * Surfaces are the page background moved toward the text colour, so a panel,
 * a hovered row and the search pill each read as a step off WHATEVER page they
 * sit on, in light and dark, without a fixed ramp stop that happens to match
 * one page colour. Text and accents come from the neutral and accent ramps.
 */
export function resolveMusicLibraryPaint(theme: Theme): MusicLibraryPaint {
  const { accent, neutral: n } = resolveButtonRamps(theme);
  const dark = theme.isDark;
  const { background, text } = theme.colors;
  const step = (light: number, darkAlpha: number) => mixColor(background, text, dark ? darkAlpha : light);
  return {
    accent: accent[500],
    text,
    textMuted: dark ? n[400] : n[500],
    surface: step(0.03, 0.05),
    hover: step(0.07, 0.1),
    selected: step(0.11, 0.16),
    placeholder: step(0.11, 0.16),
    field: step(0.06, 0.09),
    fieldHover: step(0.1, 0.14),
    fieldFocusBorder: text,
    divider: dark ? n[600] : n[300],
    ring: accent[500],
  };
}

// ---------------------------------------------------------------------------
//  Web CSS
// ---------------------------------------------------------------------------

export const MUSIC_LIBRARY_STYLE_ID = 'bloom-music-library-web-css';

const FOCUSABLE = '[data-bloom-music-focusable]';

export const MUSIC_LIBRARY_CSS = `
${FOCUSABLE} {
  outline: none;
  cursor: pointer;
  user-select: none;
}
${FOCUSABLE}:focus-visible {
  outline: 2px solid var(--bloom-music-ring, currentColor);
  outline-offset: 2px;
}
[data-bloom-music-scroll-x] {
  scrollbar-width: none;
}
[data-bloom-music-scroll-x]::-webkit-scrollbar {
  display: none;
}
[data-bloom-music-input] {
  outline: none;
}
[data-bloom-search-field] {
  cursor: text;
}
[data-bloom-music-input]::-webkit-search-cancel-button {
  display: none;
}
[data-bloom-top-result] [data-bloom-top-result-play] {
  opacity: 0;
  transition: opacity 150ms ease-out;
}
[data-bloom-top-result]:hover [data-bloom-top-result-play],
[data-bloom-top-result]:focus-within [data-bloom-top-result-play],
[data-bloom-top-result] [data-bloom-top-result-play][data-playing="true"] {
  opacity: 1;
}
@media (hover: none) {
  [data-bloom-top-result] [data-bloom-top-result-play] {
    opacity: 1;
  }
}
@media (prefers-reduced-motion: reduce) {
  [data-bloom-top-result] [data-bloom-top-result-play] {
    transition: none;
  }
}
`;

