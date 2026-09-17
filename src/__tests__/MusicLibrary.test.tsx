/**
 * @jest-environment jsdom
 *
 * The music library and search family: the filter / sort logic as pure
 * functions, then the components rendered through the REAL react-native-web so
 * the assertions read the emitted DOM — names, roles, state attributes and the
 * callbacks each control reports.
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import type { Theme } from '../theme/types';
import {
  BrowseGrid,
  LibraryItem,
  LibraryPanel,
  RecentSearches,
  SearchField,
  SearchResultTabs,
  TopResultCard,
  filterLibraryItems,
  sortLibraryItems,
  type LibraryEntry,
} from '../music-library';
import {
  TILE_DARK_TEXT,
  TILE_LIGHT_TEXT,
  browseTilePaint,
  contrastRatio,
  gridColumns,
  libraryMeta,
  resolveMusicLibraryPaint,
} from '../music-library/shared';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;
let theme: Theme;

function ReadTheme() {
  theme = useTheme();
  return null;
}

function mount(ui: React.ReactElement, mode: 'light' | 'dark' = 'light') {
  act(() => {
    root.render(
      <BloomThemeProvider mode={mode} colorPreset="teal">
        <ReadTheme />
        {ui}
      </BloomThemeProvider>,
    );
  });
}

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function query(id: string): HTMLElement | null {
  const el = container.querySelector(`[data-testid="${id}"]`);
  return el instanceof HTMLElement ? el : null;
}

function byTestId(id: string): HTMLElement {
  const el = query(id);
  if (!el) throw new Error(`No element for testID "${id}"`);
  return el;
}

function press(id: string) {
  act(() => byTestId(id).click());
}

function normalise(color: string): string {
  const probe = document.createElement('div');
  probe.style.backgroundColor = color;
  return probe.style.backgroundColor;
}

/** The ids of the rendered library rows, in DOM order. */
function rowIds(prefix = 'lib'): string[] {
  return Array.from(container.querySelectorAll('[data-testid]'))
    .map((el) => el.getAttribute('data-testid') ?? '')
    .filter((id) => id.startsWith(`${prefix}-item-`) && !id.endsWith('-cover'))
    .map((id) => id.slice(`${prefix}-item-`.length));
}

// ---------------------------------------------------------------------------
//  Data
// ---------------------------------------------------------------------------

const ITEMS: LibraryEntry[] = [
  { id: 'a', title: 'Night Drive', kind: 'playlist', subtitle: 'Maya', addedAt: 10, lastPlayedAt: 500 },
  { id: 'b', title: 'Lumen Vale', kind: 'artist', addedAt: 40, lastPlayedAt: 300, downloaded: true },
  { id: 'c', title: 'Écho Park', kind: 'album', subtitle: 'Zed Orchard', addedAt: 30 },
  { id: 'd', title: 'alpine hours', kind: 'podcast', subtitle: 'Ines Marlow', addedAt: 20, lastPlayedAt: 900, downloaded: true },
  { id: 'e', title: 'Workouts', kind: 'folder', meta: 'Folder · 4 playlists', addedAt: 5, lastPlayedAt: 100, pinned: true },
  { id: 'f', title: 'The Long Winter Road', kind: 'audiobook', subtitle: 'Oona Beckett', creator: 'Beckett, Oona', addedAt: 50 },
];

// ---------------------------------------------------------------------------
//  Pure logic
// ---------------------------------------------------------------------------

describe('filterLibraryItems', () => {
  it('keeps everything, in input order, with no filter', () => {
    expect(filterLibraryItems(ITEMS, {}).map((i) => i.id)).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
  });

  it('filters by kind, counting folders as playlists', () => {
    expect(filterLibraryItems(ITEMS, { filter: 'playlists' }).map((i) => i.id)).toEqual(['a', 'e']);
    expect(filterLibraryItems(ITEMS, { filter: 'artists' }).map((i) => i.id)).toEqual(['b']);
    expect(filterLibraryItems(ITEMS, { filter: 'audiobooks' }).map((i) => i.id)).toEqual(['f']);
  });

  it('combines the kind filter and Downloaded with AND', () => {
    expect(filterLibraryItems(ITEMS, { downloadedOnly: true }).map((i) => i.id)).toEqual(['b', 'd']);
    expect(filterLibraryItems(ITEMS, { filter: 'podcasts', downloadedOnly: true }).map((i) => i.id)).toEqual(['d']);
    expect(filterLibraryItems(ITEMS, { filter: 'albums', downloadedOnly: true })).toEqual([]);
  });

  it('matches the query in title, subtitle, meta or creator, ignoring case and accents', () => {
    expect(filterLibraryItems(ITEMS, { query: 'echo' }).map((i) => i.id)).toEqual(['c']);
    expect(filterLibraryItems(ITEMS, { query: 'MAYA' }).map((i) => i.id)).toEqual(['a']);
    expect(filterLibraryItems(ITEMS, { query: '4 playlists' }).map((i) => i.id)).toEqual(['e']);
    expect(filterLibraryItems(ITEMS, { query: 'beckett, oona' }).map((i) => i.id)).toEqual(['f']);
    expect(filterLibraryItems(ITEMS, { query: '   ' })).toHaveLength(ITEMS.length);
    expect(filterLibraryItems(ITEMS, { query: 'nothing like this' })).toEqual([]);
  });
});

describe('sortLibraryItems', () => {
  it('puts pinned first under every sort', () => {
    for (const sort of ['recents', 'recently-added', 'alphabetical', 'creator'] as const) {
      expect(sortLibraryItems(ITEMS, sort)[0]?.id).toBe('e');
    }
  });

  it('recents: last played first, never played last in input order', () => {
    expect(sortLibraryItems(ITEMS, 'recents').map((i) => i.id)).toEqual(['e', 'd', 'a', 'b', 'c', 'f']);
  });

  it('recently added: newest addedAt first', () => {
    expect(sortLibraryItems(ITEMS, 'recently-added').map((i) => i.id)).toEqual(['e', 'f', 'b', 'c', 'd', 'a']);
  });

  it('alphabetical: case- and accent-insensitive', () => {
    expect(sortLibraryItems(ITEMS, 'alphabetical').map((i) => i.title)).toEqual([
      'Workouts',
      'alpine hours',
      'Écho Park',
      'Lumen Vale',
      'Night Drive',
      'The Long Winter Road',
    ]);
  });

  it('creator: by creator, else subtitle, then title', () => {
    // '' (b) < 'Beckett, Oona' (f) < 'Ines Marlow' (d) < 'Maya' (a) < 'Zed Orchard' (c)
    expect(sortLibraryItems(ITEMS, 'creator').map((i) => i.id)).toEqual(['e', 'b', 'f', 'd', 'a', 'c']);
  });

  it('is stable and never mutates its input', () => {
    const same: LibraryEntry[] = [
      { id: 'x', title: 'Same', kind: 'album' },
      { id: 'y', title: 'Same', kind: 'album' },
      { id: 'z', title: 'Same', kind: 'album' },
    ];
    const before = same.map((i) => i.id);
    expect(sortLibraryItems(same, 'alphabetical').map((i) => i.id)).toEqual(['x', 'y', 'z']);
    expect(sortLibraryItems(same, 'recents').map((i) => i.id)).toEqual(['x', 'y', 'z']);
    expect(same.map((i) => i.id)).toEqual(before);
  });
});

describe('helpers', () => {
  it('composes the meta line, or takes the entry’s own', () => {
    expect(libraryMeta(ITEMS[0]!)).toBe('Playlist · Maya');
    expect(libraryMeta(ITEMS[1]!)).toBe('Artist');
    expect(libraryMeta(ITEMS[4]!)).toBe('Folder · 4 playlists');
    expect(libraryMeta(ITEMS[0]!, { ...libraryKind(), playlist: 'Lista' })).toBe('Lista · Maya');
  });

  it('fits grid columns to the width', () => {
    expect(gridColumns(0, 128, 12)).toBe(1);
    expect(gridColumns(100, 128, 12)).toBe(1);
    expect(gridColumns(268, 128, 12)).toBe(2);
    expect(gridColumns(267, 128, 12)).toBe(1);
    expect(gridColumns(1168, 160, 16)).toBe(6);
  });

  it('gives every browse tile a title that clears 4.5:1', () => {
    const fallback = { background: '#eeeeee', text: '#111111' };
    for (const color of ['#1f6f5c', '#b8d65a', '#f4c8d8', '#777777', '#767676', '#f2d15c', '#000000', '#ffffff', 'rgb(29, 43, 83)']) {
      const paint = browseTilePaint(color, fallback);
      expect([TILE_LIGHT_TEXT, TILE_DARK_TEXT]).toContain(paint.text);
      expect(contrastRatio(paint.background, paint.text)).toBeGreaterThanOrEqual(4.5);
    }
    expect(browseTilePaint('#1d2b53', fallback).text).toBe(TILE_LIGHT_TEXT);
    expect(browseTilePaint('#f2d15c', fallback).text).toBe(TILE_DARK_TEXT);
    expect(browseTilePaint('#b8d65a', fallback).background).toBe('#b8d65a');
    // A mid-grey clears neither white nor near-black, so the FILL darkens.
    const grey = browseTilePaint('#777777', fallback);
    expect(grey.background).not.toBe('#777777');
    expect(grey.text).toBe(TILE_LIGHT_TEXT);
    expect(browseTilePaint('not-a-colour', fallback)).toBe(fallback);
  });
});

function libraryKind() {
  return { playlist: 'Playlist', artist: 'Artist', album: 'Album', podcast: 'Podcast', audiobook: 'Audiobook', folder: 'Folder' };
}

// ---------------------------------------------------------------------------
//  LibraryItem
// ---------------------------------------------------------------------------

describe('LibraryItem', () => {
  it('is a button named by the whole row, flags included', () => {
    mount(<LibraryItem item={{ ...ITEMS[0]!, pinned: true, downloaded: true }} nowPlaying testID="row" />);
    const row = byTestId('row');
    expect(row.getAttribute('role')).toBe('button');
    expect(row.getAttribute('aria-label')).toBe('Night Drive, Playlist · Maya, Pinned, Downloaded, Now playing');
    expect(container.querySelector('[role="img"][aria-label="Now playing"]')).not.toBeNull();
  });

  it('marks the open page aria-current and fills it', () => {
    mount(<LibraryItem item={ITEMS[1]!} selected testID="row" />);
    const row = byTestId('row');
    expect(row.getAttribute('aria-current')).toBe('page');
    expect(row.style.backgroundColor).toBe(normalise(resolveMusicLibraryPaint(theme).selected));
    mount(<LibraryItem item={ITEMS[1]!} testID="row" />);
    expect(byTestId('row').hasAttribute('aria-current')).toBe(false);
  });

  it('draws a 48 cover, round for artists, and reports the entry on press', () => {
    const onPress = jest.fn();
    mount(<LibraryItem item={ITEMS[1]!} onPress={onPress} testID="row" />);
    const cover = byTestId('row-cover');
    expect(cover.style.width).toBe('48px');
    expect(cover.style.borderTopLeftRadius || cover.style.borderRadius).toBe('24px');
    press('row');
    expect(onPress).toHaveBeenCalledWith(ITEMS[1]);
    mount(<LibraryItem item={ITEMS[0]!} testID="row" />);
    expect(byTestId('row-cover').style.borderTopLeftRadius || byTestId('row-cover').style.borderRadius).toBe('4px');
  });

  it('turns the playing title accent', () => {
    mount(<LibraryItem item={ITEMS[0]!} nowPlaying testID="row" />);
    const title = Array.from(byTestId('row').querySelectorAll('div')).find((el) => el.textContent === 'Night Drive' && el.children.length === 0);
    expect(title?.style.color).toBe(normalise(resolveMusicLibraryPaint(theme).accent));
  });
});

// ---------------------------------------------------------------------------
//  LibraryPanel
// ---------------------------------------------------------------------------

describe('LibraryPanel', () => {
  it('is a named region listing entries sorted by recents with pinned first', () => {
    mount(<LibraryPanel items={ITEMS} testID="lib" />);
    const region = byTestId('lib');
    expect(region.getAttribute('role')).toBe('region');
    expect(region.getAttribute('aria-label')).toBe('Your Library');
    expect(rowIds()).toEqual(['e', 'd', 'a', 'b', 'c', 'f']);
  });

  it('filters by chip (uncontrolled), shows a clear chip, and clears', () => {
    const onFilterChange = jest.fn();
    mount(<LibraryPanel items={ITEMS} onFilterChange={onFilterChange} testID="lib" />);
    expect(query('lib-filter-clear')).toBeNull();
    const chip = byTestId('lib-filter-artists');
    expect(chip.getAttribute('aria-pressed')).toBe('false');

    press('lib-filter-artists');
    expect(onFilterChange).toHaveBeenLastCalledWith('artists');
    expect(byTestId('lib-filter-artists').getAttribute('aria-pressed')).toBe('true');
    expect(rowIds()).toEqual(['b']);
    expect(byTestId('lib-filter-clear').getAttribute('aria-label')).toBe('Clear filters');

    press('lib-filter-downloaded');
    expect(rowIds()).toEqual(['b']);
    press('lib-filter-artists'); // pressing the active chip turns it off
    expect(rowIds()).toEqual(['d', 'b']);

    press('lib-filter-clear');
    expect(rowIds()).toHaveLength(ITEMS.length);
    expect(query('lib-filter-clear')).toBeNull();
    expect(byTestId('lib-filter-downloaded').getAttribute('aria-pressed')).toBe('false');
  });

  it('reports but does not change a controlled filter and sort', () => {
    const onFilterChange = jest.fn();
    mount(<LibraryPanel items={ITEMS} filter="playlists" onFilterChange={onFilterChange} sort="alphabetical" testID="lib" />);
    expect(rowIds()).toEqual(['e', 'a']);
    press('lib-filter-albums');
    expect(onFilterChange).toHaveBeenCalledWith('albums');
    expect(rowIds()).toEqual(['e', 'a']);
  });

  it('opens the in-library search and filters by the query', () => {
    const onQueryChange = jest.fn();
    mount(<LibraryPanel items={ITEMS} onQueryChange={onQueryChange} testID="lib" />);
    expect(byTestId('lib-search').getAttribute('aria-label')).toBe('Search in Your Library');
    press('lib-search');
    const input = byTestId('lib-search-input') as HTMLInputElement;
    expect(input.getAttribute('aria-label')).toBe('Search in Your Library');
    mount(<LibraryPanel items={ITEMS} query="lumen" testID="lib" />);
    expect(rowIds()).toEqual(['b']);
    expect(byTestId('lib-search-clear').getAttribute('aria-label')).toBe('Clear search');
  });

  it('names the sort and view trigger with the current choices', () => {
    mount(<LibraryPanel items={ITEMS} sort="creator" view="grid" testID="lib" />);
    const trigger = byTestId('lib-sort');
    expect(trigger.getAttribute('aria-label')).toBe('Sort and view: Creator, Grid');
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('draws the header controls only when their callbacks are given', () => {
    mount(<LibraryPanel items={ITEMS} testID="lib" />);
    expect(query('lib-create')).toBeNull();
    expect(query('lib-expand')).toBeNull();
    expect(query('lib-rail-toggle')).toBeNull();

    const onExpandedChange = jest.fn();
    const onCollapsedChange = jest.fn();
    const onCreatePress = jest.fn();
    mount(
      <LibraryPanel
        items={ITEMS}
        onCreatePress={onCreatePress}
        onExpandedChange={onExpandedChange}
        onCollapsedChange={onCollapsedChange}
        testID="lib"
      />,
    );
    expect(byTestId('lib-create').getAttribute('aria-label')).toBe('Create playlist or folder');
    expect(byTestId('lib-expand').getAttribute('aria-label')).toBe('Show more');
    press('lib-expand');
    expect(onExpandedChange).toHaveBeenCalledWith(true);
    press('lib-rail-toggle');
    expect(onCollapsedChange).toHaveBeenCalledWith(true);
    press('lib-create');
    expect(onCreatePress).toHaveBeenCalled();
  });

  it('collapses to a 72 rail of named covers', () => {
    const onCollapsedChange = jest.fn();
    mount(<LibraryPanel items={ITEMS} collapsed onCollapsedChange={onCollapsedChange} nowPlayingId="a" testID="lib" />);
    expect(byTestId('lib').style.width).toBe('72px');
    expect(query('lib-filter-artists')).toBeNull();
    expect(rowIds()).toEqual(['e', 'd', 'a', 'b', 'c', 'f']);
    expect(byTestId('lib-item-a').getAttribute('aria-label')).toBe('Night Drive, Playlist · Maya, Now playing');
    expect(byTestId('lib-rail-toggle').getAttribute('aria-label')).toBe('Open Your Library');
    press('lib-rail-toggle');
    expect(onCollapsedChange).toHaveBeenCalledWith(false);
  });

  it('shows the empty line when nothing matches, and translates labels', () => {
    mount(
      <LibraryPanel
        items={ITEMS}
        query="zzz"
        labels={{ title: 'Tu biblioteca', empty: 'Nada aquí', filter: { artists: 'Artistas' } }}
        testID="lib"
      />,
    );
    expect(byTestId('lib').getAttribute('aria-label')).toBe('Tu biblioteca');
    expect(container.textContent).toContain('Nada aquí');
    expect(byTestId('lib-filter-artists').textContent).toBe('Artistas');
    expect(byTestId('lib-filter-albums').textContent).toBe('Albums');
  });
});

// ---------------------------------------------------------------------------
//  Search
// ---------------------------------------------------------------------------

describe('SearchField', () => {
  it('is a named searchbox, 48 tall and a full pill', () => {
    mount(<SearchField value="" onChangeText={() => {}} testID="s" />);
    expect(byTestId('s').style.height).toBe('48px');
    const input = byTestId('s-input');
    expect(input.getAttribute('aria-label')).toBe('Search');
    expect(input.getAttribute('placeholder')).toBe('What do you want to play?');
    expect(query('s-clear')).toBeNull();
    expect(query('s-browse')).toBeNull();
  });

  it('shows clear only with text, and reports it', () => {
    const onClear = jest.fn();
    mount(<SearchField value="lumen" onChangeText={() => {}} onClear={onClear} testID="s" />);
    expect(byTestId('s-clear').getAttribute('aria-label')).toBe('Clear search');
    press('s-clear');
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('draws browse as a toggle with aria-pressed', () => {
    const onBrowsePress = jest.fn();
    mount(<SearchField value="" onChangeText={() => {}} onBrowsePress={onBrowsePress} testID="s" />);
    expect(byTestId('s-browse').getAttribute('aria-label')).toBe('Browse');
    expect(byTestId('s-browse').getAttribute('aria-pressed')).toBe('false');
    press('s-browse');
    expect(onBrowsePress).toHaveBeenCalled();
    mount(<SearchField value="" onChangeText={() => {}} onBrowsePress={onBrowsePress} browseActive testID="s" />);
    expect(byTestId('s-browse').getAttribute('aria-pressed')).toBe('true');
  });
});

describe('SearchResultTabs', () => {
  const TABS = [
    { value: 'all', label: 'All' },
    { value: 'songs', label: 'Songs' },
    { value: 'artists', label: 'Artists' },
  ];

  it('is a named tablist of tabs with aria-selected and one tab stop', () => {
    mount(<SearchResultTabs tabs={TABS} value="songs" onValueChange={() => {}} testID="t" />);
    const list = byTestId('t');
    expect(list.getAttribute('role')).toBe('tablist');
    expect(list.getAttribute('aria-label')).toBe('Result types');
    expect(byTestId('t-songs').getAttribute('role')).toBe('tab');
    expect(byTestId('t-songs').getAttribute('aria-selected')).toBe('true');
    expect(byTestId('t-all').getAttribute('aria-selected')).toBe('false');
    expect(byTestId('t-songs').getAttribute('tabindex')).toBe('0');
    expect(byTestId('t-all').getAttribute('tabindex')).toBe('-1');
  });

  it('reports a press and moves focus with the arrow keys', () => {
    const onValueChange = jest.fn();
    mount(<SearchResultTabs tabs={TABS} value="all" onValueChange={onValueChange} testID="t" />);
    press('t-artists');
    expect(onValueChange).toHaveBeenCalledWith('artists');
    act(() => byTestId('t-all').focus());
    act(() => {
      byTestId('t-all').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    });
    expect(document.activeElement).toBe(byTestId('t-songs'));
    act(() => {
      byTestId('t-songs').dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    });
    expect(document.activeElement).toBe(byTestId('t-artists'));
  });
});

describe('TopResultCard', () => {
  it('names the card and its separate play button', () => {
    const onPlayPress = jest.fn();
    mount(<TopResultCard title="Lumen Vale" kind="artist" subtitle="4.2M monthly listeners" onPlayPress={onPlayPress} testID="top" />);
    expect(byTestId('top-card').getAttribute('aria-label')).toBe('Lumen Vale, Artist, 4.2M monthly listeners');
    expect(byTestId('top-play').getAttribute('aria-label')).toBe('Play Lumen Vale');
    expect(byTestId('top-card').contains(byTestId('top-play'))).toBe(false);
    press('top-play');
    expect(onPlayPress).toHaveBeenCalled();
    expect(byTestId('top-card').style.borderTopLeftRadius || byTestId('top-card').style.borderRadius).toBe('16px');
  });

  it('has no play button without onPlayPress, and takes a translated kind', () => {
    mount(<TopResultCard title="Paper Moons" kind="album" kindLabel="Álbum" testID="top" />);
    expect(query('top-play')).toBeNull();
    expect(byTestId('top-card').getAttribute('aria-label')).toBe('Paper Moons, Álbum');
  });
});

describe('RecentSearches', () => {
  const RECENTS = [
    { id: 'r1', title: 'Lumen Vale', meta: 'Artist', round: true },
    { id: 'r2', title: 'Paper Moons', meta: 'Album · Lumen Vale' },
  ];

  it('lists entries with separate open and remove buttons, and clears all', () => {
    const onRemove = jest.fn();
    const onItemPress = jest.fn();
    const onClearAll = jest.fn();
    mount(<RecentSearches items={RECENTS} onRemove={onRemove} onItemPress={onItemPress} onClearAll={onClearAll} testID="rs" />);
    expect(container.querySelectorAll('[role="listitem"]')).toHaveLength(2);
    expect(byTestId('rs-r2-open').getAttribute('aria-label')).toBe('Paper Moons, Album · Lumen Vale');
    expect(byTestId('rs-r2-remove').getAttribute('aria-label')).toBe('Remove Paper Moons');
    press('rs-r2-remove');
    expect(onRemove).toHaveBeenCalledWith(RECENTS[1]);
    expect(onItemPress).not.toHaveBeenCalled();
    press('rs-r1-open');
    expect(onItemPress).toHaveBeenCalledWith(RECENTS[0]);
    expect(byTestId('rs-clear-all').textContent).toBe('Clear recent searches');
    press('rs-clear-all');
    expect(onClearAll).toHaveBeenCalled();
  });

  it('hides clear-all with no entries', () => {
    mount(<RecentSearches items={[]} onClearAll={() => {}} testID="rs" />);
    expect(query('rs-clear-all')).toBeNull();
  });
});

describe('BrowseGrid', () => {
  it('draws colour tiles as named buttons with a contrast-safe title', () => {
    const onItemPress = jest.fn();
    const tiles = [
      { id: 'jazz', title: 'Jazz', color: '#f2d15c' },
      { id: 'sleep', title: 'Sleep', color: '#1d2b53' },
    ];
    mount(<BrowseGrid title="Browse all" items={tiles} onItemPress={onItemPress} testID="bg" />);
    const jazz = byTestId('bg-jazz');
    expect(jazz.getAttribute('role')).toBe('button');
    expect(jazz.getAttribute('aria-label')).toBe('Jazz');
    expect(jazz.style.backgroundColor).toBe(normalise('#f2d15c'));
    expect((jazz.firstElementChild as HTMLElement).style.color).toBe(normalise(TILE_DARK_TEXT));
    expect((byTestId('bg-sleep').firstElementChild as HTMLElement).style.color).toBe(normalise(TILE_LIGHT_TEXT));
    press('bg-sleep');
    expect(onItemPress).toHaveBeenCalledWith(tiles[1]);
    expect(container.querySelector('[role="heading"]')?.textContent).toBe('Browse all');
  });

  it('wraps each child in a cell', () => {
    mount(
      <BrowseGrid testID="bg">
        <span>one</span>
        <span>two</span>
        <span>three</span>
      </BrowseGrid>,
    );
    expect(byTestId('bg-grid').children).toHaveLength(3);
  });
});
