/**
 * @jest-environment jsdom
 *
 * `Shelf`, `ShelfSkeleton` and `FilterChips`, rendered through the REAL
 * react-native-web so the assertions read the emitted DOM, plus the pure
 * geometry the row and grid are built on.
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { FilterChips, Shelf, ShelfSkeleton, shelfGridColumns } from '../media-shelf';
import { shelfOverflow, shelfPageTarget } from '../media-shelf/shared';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

function mount(ui: React.ReactElement) {
  act(() => {
    root.render(<BloomThemeProvider mode="light">{ui}</BloomThemeProvider>);
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

function click(el: HTMLElement) {
  act(() => {
    el.click();
  });
}

describe('shelf geometry', () => {
  it('fits as many columns as clear the minimum width, and at least one', () => {
    expect(shelfGridColumns(0, 160, 16)).toEqual({ columns: 0, itemWidth: 0 });
    expect(shelfGridColumns(100, 160, 16)).toEqual({ columns: 1, itemWidth: 100 });
    // 5 × 160 + 4 × 16 = 864 fits exactly.
    expect(shelfGridColumns(864, 160, 16)).toEqual({ columns: 5, itemWidth: 160 });
    expect(shelfGridColumns(863, 160, 16).columns).toBe(4);
    const { columns, itemWidth } = shelfGridColumns(1248, 240, 8);
    expect(columns).toBe(5);
    expect(itemWidth * columns + 8 * (columns - 1)).toBeCloseTo(1248, 0);
  });

  it('reports overflow on each side with 1px slack', () => {
    expect(shelfOverflow({ x: 0, viewport: 0, content: 900 })).toEqual({ previous: false, next: false });
    expect(shelfOverflow({ x: 0, viewport: 500, content: 500.5 })).toEqual({ previous: false, next: false });
    expect(shelfOverflow({ x: 0, viewport: 500, content: 900 })).toEqual({ previous: false, next: true });
    expect(shelfOverflow({ x: 200, viewport: 500, content: 900 })).toEqual({ previous: true, next: true });
    expect(shelfOverflow({ x: 399.5, viewport: 500, content: 900 })).toEqual({ previous: true, next: false });
  });

  it('pages by 90% of the viewport, clamped to the track', () => {
    const scroll = { x: 0, viewport: 1000, content: 2500 };
    expect(shelfPageTarget(scroll, 1)).toBe(900);
    expect(shelfPageTarget({ ...scroll, x: 900 }, 1)).toBe(1500);
    expect(shelfPageTarget({ ...scroll, x: 1500 }, 1)).toBe(1500);
    expect(shelfPageTarget({ ...scroll, x: 500 }, -1)).toBe(0);
  });
});

describe('Shelf', () => {
  it('is a group named by its title, with a level-2 heading and the eyebrow', () => {
    mount(
      <Shelf title="Maya" eyebrow="Made for" testID="shelf">
        <div>one</div>
      </Shelf>,
    );
    const group = byTestId('shelf');
    expect(group.getAttribute('role')).toBe('group');
    expect(group.getAttribute('aria-label')).toBe('Maya');
    const heading = container.querySelector('[role="heading"]');
    expect(heading?.textContent).toBe('Maya');
    expect(heading?.getAttribute('aria-level')).toBe('2');
    expect(group.textContent).toContain('Made for');
    // No "Show all" and no arrows without a handler and without overflow.
    expect(container.querySelector('[data-testid="shelf-show-all"]')).toBeNull();
    expect(container.querySelector('[data-testid="shelf-next"]')).toBeNull();
  });

  it('"Show all" is a button whose name starts with its visible text', () => {
    const onShowAll = jest.fn();
    mount(
      <Shelf title="Your favourite artists" onShowAll={onShowAll} headingLevel={3} testID="shelf">
        <div>one</div>
      </Shelf>,
    );
    const button = byTestId('shelf-show-all');
    expect(button.getAttribute('role')).toBe('button');
    expect(button.getAttribute('aria-label')).toBe('Show all: Your favourite artists');
    expect(button.textContent).toBe('Show all');
    click(button);
    expect(onShowAll).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[role="heading"]')?.getAttribute('aria-level')).toBe('3');
  });

  it('a pressable title is a link wrapping the heading', () => {
    const onTitlePress = jest.fn();
    mount(
      <Shelf title="Maya" onTitlePress={onTitlePress} testID="shelf">
        <div>one</div>
      </Shelf>,
    );
    const link = byTestId('shelf-title');
    expect(link.getAttribute('role')).toBe('link');
    expect(link.querySelector('[role="heading"]')).not.toBeNull();
    click(link);
    expect(onTitlePress).toHaveBeenCalledTimes(1);
  });

  it('wraps each row item at `itemWidth` inside a horizontal scroll track', () => {
    mount(
      <Shelf title="Mixes" itemWidth={180} testID="shelf">
        <span>a</span>
        <span>b</span>
        <span>c</span>
      </Shelf>,
    );
    const track = byTestId('shelf-track');
    const items = track.querySelectorAll('[data-bloom-shelf-item]');
    expect(items).toHaveLength(3);
    items.forEach((item) => expect((item as HTMLElement).style.width).toBe('180px'));
  });

  it('renders no grid cells before the grid is measured', () => {
    mount(
      <Shelf title="Recently played" layout="grid" testID="shelf">
        <span>a</span>
        <span>b</span>
      </Shelf>,
    );
    expect(byTestId('shelf-grid').children).toHaveLength(0);
  });
});

describe('ShelfSkeleton', () => {
  it('is a busy group with one tile per count', () => {
    mount(<ShelfSkeleton count={4} testID="sk" />);
    const group = byTestId('sk');
    expect(group.getAttribute('role')).toBe('group');
    expect(group.getAttribute('aria-busy')).toBe('true');
    expect(group.getAttribute('aria-label')).toBe('Loading');
    expect(container.querySelectorAll('[data-testid="sk-tile"]')).toHaveLength(4);
  });
});

describe('FilterChips', () => {
  const OPTIONS = [
    { value: 'all', label: 'All' },
    { value: 'music', label: 'Music' },
    { value: 'podcasts', label: 'Podcasts' },
  ];

  it('is a named group of toggle buttons carrying aria-pressed', () => {
    mount(<FilterChips options={OPTIONS} value="music" onValueChange={jest.fn()} testID="fc" />);
    const group = byTestId('fc');
    expect(group.getAttribute('role')).toBe('group');
    expect(group.getAttribute('aria-label')).toBe('Filters');
    expect(byTestId('fc-all').getAttribute('aria-pressed')).toBe('false');
    expect(byTestId('fc-music').getAttribute('aria-pressed')).toBe('true');
    expect(byTestId('fc-music').getAttribute('aria-label')).toBe('Music');
  });

  it('selects one; pressing the selected chip does nothing unless deselect is allowed', () => {
    const onValueChange = jest.fn();
    mount(<FilterChips options={OPTIONS} value="all" onValueChange={onValueChange} testID="fc" />);
    click(byTestId('fc-podcasts'));
    expect(onValueChange).toHaveBeenLastCalledWith('podcasts');
    click(byTestId('fc-all'));
    expect(onValueChange).toHaveBeenCalledTimes(1);

    mount(
      <FilterChips options={OPTIONS} value="all" onValueChange={onValueChange} allowDeselect testID="fc" />,
    );
    click(byTestId('fc-all'));
    expect(onValueChange).toHaveBeenLastCalledWith(undefined);
  });

  it('paints the selected chip in the solid accent and the rest subtle', () => {
    mount(<FilterChips options={OPTIONS} value="all" onValueChange={jest.fn()} testID="fc" />);
    const selected = getComputedStyle(byTestId('fc-all')).backgroundColor;
    const rest = getComputedStyle(byTestId('fc-music')).backgroundColor;
    expect(selected).not.toBe('');
    expect(selected).not.toBe(rest);
  });
});
