/**
 * @jest-environment jsdom
 *
 * `SortablePhotoGrid` through the REAL react-native-web: the reorder maths, the
 * move buttons (names, disabled ends, the order they report), remove, retry,
 * add, the upload overlays' attributes, and a synthetic pointer drag.
 *
 * jsdom lays nothing out, so `onLayout` is driven by a stand-in ResizeObserver
 * and a fixed `offsetWidth`, and every rect is at the origin — so a pointer's
 * client coordinates ARE grid coordinates here. The real drag (hit testing,
 * the lifted copy) is verified in a browser.
 */
import React, { useState } from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

const observed = new Set<Element>();
let resizeCallback: ((entries: Array<{ target: Element }>) => void) | null = null;
class FakeResizeObserver {
  constructor(callback: (entries: Array<{ target: Element }>) => void) {
    resizeCallback = callback;
  }
  observe(node: Element) {
    observed.add(node);
  }
  unobserve(node: Element) {
    observed.delete(node);
  }
  disconnect() {
    observed.clear();
  }
}
(window as unknown as { ResizeObserver: unknown }).ResizeObserver = FakeResizeObserver;
let layoutWidth = 720;
Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
  configurable: true,
  get() {
    return layoutWidth;
  },
});

import { SortablePhotoGrid } from '../sortable-media';
import type { SortablePhoto } from '../sortable-media';
import { moveItem } from '../hooks/list-reorder';
import { slotAtPoint, sortableGridColumns } from '../sortable-media/reorder';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

async function flushLayout() {
  await act(async () => {
    resizeCallback?.(Array.from(observed).map((target) => ({ target })));
    await new Promise((resolve) => setTimeout(resolve, 5));
  });
}

async function mount(ui: React.ReactElement) {
  act(() => {
    root.render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        {ui}
      </BloomThemeProvider>,
    );
  });
  await flushLayout();
}

beforeEach(() => {
  layoutWidth = 720;
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

function maybe(id: string): HTMLElement | null {
  return container.querySelector(`[data-testid="${id}"]`);
}

const PHOTOS: SortablePhoto[] = [
  { id: 'a', uri: 'https://example.com/a.jpg', alt: 'Living room' },
  { id: 'b', uri: 'https://example.com/b.jpg' },
  { id: 'c', uri: 'https://example.com/c.jpg', status: 'uploading', progress: 42 },
  { id: 'd', uri: 'https://example.com/d.jpg', status: 'error' },
];

let lastOrder: string[] = [];

function Harness({
  initial = PHOTOS,
  onRemove,
  onRetry,
  onAdd,
  maxPhotos,
}: {
  initial?: SortablePhoto[];
  onRemove?: (id: string) => void;
  onRetry?: (id: string) => void;
  onAdd?: () => void;
  maxPhotos?: number;
}) {
  const [photos, setPhotos] = useState(initial);
  return (
    <SortablePhotoGrid
      photos={photos}
      onReorder={(next) => {
        lastOrder = next.map((p) => p.id);
        setPhotos(next);
      }}
      onRemove={onRemove}
      onRetry={onRetry}
      onAdd={onAdd}
      maxPhotos={maxPhotos}
      testID="g"
    />
  );
}

function order(): string[] {
  return Array.from(container.querySelectorAll('[role="listitem"]')).map(
    (el) => (el.getAttribute('data-testid') ?? '').replace('g-photo-', ''),
  );
}

describe('reorder maths', () => {
  it('moves an item forward and back without touching the input', () => {
    const list = ['a', 'b', 'c', 'd'];
    expect(moveItem(list, 0, 2)).toEqual(['b', 'c', 'a', 'd']);
    expect(moveItem(list, 3, 0)).toEqual(['d', 'a', 'b', 'c']);
    expect(moveItem(list, 1, 1)).toEqual(list);
    expect(moveItem(list, 1, 99)).toEqual(['a', 'c', 'd', 'b']);
    expect(list).toEqual(['a', 'b', 'c', 'd']);
    expect(moveItem([], 0, 1)).toEqual([]);
  });

  it('finds the slot under a point, snapping gaps and clamping to the count', () => {
    const grid = { columns: 4, cellWidth: 100, cellHeight: 100, gap: 10, count: 6 };
    expect(slotAtPoint(5, 5, grid)).toBe(0);
    expect(slotAtPoint(150, 50, grid)).toBe(1);
    expect(slotAtPoint(106, 50, grid)).toBe(1); // past the gap's midpoint
    expect(slotAtPoint(104, 50, grid)).toBe(0);
    expect(slotAtPoint(200, 150, grid)).toBe(5); // row 2 col 1 = 5
    expect(slotAtPoint(400, 400, grid)).toBe(5); // clamped
    expect(slotAtPoint(-50, -50, grid)).toBe(0);
  });

  it('uses 3 columns below 640 wide and 4 from there', () => {
    expect(sortableGridColumns(375)).toBe(3);
    expect(sortableGridColumns(639)).toBe(3);
    expect(sortableGridColumns(640)).toBe(4);
  });
});

describe('SortablePhotoGrid', () => {
  it('lays out square tiles in 4 columns at 720 and marks the first as the cover', async () => {
    await mount(<Harness />);
    const tile = byTestId('g-photo-a');
    // (720 - 3 × 12) / 4 = 171
    expect(tile.style.width).toBe('171px');
    expect(tile.style.height).toBe('171px');
    expect(maybe('g-photo-a-cover')?.textContent).toBe('Cover');
    expect(maybe('g-photo-b-cover')).toBeNull();
    expect(byTestId('g-grid').getAttribute('role')).toBe('list');
    expect(byTestId('g-grid').getAttribute('aria-label')).toBe('Photos');
  });

  it('uses 3 columns and 8 apart at phone width', async () => {
    layoutWidth = 343;
    await mount(<Harness />);
    // (343 - 2 × 8) / 3 = 109
    expect(byTestId('g-photo-a').style.width).toBe('109px');
  });

  it('names each photo with its position, the cover, its alt and an error', async () => {
    await mount(<Harness />);
    expect(byTestId('g-photo-a').getAttribute('aria-label')).toBe('Photo 1 of 4, Cover, Living room');
    expect(byTestId('g-photo-b').getAttribute('aria-label')).toBe('Photo 2 of 4');
    expect(byTestId('g-photo-d').getAttribute('aria-label')).toBe('Photo 4 of 4, Upload failed');
  });

  it('names the move buttons and disables them at the ends', async () => {
    await mount(<Harness />);
    const earlierFirst = byTestId('g-photo-a-earlier');
    const laterFirst = byTestId('g-photo-a-later');
    expect(earlierFirst.getAttribute('aria-label')).toBe('Move photo 1 earlier');
    expect(laterFirst.getAttribute('aria-label')).toBe('Move photo 1 later');
    expect(earlierFirst.hasAttribute('disabled') || earlierFirst.getAttribute('aria-disabled') === 'true').toBe(true);
    const laterLast = byTestId('g-photo-d-later');
    expect(laterLast.getAttribute('aria-label')).toBe('Move photo 4 later');
    expect(laterLast.hasAttribute('disabled') || laterLast.getAttribute('aria-disabled') === 'true').toBe(true);
  });

  it('reorders with the move buttons, reports the whole list and announces the position', async () => {
    await mount(<Harness />);
    act(() => byTestId('g-photo-a-later').click());
    expect(lastOrder).toEqual(['b', 'a', 'c', 'd']);
    expect(order()).toEqual(['b', 'a', 'c', 'd']);
    expect(maybe('g-photo-b-cover')?.textContent).toBe('Cover');
    expect(byTestId('g-status').textContent).toBe('Moved to position 2 of 4');
    expect(byTestId('g-status').getAttribute('aria-live')).toBe('polite');
    // The names follow the new positions.
    expect(byTestId('g-photo-a-earlier').getAttribute('aria-label')).toBe('Move photo 2 earlier');

    act(() => byTestId('g-photo-d-earlier').click());
    expect(lastOrder).toEqual(['b', 'a', 'd', 'c']);
  });

  it('keeps focus on the moved photo, falling back to the other button at an end', async () => {
    await mount(<Harness />);
    const later = byTestId('g-photo-b-later');
    act(() => later.focus());
    act(() => later.click());
    expect(order()).toEqual(['a', 'c', 'b', 'd']);
    expect(document.activeElement).toBe(byTestId('g-photo-b-later'));
    act(() => byTestId('g-photo-b-later').click());
    // Now last: "later" is disabled, focus moves to "earlier".
    expect(order()).toEqual(['a', 'c', 'd', 'b']);
    expect(document.activeElement).toBe(byTestId('g-photo-b-earlier'));
  });

  it('removes, retries and adds through the callbacks', async () => {
    const onRemove = jest.fn();
    const onRetry = jest.fn();
    const onAdd = jest.fn();
    await mount(<Harness onRemove={onRemove} onRetry={onRetry} onAdd={onAdd} />);
    expect(byTestId('g-photo-b-remove').getAttribute('aria-label')).toBe('Remove photo 2');
    act(() => byTestId('g-photo-b-remove').click());
    expect(onRemove).toHaveBeenCalledWith('b');
    expect(byTestId('g-photo-d-retry').getAttribute('aria-label')).toBe('Retry uploading photo 4');
    act(() => byTestId('g-photo-d-retry').click());
    expect(onRetry).toHaveBeenCalledWith('d');
    const add = byTestId('g-add');
    expect(add.getAttribute('role')).toBe('button');
    expect(add.getAttribute('aria-label')).toBe('Add photos');
    act(() => add.click());
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it('hides the add tile at maxPhotos', async () => {
    await mount(<Harness onAdd={() => undefined} maxPhotos={4} />);
    expect(maybe('g-add')).toBeNull();
  });

  it('draws the upload as a named progressbar, and a spinner without a progress', async () => {
    await mount(
      <Harness initial={[...PHOTOS, { id: 'e', uri: 'https://example.com/e.jpg', status: 'uploading' }]} />,
    );
    const bar = byTestId('g-photo-c-progress');
    expect(bar.getAttribute('role')).toBe('progressbar');
    expect(bar.getAttribute('aria-label')).toBe('Uploading photo 3');
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
    expect(bar.getAttribute('aria-valuemax')).toBe('100');
    expect(bar.getAttribute('aria-valuenow')).toBe('42');
    expect(bar.textContent).toContain('42%');
    const indeterminate = byTestId('g-photo-e-progress');
    expect(indeterminate.hasAttribute('aria-valuenow')).toBe(false);
  });

  it('drags a tile with a mouse to a new slot and commits on release', async () => {
    await mount(<Harness />);
    const tile = byTestId('g-photo-a');
    const fire = (target: EventTarget, type: string, x: number, y: number) =>
      act(() => {
        target.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0 }));
      });
    fire(tile, 'pointerdown', 20, 20);
    // Slot 2 is x 366..537 at 171 + 12.
    fire(window, 'pointermove', 400, 40);
    expect(maybe('g-lifted')).not.toBeNull();
    // The other tiles make room live, before release.
    expect(order()).toEqual(['b', 'c', 'a', 'd']);
    expect(byTestId('g-grid').getAttribute('data-bloom-sortable-grid')).toBe('dragging');
    fire(window, 'pointerup', 400, 40);
    expect(lastOrder).toEqual(['b', 'c', 'a', 'd']);
    expect(maybe('g-lifted')).toBeNull();
  });

  it('cancels a drag on Escape, and ignores travel under the threshold', async () => {
    lastOrder = [];
    await mount(<Harness />);
    const tile = byTestId('g-photo-b');
    const fire = (target: EventTarget, type: string, x: number, y: number) =>
      act(() => {
        target.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0 }));
      });
    fire(tile, 'pointerdown', 200, 20);
    fire(window, 'pointermove', 202, 21);
    expect(maybe('g-lifted')).toBeNull();
    fire(window, 'pointermove', 600, 20);
    expect(order()).toEqual(['a', 'c', 'd', 'b']);
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(order()).toEqual(['a', 'b', 'c', 'd']);
    fire(window, 'pointerup', 600, 20);
    expect(lastOrder).toEqual([]);
  });
});
