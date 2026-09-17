/**
 * @jest-environment jsdom
 *
 * `CategoryBar`, rendered through the REAL react-native-web so the assertions
 * read the emitted DOM: tab semantics, colours, roving focus, and the arrows
 * that follow the scroll position.
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { CategoryBar } from '../category-bar';
import {
  CATEGORY_BAR_EDGE,
  categoryBarOverflow,
  categoryBarPageTarget,
  categoryBarRevealTarget,
} from '../category-bar/CategoryBar';
import { RiFireLine } from '../icons/remix/RiFireLine';
import { RiSunLine } from '../icons/remix/RiSunLine';
import { RiTreeLine } from '../icons/remix/RiTreeLine';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const ITEMS = [
  { key: 'trending', label: 'Trending', icon: RiFireLine },
  { key: 'beach', label: 'Beachfront', icon: RiSunLine },
  { key: 'cabins', label: 'Cabins', icon: RiTreeLine },
];

let container: HTMLDivElement;
let root: Root;
let colors: { text: string; textSecondary: string; background: string } = {
  text: '',
  textSecondary: '',
  background: '',
};

function ReadColors() {
  colors = useTheme().colors;
  return null;
}

function mount(ui: React.ReactElement, mode: 'light' | 'dark' = 'light') {
  act(() => {
    root.render(
      <BloomThemeProvider mode={mode} colorPreset="teal">
        <ReadColors />
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

function normalise(color: string): string {
  const probe = document.createElement('div');
  probe.style.color = color;
  return probe.style.color;
}

/** Give the track real scroll geometry and fire one scroll event. */
function scrollTrack(x: number, viewport: number, content: number) {
  const track = byTestId('bar-track');
  Object.defineProperty(track, 'scrollLeft', { configurable: true, value: x });
  Object.defineProperty(track, 'scrollWidth', { configurable: true, value: content });
  Object.defineProperty(track, 'offsetWidth', { configurable: true, value: viewport });
  act(() => {
    track.dispatchEvent(new Event('scroll', { bubbles: false }));
  });
}

describe('geometry helpers', () => {
  it('overflow: nothing when it fits, each side only when there is more to scroll', () => {
    expect(categoryBarOverflow({ x: 0, viewport: 500, content: 500 })).toEqual({ previous: false, next: false });
    expect(categoryBarOverflow({ x: 0, viewport: 0, content: 900 })).toEqual({ previous: false, next: false });
    expect(categoryBarOverflow({ x: 0, viewport: 500, content: 900 })).toEqual({ previous: false, next: true });
    expect(categoryBarOverflow({ x: 200, viewport: 500, content: 900 })).toEqual({ previous: true, next: true });
    expect(categoryBarOverflow({ x: 399.5, viewport: 500, content: 900 })).toEqual({ previous: true, next: false });
  });

  it('an arrow scrolls the viewport less both fades, clamped to the ends', () => {
    const page = 800 - CATEGORY_BAR_EDGE * 2;
    expect(categoryBarPageTarget({ x: 0, viewport: 800, content: 3000 }, 1)).toBe(page);
    expect(categoryBarPageTarget({ x: 2100, viewport: 800, content: 3000 }, 1)).toBe(2200);
    expect(categoryBarPageTarget({ x: 100, viewport: 800, content: 3000 }, -1)).toBe(0);
    // A narrow viewport still moves by half of itself.
    expect(categoryBarPageTarget({ x: 0, viewport: 200, content: 3000 }, 1)).toBe(100);
  });

  it('reveal: null when visible, the minimal move otherwise, and all the way near an end', () => {
    const scroll = { x: 500, viewport: 800, content: 3000 };
    expect(categoryBarRevealTarget(scroll, 700, 80, 72)).toBeNull();
    expect(categoryBarRevealTarget(scroll, 1400, 80, 72)).toBe(1400 + 80 + 72 - 800);
    expect(categoryBarRevealTarget(scroll, 400, 80, 72)).toBe(400 - 72);
    // Within one inset of the start: go to 0 rather than leave a sliver.
    expect(categoryBarRevealTarget(scroll, 100, 80, 72)).toBe(0);
    // Within one inset of the end: go to the end.
    expect(categoryBarRevealTarget(scroll, 2900, 80, 72)).toBe(2200);
  });
});

describe('CategoryBar', () => {
  it('is a named tablist of named tabs, the selected one aria-selected and the only tab stop', () => {
    mount(<CategoryBar items={ITEMS} value="beach" accessibilityLabel="Categories" testID="bar" />);
    const list = byTestId('bar-track');
    expect(list.getAttribute('role')).toBe('tablist');
    expect(list.getAttribute('aria-label')).toBe('Categories');
    const tabs = ITEMS.map((item) => byTestId(`bar-item-${item.key}`));
    expect(tabs.map((tab) => tab.getAttribute('role'))).toEqual(['tab', 'tab', 'tab']);
    expect(tabs.map((tab) => tab.getAttribute('aria-label'))).toEqual(['Trending', 'Beachfront', 'Cabins']);
    expect(tabs.map((tab) => tab.getAttribute('aria-selected'))).toEqual(['false', 'true', 'false']);
    expect(tabs.map((tab) => tab.getAttribute('tabindex'))).toEqual(['-1', '0', '-1']);
  });

  it('with nothing selected the first tab is the tab stop', () => {
    mount(<CategoryBar items={ITEMS} accessibilityLabel="Categories" testID="bar" />);
    expect(byTestId('bar-item-trending').getAttribute('tabindex')).toBe('0');
    expect(container.querySelectorAll('[aria-selected="true"]')).toHaveLength(0);
  });

  it.each(['light', 'dark'] as const)(
    'rest is text-secondary, selected text-primary with a 2px text-primary bar (%s)',
    (mode) => {
      mount(<CategoryBar items={ITEMS} value="beach" accessibilityLabel="Categories" testID="bar" />, mode);
      const label = (key: string) => byTestId(`bar-item-${key}`).querySelector('[dir="auto"]') as HTMLElement;
      expect(getComputedStyle(label('beach')).color).toBe(normalise(colors.text));
      expect(getComputedStyle(label('trending')).color).toBe(normalise(colors.textSecondary));
      const bar = byTestId('bar-item-beach-bar');
      expect(getComputedStyle(bar).height).toBe('2px');
      expect(getComputedStyle(bar).backgroundColor).toBe(normalise(colors.text));
      expect(getComputedStyle(byTestId('bar-item-trending-bar')).backgroundColor).toBe('rgba(0, 0, 0, 0)');
      expect(byTestId('bar-item-beach').querySelector('svg')?.getAttribute('width')).toBe('24');
    },
  );

  it('a press selects; Space selects the focused tab', () => {
    const onValueChange = jest.fn();
    mount(
      <CategoryBar items={ITEMS} value="trending" onValueChange={onValueChange} accessibilityLabel="Categories" testID="bar" />,
    );
    act(() => byTestId('bar-item-cabins').click());
    expect(onValueChange).toHaveBeenLastCalledWith('cabins');
    act(() => {
      byTestId('bar-item-beach').dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    });
    expect(onValueChange).toHaveBeenLastCalledWith('beach');
  });

  it('ArrowRight / ArrowLeft / Home / End move focus between tabs without selecting', () => {
    const onValueChange = jest.fn();
    mount(
      <CategoryBar items={ITEMS} value="trending" onValueChange={onValueChange} accessibilityLabel="Categories" testID="bar" />,
    );
    const key = (id: string, k: string) =>
      act(() => {
        byTestId(id).dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
      });
    key('bar-item-trending', 'ArrowRight');
    expect(document.activeElement).toBe(byTestId('bar-item-beach'));
    key('bar-item-beach', 'End');
    expect(document.activeElement).toBe(byTestId('bar-item-cabins'));
    key('bar-item-cabins', 'ArrowRight');
    expect(document.activeElement).toBe(byTestId('bar-item-cabins'));
    key('bar-item-cabins', 'Home');
    expect(document.activeElement).toBe(byTestId('bar-item-trending'));
    key('bar-item-trending', 'ArrowLeft');
    expect(document.activeElement).toBe(byTestId('bar-item-trending'));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('arrows appear only on a side with more to scroll, over a fade of the page colour', () => {
    mount(<CategoryBar items={ITEMS} value="trending" accessibilityLabel="Categories" testID="bar" />);
    expect(container.querySelector('[data-testid="bar-previous"]')).toBeNull();
    expect(container.querySelector('[data-testid="bar-next"]')).toBeNull();

    scrollTrack(0, 400, 1000);
    expect(container.querySelector('[data-testid="bar-previous"]')).toBeNull();
    const next = byTestId('bar-next');
    expect(next.getAttribute('aria-label')).toBe('Next categories');
    const edge = next.parentElement as HTMLElement;
    expect(edge.style.backgroundImage || getComputedStyle(edge).backgroundImage).toContain('linear-gradient');
    expect(getComputedStyle(edge).width).toBe(`${CATEGORY_BAR_EDGE}px`);
  });

  it('both arrows mid-way; the next arrow scrolls by a page', () => {
    mount(<CategoryBar items={ITEMS} value="trending" accessibilityLabel="Categories" testID="bar" />);
    scrollTrack(100, 400, 1000);
    expect(byTestId('bar-previous').getAttribute('aria-label')).toBe('Previous categories');
    const track = byTestId('bar-track');
    const scroll = jest.fn();
    Object.defineProperty(track, 'scroll', { configurable: true, value: scroll });
    act(() => byTestId('bar-next').click());
    expect(scroll).toHaveBeenLastCalledWith(
      expect.objectContaining({ left: categoryBarPageTarget({ x: 100, viewport: 400, content: 1000 }, 1) }),
    );
  });

  it('renders the trailing slot outside the scrolling track', () => {
    mount(
      <CategoryBar
        items={ITEMS}
        accessibilityLabel="Categories"
        trailing={<div data-testid="filters">Filters</div>}
        testID="bar"
      />,
    );
    const filters = byTestId('filters');
    expect(byTestId('bar').contains(filters)).toBe(true);
    expect(byTestId('bar-track').contains(filters)).toBe(false);
  });
});
