/**
 * @jest-environment jsdom
 *
 * `ListingCard`, `FavoriteButton`, `ListingCardGrid` and `WishlistCard`, rendered
 * through the REAL react-native-web so the assertions read the emitted DOM:
 * the link, the sibling controls, geometry, colours and accessibility attributes.
 *
 * jsdom lays nothing out, so `onLayout` is driven by a stand-in ResizeObserver
 * and a fixed `offsetWidth`; the paging itself (scroll-snap, smooth scroll) is
 * verified in a real browser.
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

// --- layout stand-ins (installed before react-native-web creates its observer) ---
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
let layoutWidth = 300;
Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
  configurable: true,
  get() {
    return layoutWidth;
  },
});
const scrollCalls: Array<{ left: number; behavior: string }> = [];
(Element.prototype as unknown as { scroll: unknown }).scroll = function scroll(options: {
  left: number;
  behavior: string;
}) {
  scrollCalls.push({ left: options.left, behavior: options.behavior });
};

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import type { Theme } from '../theme/types';
import { FavoriteButton, ListingCard, ListingCardGrid, WishlistCard } from '../listing-card';
import {
  DOT_EDGE_SIZE,
  DOT_SIZE,
  dotWindow,
  listingGridColumns,
  resolveListingCardPaint,
  resolvePhoto,
} from '../listing-card/shared';
import { colorRamp, DANGER_TABLE, resolveButtonRamps } from '../button/shared';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;
let theme: Theme;

function ReadTheme() {
  theme = useTheme();
  return null;
}

function mount(ui: React.ReactElement, mode: 'light' | 'dark' = 'light'): HTMLElement {
  act(() => {
    root.render(
      <BloomThemeProvider mode={mode} colorPreset="teal">
        <ReadTheme />
        {ui}
      </BloomThemeProvider>,
    );
  });
  return container;
}

/** Fire every observed node's `onLayout` at `layoutWidth`, and let the measure timers run. */
async function flushLayout() {
  await act(async () => {
    resizeCallback?.(Array.from(observed).map((target) => ({ target })));
    await new Promise((resolve) => setTimeout(resolve, 5));
  });
}

beforeEach(() => {
  layoutWidth = 300;
  scrollCalls.length = 0;
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
const maybe = (id: string) => container.querySelector(`[data-testid="${id}"]`);

function normalise(color: string): string {
  const probe = document.createElement('div');
  probe.style.color = color;
  return probe.style.color;
}

const PHOTOS = Array.from({ length: 7 }, (_, i) => `https://example.test/p${i}.jpg`);

const stay = {
  photos: PHOTOS,
  title: 'Alvora, Coast of Merin',
  subtitle: 'Hosted by Ilse',
  dates: '12 – 17 Oct',
  rating: 4.92,
  reviewCount: 128,
  price: '€124',
  priceUnit: 'night',
};

// ---------------------------------------------------------------------------

describe('pure helpers', () => {
  it('listingGridColumns: 1 < 640 ≤ 2 < 950 ≤ 3 < 1280 ≤ 4', () => {
    expect([375, 639, 640, 949, 950, 1279, 1280, 1920].map(listingGridColumns)).toEqual([
      1, 1, 2, 2, 3, 3, 4, 4,
    ]);
  });

  it('dotWindow: every dot up to five; beyond, a window of five with shrinking edges', () => {
    expect(dotWindow(1, 0)).toEqual([]);
    expect(dotWindow(3, 1).map((d) => [d.index, d.size, d.active])).toEqual([
      [0, DOT_SIZE, false],
      [1, DOT_SIZE, true],
      [2, DOT_SIZE, false],
    ]);
    // 9 photos, first in view: 0..4, the far edge small.
    expect(dotWindow(9, 0).map((d) => d.size)).toEqual([6, 6, 6, 6, DOT_EDGE_SIZE]);
    // Middle: both edges small, active centred.
    const mid = dotWindow(9, 4);
    expect(mid.map((d) => d.index)).toEqual([2, 3, 4, 5, 6]);
    expect(mid.map((d) => d.size)).toEqual([DOT_EDGE_SIZE, 6, 6, 6, DOT_EDGE_SIZE]);
    expect(mid[2]?.active).toBe(true);
    // Last: the near edge small, the window pinned to the end.
    const last = dotWindow(9, 8);
    expect(last.map((d) => d.index)).toEqual([4, 5, 6, 7, 8]);
    expect(last.map((d) => d.size)).toEqual([DOT_EDGE_SIZE, 6, 6, 6, 6]);
  });

  it('resolvePhoto: a URL passes through, an id goes to the resolver with the variant', () => {
    const resolver = jest.fn((id: string, variant?: string) => `https://cdn.test/${id}/${variant}`);
    expect(resolvePhoto('https://a.test/x.jpg', resolver, 'medium')).toBe('https://a.test/x.jpg');
    expect(resolvePhoto('file-123', resolver, 'medium')).toBe('https://cdn.test/file-123/medium');
    expect(resolvePhoto('file-123', null)).toBeUndefined();
  });

  it.each(['light', 'dark'] as const)('paint reads the ramps (%s)', (mode) => {
    mount(<></>, mode);
    const paint = resolveListingCardPaint(theme);
    const { neutral } = resolveButtonRamps(theme);
    expect(paint.onMedia).toBe(neutral[50]);
    expect(paint.scrim).toBe(neutral[950]);
    expect(paint.favorite).toBe(colorRamp(theme.colors.error, DANGER_TABLE)[500]);
    expect(paint.text).toBe(theme.colors.text);
  });
});

// ---------------------------------------------------------------------------

describe('ListingCard', () => {
  it('is ONE named link with a real href, and the heart is its sibling, not its child', () => {
    mount(<ListingCard {...stay} badge="Guest favourite" href="/stays/alvora" favorite={false} onFavoriteChange={() => {}} testID="c" />);
    const link = byTestId('c-link');
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('/stays/alvora');
    expect(link.getAttribute('role')).toBe('link');
    expect(link.getAttribute('aria-label')).toBe(
      'Alvora, Coast of Merin, Guest favourite, Rated 4.92 out of 5, 128 reviews, Hosted by Ilse, 12 – 17 Oct, €124 night',
    );
    const heart = byTestId('c-favorite');
    expect(link.contains(heart)).toBe(false);
    expect(byTestId('c').contains(heart)).toBe(true);
    expect(container.querySelectorAll('a button, a [role="button"]')).toHaveLength(0);
  });

  it('draws the title, rating, secondary lines and price line', () => {
    mount(<ListingCard {...stay} originalPrice="€150" total="€620 total" testID="c" />);
    const text = byTestId('c-link').textContent;
    expect(text).toContain('Alvora, Coast of Merin');
    expect(text).toContain('4.92(128)');
    expect(text).toContain('Hosted by Ilse');
    expect(text).toContain('12 – 17 Oct');
    expect(text).toContain('€150 €124 night');
    expect(text).toContain('€620 total');
    expect(byTestId('c-link').getAttribute('aria-label')).toContain('€124 night, originally €150, €620 total');
  });

  it('strikes the original price in text-secondary and bolds the price', () => {
    mount(<ListingCard {...stay} originalPrice="€150" testID="c" />);
    const spans = Array.from(byTestId('c-link').querySelectorAll('span')) as HTMLElement[];
    const original = spans.find((s) => s.textContent === '€150') as HTMLElement;
    const price = spans.find((s) => s.textContent === '€124') as HTMLElement;
    expect(getComputedStyle(original).textDecorationLine || getComputedStyle(original).textDecoration).toContain(
      'line-through',
    );
    expect(getComputedStyle(original).color).toBe(normalise(theme.colors.textSecondary));
    expect(getComputedStyle(price).fontWeight).toBe('600');
  });

  it('an unrated stay (null) draws "New"; an absent rating draws nothing', () => {
    mount(<ListingCard {...stay} rating={null} testID="c" />);
    expect(byTestId('c-link').textContent).toContain('New');
    expect(byTestId('c-link').getAttribute('aria-label')).toContain(', New,');
    mount(<ListingCard {...stay} rating={undefined} testID="c" />);
    expect(byTestId('c-link').querySelector('[role="img"]')).toBeNull();
  });

  it('with no price the total IS the price line', () => {
    mount(<ListingCard {...stay} price={undefined} total="€1,020 total" testID="c" />);
    const total = Array.from(byTestId('c-link').querySelectorAll('[dir="auto"]')).find(
      (el) => el.textContent === '€1,020 total',
    ) as HTMLElement;
    expect(getComputedStyle(total).fontWeight).toBe('600');
  });

  it('vertical photo is 20:19 with radius 16; horizontal is 40% wide and square', () => {
    mount(<ListingCard {...stay} testID="c" />);
    let photo = getComputedStyle(byTestId('c-photo'));
    expect(photo.aspectRatio).toBe(String(20 / 19));
    expect(photo.borderTopLeftRadius).toBe('16px');
    expect(getComputedStyle(byTestId('c-link')).flexDirection).toBe('column');
    mount(<ListingCard {...stay} layout="horizontal" testID="c" />);
    photo = getComputedStyle(byTestId('c-photo'));
    expect(photo.width).toBe('40%');
    expect(photo.aspectRatio).toBe('1');
    expect(getComputedStyle(byTestId('c-link')).flexDirection).toBe('row');
  });

  it('a string badge is a pill on the menu surface; a node is placed as given', () => {
    mount(<ListingCard {...stay} badge="Guest favourite" testID="c" />);
    const pill = byTestId('c-badge').firstElementChild as HTMLElement;
    expect(pill.textContent).toBe('Guest favourite');
    expect(getComputedStyle(pill).borderTopLeftRadius).not.toBe('0px');
    expect(getComputedStyle(pill).backgroundColor).toBe(normalise(resolveListingCardPaint(theme).surface));
    mount(<ListingCard {...stay} badge={<span data-testid="custom">x</span>} testID="c" />);
    expect(byTestId('c-badge').contains(byTestId('custom'))).toBe(true);
  });

  it('onPress with href prevents the anchor default and calls onPress', () => {
    const onPress = jest.fn();
    mount(<ListingCard {...stay} href="/stays/alvora" onPress={onPress} testID="c" />);
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    act(() => {
      byTestId('c-link').dispatchEvent(event);
    });
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
  });

  it('without href or onPress the card is not a control', () => {
    mount(<ListingCard {...stay} testID="c" />);
    expect(byTestId('c-link').getAttribute('role')).toBeNull();
    expect(byTestId('c-link').tagName).toBe('DIV');
  });

  it('pages: dots follow the index, arrows appear at the right ends and scroll one photo', async () => {
    const onPhotoIndexChange = jest.fn();
    mount(<ListingCard {...stay} onPhotoIndexChange={onPhotoIndexChange} testID="c" />);
    expect(maybe('c-next')).toBeNull(); // not measured yet
    await flushLayout();

    expect(maybe('c-previous')).toBeNull();
    const next = byTestId('c-next');
    expect(next.getAttribute('aria-label')).toBe('Next photo');
    // Hover-revealed: the wrapper carries the arrow hook the adopted sheet targets.
    expect(next.closest('[data-bloom-listing-card-arrow]')?.getAttribute('data-bloom-listing-card-arrow')).toBe('next');
    const activeDots = () => container.querySelectorAll('[data-bloom-listing-card-dot="active"]');
    expect(activeDots()).toHaveLength(1);
    expect(container.querySelectorAll('[data-bloom-listing-card-dot]')).toHaveLength(5);

    act(() => {
      byTestId('c-next').click();
    });
    expect(scrollCalls[scrollCalls.length - 1]?.left).toBe(300);
    expect(onPhotoIndexChange).toHaveBeenLastCalledWith(1);
    expect(byTestId('c-previous').getAttribute('aria-label')).toBe('Previous photo');

    act(() => {
      byTestId('c-previous').click();
    });
    expect(scrollCalls[scrollCalls.length - 1]?.left).toBe(0);
    expect(onPhotoIndexChange).toHaveBeenLastCalledWith(0);
    expect(maybe('c-previous')).toBeNull();
  });

  it('a single photo has no dots and no arrows', async () => {
    mount(<ListingCard {...stay} photos={[PHOTOS[0] as string]} testID="c" />);
    await flushLayout();
    expect(maybe('c-next')).toBeNull();
    expect(container.querySelectorAll('[data-bloom-listing-card-dot]')).toHaveLength(0);
  });

  it('mounts photos lazily: the one in view and the next', async () => {
    mount(<ListingCard {...stay} testID="c" />);
    await flushLayout();
    const html = byTestId('c-photo').innerHTML;
    expect(html).toContain('p0.jpg');
    expect(html).toContain('p1.jpg');
    expect(html).not.toContain('p3.jpg');
  });

  it('loading draws the skeleton in the same geometry, busy, and no link', () => {
    mount(<ListingCard {...stay} loading testID="c" />);
    const el = byTestId('c');
    expect(el.getAttribute('aria-busy')).toBe('true');
    expect(maybe('c-link')).toBeNull();
    const photo = el.firstElementChild as HTMLElement;
    expect(getComputedStyle(photo).aspectRatio).toBe(String(20 / 19));
    expect(getComputedStyle(photo).borderTopLeftRadius).toBe('16px');
  });
});

// ---------------------------------------------------------------------------

describe('FavoriteButton', () => {
  it.each(['light', 'dark'] as const)('toggles with aria-pressed, a changing name, and colour only (%s)', (mode) => {
    const onFavoriteChange = jest.fn();
    mount(<FavoriteButton favorite={false} onFavoriteChange={onFavoriteChange} testID="f" />, mode);
    const button = byTestId('f');
    expect(button.getAttribute('role')).toBe('button');
    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(button.getAttribute('aria-label')).toBe('Save to wishlist');
    const paint = resolveListingCardPaint(theme);
    const fills = () => Array.from(button.querySelectorAll('path')).map((p) => p.getAttribute('fill'));
    expect(fills()).toEqual([paint.scrim, paint.onMedia]);
    expect(getComputedStyle(button).transform === '' || getComputedStyle(button).transform === 'none').toBe(true);

    act(() => button.click());
    expect(onFavoriteChange).toHaveBeenCalledWith(true);

    mount(<FavoriteButton favorite onFavoriteChange={onFavoriteChange} testID="f" />, mode);
    expect(byTestId('f').getAttribute('aria-pressed')).toBe('true');
    expect(byTestId('f').getAttribute('aria-label')).toBe('Remove from wishlist');
    expect(fills()).toEqual([paint.favorite, paint.onMedia]);
  });

  it('labels are overridable and the target is at least 32', () => {
    mount(<FavoriteButton favorite={false} onFavoriteChange={() => {}} saveLabel="Guardar" size={20} testID="f" />);
    expect(byTestId('f').getAttribute('aria-label')).toBe('Guardar');
    expect(getComputedStyle(byTestId('f')).width).toBe('32px');
  });

  it('inside a card, pressing the heart never presses the card', () => {
    const onPress = jest.fn();
    const onFavoriteChange = jest.fn();
    mount(<ListingCard {...stay} onPress={onPress} favorite={false} onFavoriteChange={onFavoriteChange} testID="c" />);
    act(() => byTestId('c-favorite').click());
    expect(onFavoriteChange).toHaveBeenCalledWith(true);
    expect(onPress).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------

describe('ListingCardGrid', () => {
  it.each([
    [375, 1, 375],
    [800, 2, 388],
    [1100, 3, (1100 - 48) / 3],
    [1440, 4, 342],
  ])('at %ipx: %i columns, cells sized from the width with 24/40 gaps', async (width, columns, cell) => {
    layoutWidth = width;
    mount(
      <ListingCardGrid testID="g">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i}>{i}</span>
        ))}
      </ListingCardGrid>,
    );
    await flushLayout();
    const grid = byTestId('g');
    expect(grid.getAttribute('role')).toBe('list');
    expect(grid.getAttribute('data-bloom-listing-card-grid')).toBe(String(columns));
    expect(getComputedStyle(grid).columnGap).toBe('24px');
    expect(getComputedStyle(grid).rowGap).toBe('40px');
    const items = grid.querySelectorAll(':scope > [role="listitem"]');
    expect(items).toHaveLength(5);
    expect(parseFloat(getComputedStyle(items[0] as HTMLElement).width)).toBe(Math.floor(cell * 100) / 100);
  });

  it('a fixed column count wins over the width', async () => {
    layoutWidth = 1440;
    mount(
      <ListingCardGrid columns={2} testID="g">
        <span>a</span>
      </ListingCardGrid>,
    );
    await flushLayout();
    expect(byTestId('g').getAttribute('data-bloom-listing-card-grid')).toBe('2');
  });
});

// ---------------------------------------------------------------------------

describe('WishlistCard', () => {
  it.each([
    [1, 1],
    [2, 2],
    [3, 3],
    [4, 4],
    [6, 4],
  ])('%i photos draw %i tiles in a square radius-16 cover', (count, tiles) => {
    const photos = Array.from({ length: count }, (_, i) => `https://example.test/w${i}.jpg`);
    mount(<WishlistCard name="Coast weekends" description="12 saved" photos={photos} onPress={() => {}} testID="w" />);
    const cover = byTestId('w-cover');
    expect(getComputedStyle(cover).aspectRatio).toBe('1');
    expect(getComputedStyle(cover).borderTopLeftRadius).toBe('16px');
    for (let i = 0; i < 6; i++) {
      expect(cover.innerHTML.includes(`w${i}.jpg`)).toBe(i < tiles);
    }
  });

  it('is a named button with onPress, a real link with href', () => {
    const onPress = jest.fn();
    mount(<WishlistCard name="Cabins" description="3 saved" photos={[]} onPress={onPress} testID="w" />);
    const button = byTestId('w');
    expect(button.getAttribute('role')).toBe('button');
    expect(button.getAttribute('aria-label')).toBe('Cabins, 3 saved');
    act(() => button.click());
    expect(onPress).toHaveBeenCalled();
    mount(<WishlistCard name="Cabins" photos={[]} href="/wishlists/cabins" testID="w" />);
    expect(byTestId('w').tagName).toBe('A');
    expect(byTestId('w').getAttribute('href')).toBe('/wishlists/cabins');
    expect(byTestId('w').getAttribute('aria-label')).toBe('Cabins');
  });
});
