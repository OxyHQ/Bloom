/**
 * @jest-environment jsdom
 *
 * The track list family, rendered through the REAL react-native-web so the
 * assertions read the emitted DOM: roles and state attributes, row geometry and
 * colours, column collapsing, selection, keyboard and reorder callbacks.
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import type { Theme } from '../theme/types';
import {
  EpisodeList,
  EpisodeRow,
  resolveVisibleColumns,
  SelectionBar,
  TrackList,
  TrackListEmpty,
  TrackRow,
  TrackRowSkeleton,
  type Episode,
  type Track,
} from '../track-list';
import {
  dragShift,
  formatEpisodeLength,
  nextSelection,
  reorderTarget,
  resolveTrackListPaint,
  rowGeometry,
} from '../track-list/shared';

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

function byTestId(id: string): HTMLElement {
  const el = document.querySelector(`[data-testid="${id}"]`);
  if (!(el instanceof HTMLElement)) throw new Error(`No element for testID "${id}"`);
  return el;
}

function normalise(color: string): string {
  const probe = document.createElement('div');
  probe.style.backgroundColor = color;
  return probe.style.backgroundColor;
}

function click(el: HTMLElement, init: MouseEventInit = {}) {
  act(() => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1, ...init }));
  });
}

function key(el: HTMLElement, k: string, init: KeyboardEventInit = {}) {
  act(() => {
    el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init }));
  });
}

const TRACKS: Track[] = [
  { id: 'a', title: 'Glass Harbour', artists: [{ id: 'x', name: 'Mira Vale' }], album: 'Low Tide', duration: 214, dateAdded: '2 days ago', plays: '1,204' },
  { id: 'b', title: 'Paper Moons', artists: [{ name: 'Mira Vale' }, { name: 'Oren Reed' }], album: 'Low Tide', duration: 187, explicit: true, liked: true },
  { id: 'c', title: 'Slow Orbit', artists: [{ name: 'Oren Reed' }], album: 'Low Tide', duration: 243 },
  { id: 'd', title: 'Lost Signal', artists: [{ name: 'Tessa Grove' }], album: 'Static', duration: 199, unavailable: true },
];

describe('resolveVisibleColumns', () => {
  it('collapses album and plays under 768, date under 1024, and to title + actions under 640', () => {
    expect(resolveVisibleColumns(undefined, 1280)).toEqual(['index', 'title', 'album', 'dateAdded', 'plays', 'duration', 'actions']);
    expect(resolveVisibleColumns(undefined, 1023)).toEqual(['index', 'title', 'album', 'plays', 'duration', 'actions']);
    expect(resolveVisibleColumns(undefined, 767)).toEqual(['index', 'title', 'duration', 'actions']);
    expect(resolveVisibleColumns(undefined, 639)).toEqual(['title', 'actions']);
    expect(resolveVisibleColumns(undefined, 390)).toEqual(['title', 'actions']);
  });

  it('never shows a column that was not offered, and keeps layout order', () => {
    expect(resolveVisibleColumns(['duration', 'title', 'index'], 1280)).toEqual(['index', 'title', 'duration']);
    expect(resolveVisibleColumns(['index', 'title'], 390)).toEqual(['title']);
  });
});

describe('selection logic', () => {
  const order = ['a', 'b', 'c', 'd', 'e'];

  it('replaces, toggles and ranges from the anchor, always in list order', () => {
    let state = nextSelection(order, { selected: [], anchor: null }, 'b', 'replace');
    expect(state).toEqual({ selected: ['b'], anchor: 'b' });
    state = nextSelection(order, state, 'd', 'range');
    expect(state).toEqual({ selected: ['b', 'c', 'd'], anchor: 'b' });
    // A second Shift-click redraws from the same anchor, in either direction.
    state = nextSelection(order, state, 'a', 'range');
    expect(state).toEqual({ selected: ['a', 'b'], anchor: 'b' });
    state = nextSelection(order, state, 'e', 'toggle');
    expect(state).toEqual({ selected: ['a', 'b', 'e'], anchor: 'e' });
    state = nextSelection(order, state, 'a', 'toggle');
    expect(state).toEqual({ selected: ['b', 'e'], anchor: 'a' });
  });

  it('starts a range at the clicked row when there is no anchor', () => {
    expect(nextSelection(order, { selected: [], anchor: null }, 'c', 'range')).toEqual({ selected: ['c'], anchor: 'c' });
    expect(nextSelection(order, { selected: [], anchor: 'gone' }, 'c', 'range').selected).toEqual(['c']);
  });
});

describe('reorder maths', () => {
  it('lands a dragged row by whole rows, clamped to the list', () => {
    expect(reorderTarget(1, 0, 56, 5)).toBe(1);
    expect(reorderTarget(1, 27, 56, 5)).toBe(1);
    expect(reorderTarget(1, 29, 56, 5)).toBe(2);
    expect(reorderTarget(1, 120, 56, 5)).toBe(3);
    expect(reorderTarget(1, -500, 56, 5)).toBe(0);
    expect(reorderTarget(1, 5000, 56, 5)).toBe(4);
  });

  it('parts the rows between the origin and the target', () => {
    // Dragging row 1 down to 3: rows 2 and 3 move up one row.
    expect([0, 1, 2, 3, 4].map((i) => dragShift(i, 1, 3, 56))).toEqual([0, 0, -56, -56, 0]);
    // Dragging row 3 up to 1: rows 1 and 2 move down.
    expect([0, 1, 2, 3, 4].map((i) => dragShift(i, 3, 1, 56))).toEqual([0, 56, 56, 0, 0]);
  });
});

describe('TrackList — structure and accessibility', () => {
  it('is a named, multiselectable grid with a header row and indexed rows', () => {
    mount(<TrackList tracks={TRACKS} width={1280} testID="tl" onPlay={() => {}} />);
    const grid = byTestId('tl');
    expect(grid.getAttribute('role')).toBe('grid');
    expect(grid.getAttribute('aria-label')).toBe('Tracks');
    expect(grid.getAttribute('aria-multiselectable')).toBe('true');
    expect(grid.getAttribute('aria-rowcount')).toBe('5');

    const header = byTestId('tl-header');
    expect(header.getAttribute('role')).toBe('row');
    const headers = [...header.querySelectorAll('[role="columnheader"]')];
    expect(headers.map((h) => h.textContent)).toEqual(['#', 'Title', 'Album', 'Date added', 'Plays', '']);
    expect(headers[5]?.getAttribute('aria-label')).toBe('Duration');

    const row = byTestId('tl-row-1');
    expect(row.getAttribute('role')).toBe('row');
    expect(row.getAttribute('aria-rowindex')).toBe('3');
    expect(row.getAttribute('aria-selected')).toBe('false');
    expect(row.getAttribute('aria-label')).toBe('Paper Moons, Mira Vale, Oren Reed');
    expect(row.querySelectorAll('[role="gridcell"]').length).toBe(6);
    expect(row.querySelector('[role="img"][aria-label="Explicit"]')).not.toBeNull();
    expect(row.textContent).toContain('3:07');
  });

  it('names an unavailable row as such', () => {
    mount(<TrackList tracks={TRACKS} width={1280} testID="tl" />);
    expect(byTestId('tl-row-3').getAttribute('aria-label')).toBe('Lost Signal, Tessa Grove, Unavailable');
  });

  it('collapses the header and cells by width', () => {
    mount(<TrackList tracks={TRACKS} width={900} testID="tl" />);
    expect([...byTestId('tl-header').querySelectorAll('[role="columnheader"]')].map((h) => h.textContent)).toEqual(['#', 'Title', 'Album', 'Plays', '']);
    mount(<TrackList tracks={TRACKS} width={700} testID="tl" />);
    expect([...byTestId('tl-header').querySelectorAll('[role="columnheader"]')].map((h) => h.textContent)).toEqual(['#', 'Title', '']);
    expect(byTestId('tl-row-0').textContent).not.toContain('Low Tide');

    // Narrow: no header, no index or duration, just the title cell.
    mount(<TrackList tracks={TRACKS} width={390} testID="tl" menuItems={() => [{ key: 'q', label: 'Add to queue', onPress: () => {} }]} />);
    expect(document.querySelector('[data-testid="tl-header"]')).toBeNull();
    const row = byTestId('tl-row-0');
    expect(row.textContent).not.toContain('3:34');
    expect(row.textContent).toContain('Glass Harbour');
    // The more button is always there on narrow.
    expect(byTestId('tl-row-0-more').getAttribute('aria-label')).toBe('More options for Glass Harbour');
    expect(byTestId('tl').getAttribute('aria-rowcount')).toBe('4');
  });

  it('draws disc group header rows, counted in the row indexes', () => {
    mount(
      <TrackList
        tracks={TRACKS}
        width={1280}
        groups={[{ key: 'd1', title: 'Disc 1', startIndex: 0 }, { key: 'd2', title: 'Disc 2', startIndex: 2 }]}
        testID="tl"
      />,
    );
    const grid = byTestId('tl');
    expect(grid.getAttribute('aria-rowcount')).toBe('7');
    const groupRows = [...grid.querySelectorAll('[role="row"]')].filter((r) => /^Disc/.test(r.textContent ?? ''));
    expect(groupRows.map((r) => [r.textContent, r.getAttribute('aria-rowindex')])).toEqual([['Disc 1', '2'], ['Disc 2', '5']]);
    expect(byTestId('tl-row-2').getAttribute('aria-rowindex')).toBe('6');
  });

  it('uses the row geometry: 56 comfortable, 40 compact, radius 6 / 4', () => {
    mount(<TrackList tracks={TRACKS} width={1280} testID="tl" />);
    expect(byTestId('tl-row-0').style.height).toBe('56px');
    expect(byTestId('tl-row-0').style.borderTopLeftRadius || byTestId('tl-row-0').style.borderRadius).toContain('6px');
    mount(<TrackList tracks={TRACKS} width={1280} density="compact" testID="tl" />);
    expect(byTestId('tl-row-0').style.height).toBe('40px');
    expect(rowGeometry('compact', false).radius).toBe(4);
    expect(rowGeometry('comfortable', true).cover).toBe(48);
  });
});

describe('TrackList — current row', () => {
  it('shows the bars and an accent title while playing', () => {
    mount(<TrackList tracks={TRACKS} width={1280} currentTrackId="b" isPlaying testID="tl" />);
    const row = byTestId('tl-row-1');
    expect(row.querySelector('[role="img"][aria-label="Now playing"]')).not.toBeNull();
    const paint = resolveTrackListPaint(theme);
    const title = [...row.querySelectorAll('div')].find((el) => el.textContent === 'Paper Moons' && el.children.length === 0);
    expect(title?.style.color).toBe(normalise(paint.accent));
    // Other rows draw their number.
    expect(byTestId('tl-row-0').querySelector('[aria-label="Now playing"]')).toBeNull();
    expect(byTestId('tl-row-0').textContent?.startsWith('1')).toBe(true);
  });

  it('shows an accent number while paused', () => {
    mount(<TrackList tracks={TRACKS} width={1280} currentTrackId="b" isPlaying={false} testID="tl" />);
    const row = byTestId('tl-row-1');
    expect(row.querySelector('[aria-label="Now playing"]')).toBeNull();
    const number = row.querySelector('[data-bloom-track-number]') as HTMLElement;
    expect(number.textContent).toBe('2');
    expect(number.style.color).toBe(normalise(resolveTrackListPaint(theme).accent));
  });

  it('uses the track number when given', () => {
    mount(<TrackList tracks={[{ ...TRACKS[0]!, number: 7 }]} width={1280} testID="tl" />);
    expect((byTestId('tl-row-0').querySelector('[data-bloom-track-number]') as HTMLElement).textContent).toBe('7');
  });
});

describe('TrackList — selection', () => {
  it('selects on click, ranges on Shift-click and toggles on Cmd/Ctrl-click (uncontrolled)', () => {
    const onSelectionChange = jest.fn();
    mount(<TrackList tracks={TRACKS} width={1280} onSelectionChange={onSelectionChange} testID="tl" />);
    click(byTestId('tl-row-0'));
    expect(onSelectionChange).toHaveBeenLastCalledWith(['a']);
    expect(byTestId('tl-row-0').getAttribute('aria-selected')).toBe('true');
    click(byTestId('tl-row-2'), { shiftKey: true });
    expect(onSelectionChange).toHaveBeenLastCalledWith(['a', 'b', 'c']);
    expect(['0', '1', '2', '3'].map((i) => byTestId(`tl-row-${i}`).getAttribute('aria-selected'))).toEqual(['true', 'true', 'true', 'false']);
    click(byTestId('tl-row-1'), { metaKey: true });
    expect(onSelectionChange).toHaveBeenLastCalledWith(['a', 'c']);
    click(byTestId('tl-row-3'), { ctrlKey: true });
    expect(onSelectionChange).toHaveBeenLastCalledWith(['a', 'c', 'd']);
    click(byTestId('tl-row-1'));
    expect(onSelectionChange).toHaveBeenLastCalledWith(['b']);
  });

  it('paints the selected background from the theme', () => {
    mount(<TrackList tracks={TRACKS} width={1280} selectedIds={['c']} testID="tl" />, 'dark');
    const paint = resolveTrackListPaint(theme);
    expect(byTestId('tl-row-2').style.backgroundColor).toBe(normalise(paint.rowSelected));
    expect(byTestId('tl-row-2').getAttribute('aria-selected')).toBe('true');
  });

  it('is controlled by selectedIds', () => {
    const onSelectionChange = jest.fn();
    mount(<TrackList tracks={TRACKS} width={1280} selectedIds={[]} onSelectionChange={onSelectionChange} testID="tl" />);
    click(byTestId('tl-row-0'));
    expect(onSelectionChange).toHaveBeenCalledWith(['a']);
    expect(byTestId('tl-row-0').getAttribute('aria-selected')).toBe('false');
  });

  it('plays on double-click, and never an unavailable row', () => {
    const onPlay = jest.fn();
    mount(<TrackList tracks={TRACKS} width={1280} onPlay={onPlay} testID="tl" />);
    click(byTestId('tl-row-2'), { detail: 2 });
    expect(onPlay).toHaveBeenCalledWith(TRACKS[2], 2);
    click(byTestId('tl-row-3'), { detail: 2 });
    expect(onPlay).toHaveBeenCalledTimes(1);
  });

  it('calls onPause for the current, playing row', () => {
    const onPlay = jest.fn();
    const onPause = jest.fn();
    mount(<TrackList tracks={TRACKS} width={1280} onPlay={onPlay} onPause={onPause} currentTrackId="a" isPlaying testID="tl" />);
    click(byTestId('tl-row-0'), { detail: 2 });
    expect(onPause).toHaveBeenCalledWith(TRACKS[0], 0);
    expect(onPlay).not.toHaveBeenCalled();
  });

  it('turns off with selectable={false}', () => {
    const onSelectionChange = jest.fn();
    mount(<TrackList tracks={TRACKS} width={1280} selectable={false} onSelectionChange={onSelectionChange} testID="tl" />);
    expect(byTestId('tl').hasAttribute('aria-multiselectable')).toBe(false);
    click(byTestId('tl-row-0'));
    expect(onSelectionChange).not.toHaveBeenCalled();
  });
});

describe('TrackList — keyboard', () => {
  it('is one Tab stop; arrows, Home and End move focus', () => {
    mount(<TrackList tracks={TRACKS} width={1280} testID="tl" />);
    expect(['0', '1', '2', '3'].map((i) => byTestId(`tl-row-${i}`).getAttribute('tabindex'))).toEqual(['0', '-1', '-1', '-1']);
    act(() => byTestId('tl-row-0').focus());
    key(byTestId('tl-row-0'), 'ArrowDown');
    expect(document.activeElement).toBe(byTestId('tl-row-1'));
    expect(byTestId('tl-row-1').getAttribute('tabindex')).toBe('0');
    expect(byTestId('tl-row-0').getAttribute('tabindex')).toBe('-1');
    key(byTestId('tl-row-1'), 'End');
    expect(document.activeElement).toBe(byTestId('tl-row-3'));
    key(byTestId('tl-row-3'), 'ArrowDown');
    expect(document.activeElement).toBe(byTestId('tl-row-3'));
    key(byTestId('tl-row-3'), 'Home');
    expect(document.activeElement).toBe(byTestId('tl-row-0'));
    key(byTestId('tl-row-0'), 'ArrowUp');
    expect(document.activeElement).toBe(byTestId('tl-row-0'));
  });

  it('Shift+Arrow extends the selection; Enter and Space play', () => {
    const onSelectionChange = jest.fn();
    const onPlay = jest.fn();
    mount(<TrackList tracks={TRACKS} width={1280} onSelectionChange={onSelectionChange} onPlay={onPlay} testID="tl" />);
    click(byTestId('tl-row-0'));
    key(byTestId('tl-row-0'), 'ArrowDown', { shiftKey: true });
    expect(onSelectionChange).toHaveBeenLastCalledWith(['a', 'b']);
    key(byTestId('tl-row-1'), 'ArrowDown', { shiftKey: true });
    expect(onSelectionChange).toHaveBeenLastCalledWith(['a', 'b', 'c']);
    key(byTestId('tl-row-2'), 'Enter');
    expect(onPlay).toHaveBeenLastCalledWith(TRACKS[2], 2);
    key(byTestId('tl-row-1'), ' ');
    expect(onPlay).toHaveBeenLastCalledWith(TRACKS[1], 1);
  });

  it('ignores keys pressed inside the row’s own controls', () => {
    const onPlay = jest.fn();
    mount(
      <TrackList
        tracks={TRACKS}
        width={390}
        onPlay={onPlay}
        menuItems={() => [{ key: 'q', label: 'Add to queue', onPress: () => {} }]}
        testID="tl"
      />,
    );
    key(byTestId('tl-row-0-more'), 'ArrowDown');
    expect(document.activeElement).not.toBe(byTestId('tl-row-1'));
  });
});

describe('TrackList — reorder', () => {
  it('Alt+Arrow moves the focused row and keeps focus on it', () => {
    const onReorder = jest.fn();
    function Harness() {
      const [tracks, setTracks] = React.useState(TRACKS);
      return (
        <TrackList
          tracks={tracks}
          width={1280}
          reorderable
          onReorder={(from, to) => {
            onReorder(from, to);
            setTracks((list) => {
              const next = [...list];
              const [moved] = next.splice(from, 1);
              next.splice(to, 0, moved!);
              return next;
            });
          }}
          testID="tl"
        />
      );
    }
    mount(<Harness />);
    act(() => byTestId('tl-row-0').focus());
    key(byTestId('tl-row-0'), 'ArrowDown', { altKey: true });
    expect(onReorder).toHaveBeenLastCalledWith(0, 1);
    expect(byTestId('tl-row-1').getAttribute('aria-label')).toContain('Glass Harbour');
    expect(document.activeElement).toBe(byTestId('tl-row-1'));
    // At the top, Alt+Up does nothing.
    key(byTestId('tl-row-0'), 'ArrowUp', { altKey: true });
    expect(onReorder).toHaveBeenCalledTimes(1);
    key(byTestId('tl-row-1'), 'ArrowUp', { altKey: true });
    expect(onReorder).toHaveBeenLastCalledWith(1, 0);
  });

  it('reserves the drag handle gutter and hides the handle from assistive technology', () => {
    mount(<TrackList tracks={TRACKS} width={1280} reorderable onReorder={() => {}} testID="tl" />);
    const handle = byTestId('tl-row-0-handle');
    expect(handle.getAttribute('aria-hidden')).toBe('true');
    // Hidden until hover or focus.
    expect(handle.style.opacity).toBe('0');
  });

  it('adds Move up / Move down to the row menu and calls onReorder from them', () => {
    const onReorder = jest.fn();
    mount(<TrackList tracks={TRACKS} width={1280} reorderable onReorder={onReorder} testID="tl" />);
    const row = byTestId('tl-row-1');
    act(() => row.focus());
    key(row, 'F10', { shiftKey: true });
    const more = byTestId('tl-row-1-more');
    expect(more.getAttribute('aria-expanded')).toBe('true');
    const items = [...document.querySelectorAll('[role="menuitem"]')] as HTMLElement[];
    expect(items.map((i) => i.textContent)).toEqual(['Move up', 'Move down']);
    click(items[1]!);
    expect(onReorder).toHaveBeenCalledWith(1, 2);
  });

  it('disables Move up on the first row', () => {
    mount(<TrackList tracks={TRACKS} width={1280} reorderable onReorder={() => {}} testID="tl" />);
    const row = byTestId('tl-row-0');
    act(() => row.focus());
    key(row, 'ContextMenu');
    const up = [...document.querySelectorAll('[role="menuitem"]')].find((i) => i.textContent === 'Move up');
    expect(up?.getAttribute('aria-disabled')).toBe('true');
  });
});

describe('TrackRow — controls', () => {
  it('shows the like button for liked tracks, as a toggle', () => {
    const onLikedChange = jest.fn();
    mount(<TrackList tracks={TRACKS} width={1280} onLikedChange={onLikedChange} testID="tl" />);
    // Not liked, not hovered: no button mounted.
    expect(document.querySelector('[data-testid="tl-row-0-like"]')).toBeNull();
    const like = byTestId('tl-row-1-like');
    expect(like.getAttribute('aria-pressed')).toBe('true');
    click(like);
    expect(onLikedChange).toHaveBeenCalledWith(TRACKS[1], false);
    // The like press does not select the row.
    expect(byTestId('tl-row-1').getAttribute('aria-selected')).toBe('false');
  });

  it('makes artists and the album links when handlers are given', () => {
    const onArtistPress = jest.fn();
    const onAlbumPress = jest.fn();
    mount(<TrackList tracks={TRACKS} width={1280} onArtistPress={onArtistPress} onAlbumPress={onAlbumPress} testID="tl" />);
    const links = [...byTestId('tl-row-1').querySelectorAll('[role="link"]')] as HTMLElement[];
    expect(links.map((l) => l.getAttribute('aria-label'))).toEqual(['Mira Vale', 'Oren Reed', 'Low Tide']);
    click(links[1]!);
    expect(onArtistPress).toHaveBeenCalledWith({ name: 'Oren Reed' }, TRACKS[1]);
    click(links[2]!);
    expect(onAlbumPress).toHaveBeenCalledWith(TRACKS[1]);
    expect(byTestId('tl-row-1').getAttribute('aria-selected')).toBe('false');
  });

  it('draws the downloaded mark only with showDownloaded', () => {
    const track: Track = { ...TRACKS[0]!, downloaded: true };
    mount(<TrackRow track={track} index={0} width={1280} testID="r" />);
    expect(byTestId('r').querySelector('[aria-label="Downloaded"]')).toBeNull();
    mount(<TrackRow track={track} index={0} width={1280} showDownloaded testID="r" />);
    expect(byTestId('r').querySelector('[role="img"][aria-label="Downloaded"]')).not.toBeNull();
  });

  it('works standalone, and takes translated labels', () => {
    mount(
      <TrackRow
        track={TRACKS[3]!}
        index={3}
        width={1280}
        labels={{ unavailable: 'No disponible' }}
        testID="r"
      />,
    );
    expect(byTestId('r').getAttribute('aria-label')).toBe('Lost Signal, Tessa Grove, No disponible');
  });
});

describe('TrackRowSkeleton and TrackListEmpty', () => {
  it('draws count rows at the row height, hidden from assistive technology', () => {
    mount(<TrackRowSkeleton count={3} width={1280} testID="s" />);
    const el = byTestId('s');
    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(el.children.length).toBe(3);
    expect((el.children[0] as HTMLElement).style.height).toBe('56px');
  });

  it('draws the title, description and action', () => {
    const onAction = jest.fn();
    mount(<TrackListEmpty title="Nothing here yet" description="Find songs to add." actionLabel="Find songs" onAction={onAction} testID="e" />);
    const el = byTestId('e');
    expect(el.querySelector('[role="heading"]')?.textContent).toBe('Nothing here yet');
    expect(el.textContent).toContain('Find songs to add.');
    const button = [...el.querySelectorAll('button, [role="button"]')].find((b) => b.textContent === 'Find songs') as HTMLElement;
    act(() => button.click());
    expect(onAction).toHaveBeenCalled();
  });
});

describe('SelectionBar', () => {
  it('renders nothing at zero', () => {
    mount(<SelectionBar count={0} actions={[]} onClear={() => {}} testID="b" />);
    expect(document.querySelector('[data-testid="b"]')).toBeNull();
  });

  it('is a toolbar named by the count, with actions and a clear button', () => {
    const onClear = jest.fn();
    const onQueue = jest.fn();
    mount(
      <SelectionBar
        count={3}
        width={1280}
        actions={[{ key: 'queue', label: 'Add to queue', onPress: onQueue }]}
        onClear={onClear}
        testID="b"
      />,
    );
    const bar = byTestId('b');
    expect(bar.getAttribute('role')).toBe('toolbar');
    expect(bar.getAttribute('aria-label')).toBe('3 selected');
    expect(bar.querySelector('[aria-live="polite"]')?.textContent).toBe('3 selected');
    act(() => byTestId('b-queue').click());
    expect(onQueue).toHaveBeenCalled();
    expect(byTestId('b-clear').getAttribute('aria-label')).toBe('Clear selection');
    act(() => byTestId('b-clear').click());
    expect(onClear).toHaveBeenCalled();
    expect(bar.style.borderTopLeftRadius || bar.style.borderRadius).toContain('16px');
  });
});

describe('EpisodeRow and EpisodeList', () => {
  const EPISODE: Episode = {
    id: 'e1',
    title: 'Why cities hum at night',
    show: 'Field Notes',
    description: 'A walk through the low sounds of a sleeping city.',
    date: '12 Mar',
    duration: 45 * 60,
    progress: 33 * 60,
    saved: false,
  };

  it('formats lengths in minutes and hours', () => {
    expect(formatEpisodeLength(45 * 60)).toBe('45 min');
    expect(formatEpisodeLength(60 * 60)).toBe('1 hr');
    expect(formatEpisodeLength(72 * 60)).toBe('1 hr 12 min');
    expect(formatEpisodeLength(20)).toBe('1 min');
  });

  it('draws the progress bar with its value and time left', () => {
    mount(<EpisodeRow episode={EPISODE} width={900} testID="ep" onPlay={() => {}} />);
    const bar = byTestId('ep').querySelector('[role="progressbar"]') as HTMLElement;
    expect(bar.getAttribute('aria-label')).toBe('Listened');
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
    expect(bar.getAttribute('aria-valuemax')).toBe('2700');
    expect(bar.getAttribute('aria-valuenow')).toBe('1980');
    expect(bar.getAttribute('aria-valuetext')).toBe('12 min left');
    expect(byTestId('ep-play').getAttribute('aria-label')).toBe('Play Why cities hum at night');
    expect(byTestId('ep').textContent).toContain('12 Mar · 45 min');
  });

  it('shows Played instead of the length, and no progress bar', () => {
    mount(<EpisodeRow episode={{ ...EPISODE, played: true }} width={900} testID="ep" />);
    expect(byTestId('ep').querySelector('[role="progressbar"]')).toBeNull();
    expect(byTestId('ep').textContent).toContain('Played');
  });

  it('save and download are toggles', () => {
    const onSavedChange = jest.fn();
    const onDownloadedChange = jest.fn();
    mount(
      <EpisodeRow
        episode={{ ...EPISODE, downloaded: true }}
        width={900}
        onSavedChange={onSavedChange}
        onDownloadedChange={onDownloadedChange}
        testID="ep"
      />,
    );
    expect(byTestId('ep-save').getAttribute('aria-pressed')).toBe('false');
    expect(byTestId('ep-download').getAttribute('aria-pressed')).toBe('true');
    click(byTestId('ep-save'));
    expect(onSavedChange).toHaveBeenCalledWith(expect.objectContaining({ id: 'e1' }), true);
    click(byTestId('ep-download'));
    expect(onDownloadedChange).toHaveBeenCalledWith(expect.objectContaining({ id: 'e1' }), false);
  });

  it('drops the description when narrow, and the title is a link that opens it', () => {
    const onPress = jest.fn();
    mount(<EpisodeRow episode={EPISODE} width={390} onPress={onPress} testID="ep" />);
    expect(byTestId('ep').textContent).not.toContain('A walk through');
    const link = byTestId('ep').querySelector('[role="link"]') as HTMLElement;
    expect(link.getAttribute('aria-label')).toBe('Why cities hum at night');
    click(link);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('lists episodes and marks the current one', () => {
    mount(
      <EpisodeList
        episodes={[EPISODE, { ...EPISODE, id: 'e2', title: 'Second' }]}
        currentEpisodeId="e2"
        isPlaying
        onPlay={() => {}}
        width={900}
        testID="el"
      />,
    );
    const list = byTestId('el');
    expect(list.getAttribute('role')).toBe('list');
    expect(list.querySelectorAll('[role="listitem"]').length).toBe(2);
    expect(byTestId('el-row-1-play').getAttribute('aria-label')).toBe('Pause Second');
  });
});
