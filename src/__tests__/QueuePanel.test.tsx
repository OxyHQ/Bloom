/**
 * @jest-environment jsdom
 *
 * The queue panel, rendered through the REAL react-native-web so the assertions
 * read the emitted DOM: section structure, names, the reorder arithmetic, the
 * keyboard move on a handle, the announcement, and the theme paint.
 *
 * The pointer drag itself (PanResponder) and the row menu's surface are
 * verified in a real browser; jest sees the arithmetic both of them commit
 * through (`queueDragTarget`) and the keyboard path that shares their callback.
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import type { Theme } from '../theme/types';
import {
  DEFAULT_QUEUE_PANEL_LABELS,
  QUEUE_ROW_HEIGHT,
  QueuePanel,
  RecentlyPlayedList,
  moveQueueItem,
  queueDragShift,
  queueDragTarget,
  type QueuePanelProps,
  type QueueTrack,
} from '../queue-panel';
import { resolveQueuePanelPaint } from '../queue-panel/shared';

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
  const el = container.querySelector(`[data-testid="${id}"]`);
  if (!(el instanceof HTMLElement)) throw new Error(`No element for testID "${id}"`);
  return el;
}

function query(id: string): HTMLElement | null {
  return container.querySelector(`[data-testid="${id}"]`);
}

function normalise(color: string): string {
  const probe = document.createElement('div');
  probe.style.color = color;
  return probe.style.color;
}

function press(el: HTMLElement) {
  act(() => {
    el.click();
  });
}

function key(el: HTMLElement, k: string) {
  act(() => {
    el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
  });
}

const t = (id: string, title: string, extra: Partial<QueueTrack> = {}): QueueTrack => ({
  id,
  title,
  artists: 'Ilse Marn',
  ...extra,
});

const NOW = t('now', 'Harbour Lights');
const QUEUE = [t('q1', 'Slow Tide'), t('q2', 'Paper Moons'), t('q3', 'Signal Fires')];
const CONTEXT = [t('c1', 'Neon Rain'), t('c2', 'Overpass')];

function panel(props: Partial<QueuePanelProps> = {}) {
  return (
    <QueuePanel
      testID="qp"
      nowPlaying={NOW}
      queue={QUEUE}
      context={CONTEXT}
      contextName="Night Drive"
      {...props}
    />
  );
}

// `moveQueueItem` / `queueDragTarget` / `queueDragShift` are re-exports of
// `moveItem` / `dragTarget` / `dragShift` from `@oxy.so/bloom/hooks`, kept as
// the queue panel's published names. These pin the published behaviour.
describe('moveQueueItem', () => {
  it('moves down, up, and to both ends, returning a new array', () => {
    const list = ['a', 'b', 'c', 'd'];
    expect(moveQueueItem(list, 0, 2)).toEqual(['b', 'c', 'a', 'd']);
    expect(moveQueueItem(list, 3, 1)).toEqual(['a', 'd', 'b', 'c']);
    expect(moveQueueItem(list, 1, 0)).toEqual(['b', 'a', 'c', 'd']);
    expect(moveQueueItem(list, 1, 3)).toEqual(['a', 'c', 'd', 'b']);
    expect(moveQueueItem(list, 0, 0)).not.toBe(list);
    expect(list).toEqual(['a', 'b', 'c', 'd']);
  });

  it('clamps the target and ignores an out-of-range source', () => {
    expect(moveQueueItem(['a', 'b', 'c'], 0, 99)).toEqual(['b', 'c', 'a']);
    expect(moveQueueItem(['a', 'b', 'c'], 2, -5)).toEqual(['c', 'a', 'b']);
    expect(moveQueueItem(['a', 'b'], 5, 0)).toEqual(['a', 'b']);
    expect(moveQueueItem(['a', 'b'], -1, 0)).toEqual(['a', 'b']);
    expect(moveQueueItem([], 0, 1)).toEqual([]);
  });
});

describe('queueDragTarget', () => {
  const H = QUEUE_ROW_HEIGHT;

  it('lands on the nearest whole row: past half a row moves one slot', () => {
    expect(queueDragTarget(1, 0, H, 5)).toBe(1);
    expect(queueDragTarget(1, H / 2 - 1, H, 5)).toBe(1);
    expect(queueDragTarget(1, H / 2 + 1, H, 5)).toBe(2);
    expect(queueDragTarget(1, -(H / 2 + 1), H, 5)).toBe(0);
    expect(queueDragTarget(0, 2 * H, H, 5)).toBe(2);
  });

  it('clamps to the first and last slot, and survives degenerate input', () => {
    expect(queueDragTarget(0, -10 * H, H, 5)).toBe(0);
    expect(queueDragTarget(4, 10 * H, H, 5)).toBe(4);
    // Degenerate input answers "it has not moved" — `from`, not slot 0. The
    // two copies of this function disagreed here; sending a row to the top of
    // a list nobody has measured yet is the one that was wrong.
    expect(queueDragTarget(0, 100, H, 0)).toBe(0);
    expect(queueDragTarget(2, 100, 0, 5)).toBe(2);
  });
});

describe('queueDragShift', () => {
  const H = QUEUE_ROW_HEIGHT;

  it('slides the rows between source and target one row towards the source', () => {
    // 0 dragged to 2: rows 1 and 2 move up, 3 stays.
    expect([0, 1, 2, 3].map((i) => queueDragShift(i, 0, 2, H))).toEqual([0, -H, -H, 0]);
    // 3 dragged to 1: rows 1 and 2 move down, 0 stays.
    expect([0, 1, 2, 3].map((i) => queueDragShift(i, 3, 1, H))).toEqual([0, H, H, 0]);
    // Not moved yet: nothing shifts.
    expect([0, 1, 2].map((i) => queueDragShift(i, 1, 1, H))).toEqual([0, 0, 0]);
  });
});

describe('QueuePanel structure', () => {
  it('draws the three sections as headings, with lists of rows', () => {
    mount(panel());
    const headings = [...container.querySelectorAll('[role="heading"]')].map((h) => h.textContent);
    expect(headings).toEqual(['Now playing', 'Next in queue', 'Next from: Night Drive']);

    const queueList = byTestId('qp-queue');
    expect(queueList.getAttribute('role')).toBe('list');
    expect(queueList.querySelectorAll('[role="listitem"]')).toHaveLength(3);
    expect(byTestId('qp-context').querySelectorAll('[role="listitem"]')).toHaveLength(2);
  });

  it('names every control: play rows, handles, menus, remove, close', () => {
    mount(panel({ onReorder: jest.fn(), onRemove: jest.fn(), onClose: jest.fn(), onPlay: jest.fn() }));
    expect(byTestId('qp-now-play').getAttribute('aria-label')).toBe('Play Harbour Lights');
    expect(byTestId('qp-queue-row-0-play').getAttribute('role')).toBe('button');
    expect(byTestId('qp-queue-row-0-play').getAttribute('aria-label')).toBe('Play Slow Tide');
    const handle = byTestId('qp-queue-row-0-handle');
    expect(handle.getAttribute('role')).toBe('button');
    expect(handle.getAttribute('aria-label')).toBe('Reorder Slow Tide');
    expect(handle.getAttribute('tabindex')).toBe('0');
    expect(byTestId('qp-queue-row-0-more').getAttribute('aria-label')).toBe('More options for Slow Tide');
    expect(byTestId('qp-queue-row-0-remove').getAttribute('aria-label')).toBe('Remove from queue: Slow Tide');
    expect(byTestId('qp-close').getAttribute('aria-label')).toBe('Close queue');
  });

  it('hides what has no callback: no handle without onReorder, no remove without onRemove, no close or clear', () => {
    mount(panel());
    expect(query('qp-queue-row-0-handle')).toBeNull();
    expect(query('qp-queue-row-0-remove')).toBeNull();
    expect(query('qp-queue-row-0-more')).toBeNull();
    expect(query('qp-close')).toBeNull();
    expect(query('qp-clear')).toBeNull();
  });

  it('leaves remove to the menu in the sheet variant', () => {
    mount(panel({ variant: 'sheet', onRemove: jest.fn(), onReorder: jest.fn() }));
    expect(query('qp-queue-row-0-remove')).toBeNull();
    expect(query('qp-queue-row-0-more')).not.toBeNull();
  });

  it('draws the panel variant as a rounded-8 bordered surface of `width`', () => {
    mount(panel({ variant: 'panel', width: 380 }));
    const paint = resolveQueuePanelPaint(theme);
    const el = byTestId('qp');
    expect(el.style.width).toBe('380px');
    expect(el.style.borderTopLeftRadius || el.style.borderRadius).toContain('8px');
    expect(normalise(el.style.backgroundColor)).toBe(normalise(paint.surface));
  });

  it('shows the empty state when there is nothing at all', () => {
    mount(<QueuePanel testID="qp" />);
    expect(container.textContent).toContain(DEFAULT_QUEUE_PANEL_LABELS.emptyQueue);
    expect(container.querySelectorAll('[role="heading"]')).toHaveLength(0);
  });

  it('marks the now-playing row: accent title and the bars', () => {
    mount(panel());
    const paint = resolveQueuePanelPaint(theme);
    const title = byTestId('qp-now-play').querySelector('[dir="auto"]') as HTMLElement;
    expect(normalise(title.style.color)).toBe(normalise(paint.accent));
    expect(byTestId('qp-now-indicator').getAttribute('aria-label')).toBe('Now playing');
    expect(query('qp-queue-row-0-indicator')).toBeNull();
  });

  it('takes translated labels', () => {
    mount(panel({ labels: { nextInQueue: 'Añadidas', nextFrom: (c) => `Después: ${c}` } }));
    const headings = [...container.querySelectorAll('[role="heading"]')].map((h) => h.textContent);
    expect(headings).toEqual(['Now playing', 'Añadidas', 'Después: Night Drive']);
  });
});

describe('QueuePanel callbacks', () => {
  it('reports play with the section and index', () => {
    const onPlay = jest.fn();
    mount(panel({ onPlay }));
    press(byTestId('qp-context-row-1-play'));
    expect(onPlay).toHaveBeenLastCalledWith('context', 1, CONTEXT[1]);
    press(byTestId('qp-now-play'));
    expect(onPlay).toHaveBeenLastCalledWith('now', 0, NOW);
  });

  it('moves a row with ArrowUp / ArrowDown on its handle, within bounds, and announces it', () => {
    const onReorder = jest.fn();
    mount(panel({ onReorder }));
    key(byTestId('qp-queue-row-1-handle'), 'ArrowDown');
    expect(onReorder).toHaveBeenLastCalledWith('queue', 1, 2);
    expect(byTestId('qp-announcer').textContent).toBe('Paper Moons moved to position 3 of 3');
    key(byTestId('qp-queue-row-1-handle'), 'ArrowUp');
    expect(onReorder).toHaveBeenLastCalledWith('queue', 1, 0);

    onReorder.mockClear();
    key(byTestId('qp-queue-row-0-handle'), 'ArrowUp');
    key(byTestId('qp-queue-row-2-handle'), 'ArrowDown');
    key(byTestId('qp-context-row-1-handle'), 'ArrowDown');
    expect(onReorder).not.toHaveBeenCalled();

    key(byTestId('qp-context-row-1-handle'), 'ArrowUp');
    expect(onReorder).toHaveBeenLastCalledWith('context', 1, 0);
  });

  it('keeps keyboard focus on the moved handle when the list comes back reordered', () => {
    function Harness() {
      const [queue, setQueue] = React.useState(QUEUE);
      return (
        <QueuePanel
          testID="qp"
          queue={queue}
          onReorder={(_s, from, to) => setQueue((list) => moveQueueItem(list, from, to))}
        />
      );
    }
    mount(<Harness />);
    const handle = byTestId('qp-queue-row-0-handle');
    act(() => handle.focus());
    key(handle, 'ArrowDown');
    const labels = [...container.querySelectorAll('[data-testid$="-play"]')].map((e) => e.getAttribute('aria-label'));
    expect(labels).toEqual(['Play Paper Moons', 'Play Slow Tide', 'Play Signal Fires']);
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Reorder Slow Tide');
  });

  it('removes, clears and closes', () => {
    const onRemove = jest.fn();
    const onClearQueue = jest.fn();
    const onClose = jest.fn();
    mount(panel({ onRemove, onClearQueue, onClose }));
    press(byTestId('qp-queue-row-2-remove'));
    expect(onRemove).toHaveBeenLastCalledWith('queue', 2, QUEUE[2]);
    press(byTestId('qp-clear'));
    expect(onClearQueue).toHaveBeenCalledTimes(1);
    press(byTestId('qp-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('QueuePanel tabs', () => {
  const RECENT = [t('r1', 'Glasshouse', { meta: '12 min ago' }), t('now', 'Harbour Lights')];

  it('switches to the history when uncontrolled, and reports the tab', () => {
    const onTabChange = jest.fn();
    mount(panel({ recentlyPlayed: RECENT, onTabChange }));
    const tabs = [...container.querySelectorAll('[role="tab"]')] as HTMLElement[];
    expect(tabs.map((el) => el.textContent)).toEqual(['Queue', 'Recently played']);
    expect(tabs[0]?.getAttribute('aria-selected')).toBe('true');
    press(tabs[1] as HTMLElement);
    expect(onTabChange).toHaveBeenLastCalledWith('recent');
    expect(query('qp-queue')).toBeNull();
    expect(byTestId('qp-recent').querySelectorAll('[role="listitem"]')).toHaveLength(2);
    expect(byTestId('qp-recent-row-0').textContent).toContain('12 min ago');
    // The loaded track is marked in the history too.
    expect(query('qp-recent-row-1-indicator')).not.toBeNull();
  });

  it('follows a controlled tab', () => {
    mount(panel({ tab: 'recent', recentlyPlayed: RECENT }));
    expect(query('qp-recent')).not.toBeNull();
    const tabs = [...container.querySelectorAll('[role="tab"]')] as HTMLElement[];
    press(tabs[0] as HTMLElement);
    expect(query('qp-recent')).not.toBeNull();
  });
});

describe('RecentlyPlayedList', () => {
  it('plays a row by index and draws an empty line', () => {
    const onPlay = jest.fn();
    const items = [t('a', 'Low Orbit'), t('b', 'Morning Ferry')];
    mount(<RecentlyPlayedList items={items} onPlay={onPlay} testID="rp" />);
    press(byTestId('rp-row-1-play'));
    expect(onPlay).toHaveBeenCalledWith(1, items[1]);

    mount(<RecentlyPlayedList items={[]} labels={{ emptyRecent: 'Nada' }} testID="rp" />);
    expect(byTestId('rp').textContent).toBe('Nada');
  });
});

describe('resolveQueuePanelPaint', () => {
  it('paints from the theme and differs between light and dark', () => {
    mount(<></>, 'light');
    const light = resolveQueuePanelPaint(theme);
    mount(<></>, 'dark');
    const dark = resolveQueuePanelPaint(theme);
    expect(light.text).not.toBe(dark.text);
    expect(light.surface).not.toBe(dark.surface);
    expect(light.rowHover).not.toBe(light.surface);
    expect(dark.buttonHover).not.toBe(dark.rowHover);
  });
});
