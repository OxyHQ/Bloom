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
  describePriceLine,
  DOT_EDGE_SIZE,
  DOT_SIZE,
  dotWindow,
  listingGridColumns,
  locationText,
  resolveListingCardPaint,
  resolvePhoto,
  resolvePriceLines,
  LISTING_CARD_CSS,
  PHOTO_ZOOM_SCALE,
  STATUS_WASH_OPACITY,
  statusLabelFor,
} from '../listing-card/shared';
import { RiDropLine, RiFolderLine, RiHotelBedLine, RiRulerLine } from '../icons/remix';
import { resolveOfferingBadgePaint } from '../offering-badge/shared';
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
    [800, 2, (799 - 24) / 2],
    [1100, 3, (1099 - 48) / 3],
    [1440, 4, (1439 - 72) / 4],
  ])('at %ipx: %i columns, cells sized from the width (a pixel kept back for rounding) with 24/40 gaps', async (width, columns, cell) => {
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

  it('keeps a row whole when the measured width was rounded UP from a fraction', async () => {
    // A column 591.69px wide (48% of a row) measures 592 on web.
    layoutWidth = 592;
    mount(
      <ListingCardGrid columns={2} testID="g">
        <span>a</span>
        <span>b</span>
      </ListingCardGrid>,
    );
    await flushLayout();
    const items = byTestId('g').querySelectorAll(':scope > [role="listitem"]');
    const cell = parseFloat(getComputedStyle(items[0] as HTMLElement).width);
    expect(cell * 2 + 24).toBeLessThanOrEqual(591.5);
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

// ---------------------------------------------------------------------------
//  Housing: offerings, price lines, facts, location, status, compact density
// ---------------------------------------------------------------------------

const home = {
  photos: PHOTOS.slice(0, 3),
  title: 'Townhouse with a patio',
  address: 'Talmar Hill',
  offerings: ['sale', 'long_term_rent'] as const,
  priceLines: [
    { price: '€1,250', unit: '/ month' },
    { price: '€240,000', secondary: '€3,200/m²', originalPrice: '€255,000' },
  ],
  facts: [
    { icon: RiHotelBedLine, label: '3', accessibilityLabel: '3 bedrooms' },
    { icon: RiDropLine, label: '2', accessibilityLabel: '2 bathrooms' },
    { icon: RiRulerLine, label: '110 m²' },
  ],
};

describe('housing helpers', () => {
  it('resolvePriceLines: priceLines win; otherwise the legacy single line; empty without a price', () => {
    expect(resolvePriceLines({ price: '€124', priceUnit: 'night', originalPrice: '€150' })).toEqual([
      { price: '€124', unit: 'night', originalPrice: '€150' },
    ]);
    expect(resolvePriceLines({ price: '€1', priceLines: [{ price: '€2' }] })).toEqual([{ price: '€2' }]);
    expect(resolvePriceLines({})).toEqual([]);
    expect(describePriceLine({ price: '€240,000', secondary: '€3,200/m²', originalPrice: '€255,000' })).toBe(
      '€240,000, €3,200/m², originally €255,000',
    );
  });

  it('locationText and statusLabelFor', () => {
    expect(locationText('Talmar Hill', true)).toBe('Talmar Hill · Approximate location');
    expect(locationText(undefined, true, 'Ubicación aproximada')).toBe('Ubicación aproximada');
    expect(locationText('Talmar Hill', false)).toBe('Talmar Hill');
    expect(locationText(undefined, false)).toBeNull();
    expect(statusLabelFor('available')).toBeNull();
    expect(statusLabelFor(undefined)).toBeNull();
    expect(statusLabelFor('sold')).toBe('Sold');
    expect(statusLabelFor('rented', 'Alquilado')).toBe('Alquilado');
  });
});

describe('ListingCard — housing', () => {
  it('stacks the price lines: struck original, semibold price, unit, secondary in text-secondary', () => {
    mount(<ListingCard {...home} testID="c" />);
    const price = byTestId('c-price');
    expect(byTestId('c-price-0').textContent).toBe('€1,250 / month');
    expect(byTestId('c-price-1').textContent).toBe('€255,000 €240,000 · €3,200/m²');
    const spans = Array.from(byTestId('c-price-1').querySelectorAll('span')) as HTMLElement[];
    const secondary = spans.find((el) => el.textContent === ' · €3,200/m²') as HTMLElement;
    const amount = spans.find((el) => el.textContent === '€240,000') as HTMLElement;
    const original = spans.find((el) => el.textContent === '€255,000') as HTMLElement;
    expect(getComputedStyle(secondary).color).toBe(normalise(theme.colors.textSecondary));
    expect(getComputedStyle(amount).fontWeight).toBe('600');
    expect(getComputedStyle(original).textDecorationLine || getComputedStyle(original).textDecoration).toContain(
      'line-through',
    );
    // The block sits 4 under the text above it; one line per price.
    expect(getComputedStyle(price).marginTop).toBe('4px');
    expect(price.children).toHaveLength(2);
  });

  it('priceLines replace the legacy price props', () => {
    mount(<ListingCard {...home} price="€9" priceUnit="night" testID="c" />);
    expect(byTestId('c-link').textContent).not.toContain('€9 night');
  });

  it('facts: icons hidden, labels in body-2 text-secondary, one clipped wrapping row', () => {
    mount(<ListingCard {...home} testID="c" />);
    const facts = byTestId('c-facts');
    const style = getComputedStyle(facts);
    expect(style.flexWrap).toBe('wrap');
    expect(style.height).toBe('18px');
    expect(style.overflowX === 'hidden' || style.overflow === 'hidden').toBe(true);
    expect(style.columnGap).toBe('12px');
    expect(Array.from(facts.children).map((el) => el.textContent)).toEqual(['3', '2', '110 m²']);
    const firstIcon = byTestId('c-facts-0').querySelector('[aria-hidden="true"] svg');
    expect(firstIcon?.getAttribute('width')).toBe('16');
    const text = byTestId('c-facts-2').querySelector('[dir="auto"]') as HTMLElement;
    expect(getComputedStyle(text).fontSize).toBe('13px');
    expect(getComputedStyle(text).color).toBe(normalise(theme.colors.textSecondary));
  });

  it('address with a pin, and "Approximate location"', () => {
    mount(<ListingCard {...home} approximateLocation testID="c" />);
    const location = byTestId('c-location');
    expect(location.textContent).toBe('Talmar Hill · Approximate location');
    expect(location.querySelector('[aria-hidden="true"] svg')).not.toBeNull();
    mount(<ListingCard {...home} address={undefined} approximateLocation approximateLocationLabel="Zona aproximada" testID="c" />);
    expect(byTestId('c-location').textContent).toBe('Zona aproximada');
  });

  it('offerings are onMedia badges in the top-left slot after the badge, outside the link, de-duplicated', () => {
    mount(<ListingCard {...home} offerings={['sale', 'long_term_rent', 'sale']} badge="New build" testID="c" />);
    const slot = byTestId('c-slot');
    expect(Array.from(slot.children).map((el) => el.textContent)).toEqual(['New build', 'For sale', 'For rent']);
    expect(byTestId('c-link').contains(slot)).toBe(false);
    const paint = resolveOfferingBadgePaint(theme, 'sale', 'onMedia');
    expect(getComputedStyle(byTestId('c-offering-sale')).backgroundColor).toBe(normalise(paint.background));
    expect(getComputedStyle(slot).flexWrap).toBe('wrap');
    expect(getComputedStyle(slot).top).toBe('12px');
    expect(getComputedStyle(slot).left).toBe('12px');
  });

  it('offering labels are overridable', () => {
    mount(<ListingCard {...home} offeringLabels={{ sale: 'En venta' }} testID="c" />);
    expect(byTestId('c-offering-sale').textContent).toBe('En venta');
    expect(byTestId('c-link').getAttribute('aria-label')).toContain('En venta, For rent');
  });

  it('composes the housing name: title, status, badge, offerings, location, prices, facts', () => {
    mount(<ListingCard {...home} status="reserved" href="/homes/talmar" testID="c" />);
    expect(byTestId('c-link').getAttribute('aria-label')).toBe(
      'Townhouse with a patio, Reserved, For sale, For rent, Talmar Hill, €1,250 / month, €240,000, €3,200/m², originally €255,000, 3 bedrooms, 2 bathrooms, 110 m²',
    );
  });

  it.each(['light', 'dark'] as const)('a status washes the photo and draws the inverted pill first (%s)', (mode) => {
    mount(<ListingCard {...home} status="sold" testID="c" />, mode);
    const paint = resolveListingCardPaint(theme);
    const wash = byTestId('c-wash');
    expect(byTestId('c-photo').contains(wash)).toBe(true);
    expect(getComputedStyle(wash).backgroundColor).toBe(normalise(theme.colors.background));
    expect(getComputedStyle(wash).opacity).toBe(String(STATUS_WASH_OPACITY));
    const pill = byTestId('c-status');
    expect(pill.textContent).toBe('Sold');
    expect(byTestId('c-slot').firstElementChild).toBe(pill);
    expect(getComputedStyle(pill).backgroundColor).toBe(normalise(paint.statusFill));
    expect(getComputedStyle(pill.querySelector('[dir="auto"]') as HTMLElement).color).toBe(normalise(paint.statusText));
  });

  it('available (or no status) draws neither wash nor pill', () => {
    mount(<ListingCard {...home} status="available" testID="c" />);
    expect(maybe('c-wash')).toBeNull();
    expect(maybe('c-status')).toBeNull();
  });
});

describe('ListingCard — compact density', () => {
  it('a row: 112 square thumbnail with radius 12, the text beside it, one named link', () => {
    mount(<ListingCard {...home} density="compact" href="/homes/talmar" testID="c" />);
    const link = byTestId('c-link');
    expect(link.tagName).toBe('A');
    expect(getComputedStyle(link).flexDirection).toBe('row');
    const photo = getComputedStyle(byTestId('c-photo'));
    expect(photo.width).toBe('112px');
    expect(photo.height).toBe('112px');
    expect(photo.borderTopLeftRadius).toBe('12px');
    expect(byTestId('c').getAttribute('data-bloom-listing-card')).toBe('compact');
    // One static photo: no dots, no arrows, no track.
    expect(container.querySelectorAll('[data-bloom-listing-card-dot], [data-bloom-listing-card-track]')).toHaveLength(0);
    expect(link.getAttribute('aria-label')).toContain('Townhouse with a patio, For sale, For rent');
  });

  it('offerings are small TINTED badges above the title, inside the text column', () => {
    mount(<ListingCard {...home} density="compact" status="reserved" testID="c" />);
    const slot = byTestId('c-slot');
    expect(byTestId('c-link').contains(slot)).toBe(true);
    expect(Array.from(slot.children).map((el) => el.textContent)).toEqual(['Reserved', 'For sale', 'For rent']);
    const badge = byTestId('c-offering-sale');
    expect(getComputedStyle(badge).height).toBe('20px');
    expect(getComputedStyle(badge).backgroundColor).toBe(
      normalise(resolveOfferingBadgePaint(theme, 'sale', 'tinted').background),
    );
    expect(byTestId('c-photo').contains(byTestId('c-wash'))).toBe(true);
    // Facts at the small size.
    expect(byTestId('c-facts-0').querySelector('svg')?.getAttribute('width')).toBe('14');
  });

  it('the heart is over the thumbnail, a sibling of the link', () => {
    const onPress = jest.fn();
    const onFavoriteChange = jest.fn();
    mount(<ListingCard {...home} density="compact" onPress={onPress} favorite={false} onFavoriteChange={onFavoriteChange} testID="c" />);
    const heart = byTestId('c-favorite');
    expect(byTestId('c-link').contains(heart)).toBe(false);
    expect(getComputedStyle(heart.parentElement as HTMLElement).left).toBe('78px');
    act(() => heart.click());
    expect(onFavoriteChange).toHaveBeenCalledWith(true);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('keeps the legacy price props working', () => {
    mount(<ListingCard {...stay} density="compact" testID="c" />);
    expect(byTestId('c-price-0').textContent).toBe('€124 night');
  });

  it('loading draws a compact skeleton', () => {
    mount(<ListingCard {...home} density="compact" loading testID="c" />);
    const el = byTestId('c');
    expect(el.getAttribute('aria-busy')).toBe('true');
    expect(getComputedStyle(el).flexDirection).toBe('row');
    expect(getComputedStyle(el.firstElementChild as HTMLElement).width).toBe('112px');
  });
});

// ---------------------------------------------------------------------------
//  The pointer shortcuts: hover zoom, long press, right-click
// ---------------------------------------------------------------------------

describe('ListingCard — hover zoom', () => {
  it('marks the card for the zoom only when hoverZoom is set', async () => {
    mount(<ListingCard {...stay} href="/s" hoverZoom testID="c" />);
    await flushLayout();
    expect(byTestId('c').hasAttribute('data-bloom-listing-card-zoom')).toBe(true);
    mount(<ListingCard {...stay} href="/s" testID="c" />);
    await flushLayout();
    expect(byTestId('c').hasAttribute('data-bloom-listing-card-zoom')).toBe(false);
  });

  it('marks every mounted photo, so the sheet has something to scale', async () => {
    mount(<ListingCard {...stay} href="/s" hoverZoom testID="c" />);
    await flushLayout();
    const photos = byTestId('c-photo').querySelectorAll('[data-bloom-listing-card-photo]');
    expect(photos.length).toBeGreaterThan(0);
  });

  it('the compact density never takes the zoom, whatever the prop says', async () => {
    mount(<ListingCard {...stay} href="/s" density="compact" hoverZoom testID="c" />);
    await flushLayout();
    expect(byTestId('c').hasAttribute('data-bloom-listing-card-zoom')).toBe(false);
  });

  /**
   * jsdom applies no stylesheet, so the RULE is the subject: the scale is
   * behind a hover query, and reduced motion turns it off rather than leaving
   * it snapping. Read the sheet, because an inline style could never express
   * either condition.
   */
  it('the rule is hover-gated and reduced-motion-safe', () => {
    const zoomed = '[data-bloom-listing-card][data-bloom-listing-card-zoom]';
    expect(LISTING_CARD_CSS).toContain(
      `${zoomed}:hover [data-bloom-listing-card-photo] {\n    transform: scale(${PHOTO_ZOOM_SCALE});`,
    );
    const hoverBlock = LISTING_CARD_CSS.slice(
      LISTING_CARD_CSS.indexOf(`${zoomed}:hover`),
    );
    expect(
      LISTING_CARD_CSS.slice(0, LISTING_CARD_CSS.indexOf(`${zoomed}:hover`)),
    ).toContain('@media (any-hover: hover)');
    expect(hoverBlock.length).toBeGreaterThan(0);
    const reduced = LISTING_CARD_CSS.slice(
      LISTING_CARD_CSS.indexOf('@media (prefers-reduced-motion: reduce)'),
    );
    expect(reduced).toContain('data-bloom-listing-card-zoom');
    expect(reduced).toContain('transform: none;');
  });
});

describe('ListingCard — the press shortcut', () => {
  it('a right-click calls onContextMenu and keeps the browser menu shut', async () => {
    const onContextMenu = jest.fn();
    mount(<ListingCard {...stay} href="/s" onContextMenu={onContextMenu} testID="c" />);
    await flushLayout();
    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    act(() => {
      byTestId('c-link').dispatchEvent(event);
    });
    expect(onContextMenu).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
  });

  it('without onContextMenu the browser keeps its own menu', async () => {
    mount(<ListingCard {...stay} href="/s" testID="c" />);
    await flushLayout();
    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    act(() => {
      byTestId('c-link').dispatchEvent(event);
    });
    expect(event.defaultPrevented).toBe(false);
  });

  it('a long press calls onLongPress and does not also open the stay', async () => {
    const onPress = jest.fn();
    const onLongPress = jest.fn();
    mount(<ListingCard {...stay} onPress={onPress} onLongPress={onLongPress} testID="c" />);
    await flushLayout();
    const link = byTestId('c-link');
    // Real timers, not fake ones: react-native-web's press responder schedules
    // the long press itself, and driving it with fake timers inside `act`
    // deadlocks the render loop.
    await act(async () => {
      link.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0 }));
      await new Promise((resolve) => setTimeout(resolve, 700));
    });
    await act(async () => {
      link.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, button: 0 }));
    });
    expect(onLongPress).toHaveBeenCalledTimes(1);
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('WishlistCard — icon, colour and the empty cover', () => {
  it('draws the glyph beside the name, decorative, in `color`', () => {
    mount(
      <WishlistCard
        name="Coast weekends"
        description="12 saved"
        photos={['https://example.test/w0.jpg']}
        icon={RiFolderLine}
        color="rgb(224, 81, 107)"
        onPress={() => {}}
        testID="w"
      />,
    );
    const icon = byTestId('w-icon');
    expect(icon.getAttribute('aria-hidden')).toBe('true');
    const svg = icon.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('16');
    expect(svg?.querySelector('path')?.getAttribute('fill')).toBe('rgb(224, 81, 107)');
    // The glyph is decorative, so the name a screen reader reads is unchanged.
    expect(byTestId('w').getAttribute('aria-label')).toBe('Coast weekends, 12 saved');
  });

  it('no icon: nothing is drawn and the name keeps its place', () => {
    mount(<WishlistCard name="Cabins" photos={['https://example.test/w0.jpg']} onPress={() => {}} testID="w" />);
    expect(maybe('w-icon')).toBeNull();
    expect(byTestId('w').textContent).toBe('Cabins');
  });

  it('the glyph falls back to the secondary text colour without `color`', () => {
    mount(
      <WishlistCard name="Cabins" photos={[]} icon={RiFolderLine} onPress={() => {}} testID="w" />,
    );
    // The attribute carries the token verbatim; `normalise` is for computed styles.
    expect(byTestId('w-icon').querySelector('svg path')?.getAttribute('fill')).toBe(
      theme.colors.textSecondary,
    );
  });

  it('no photos: the cover holds `empty`, tinted by `color`', () => {
    mount(
      <WishlistCard
        name="Someday"
        photos={[]}
        color="rgb(122, 90, 248)"
        empty={<RiFolderLine width={28} height={28} fill="#FFFFFF" />}
        onPress={() => {}}
        testID="w"
      />,
    );
    const slot = byTestId('w-empty');
    expect(getComputedStyle(slot).backgroundColor).toBe('rgb(122, 90, 248)');
    expect(slot.querySelector('svg')?.getAttribute('width')).toBe('28');
  });

  it('no photos and no `empty`: the placeholder square, as before', () => {
    mount(<WishlistCard name="Someday" photos={[]} onPress={() => {}} testID="w" />);
    const slot = byTestId('w-empty');
    expect(slot.querySelector('svg')).toBeNull();
    expect(getComputedStyle(slot).backgroundColor).toBe(
      normalise(resolveListingCardPaint(theme).photoPlaceholder),
    );
  });

  it('with photos there is no empty slot at all', () => {
    mount(
      <WishlistCard name="Cabins" photos={['https://example.test/w0.jpg']} onPress={() => {}} testID="w" />,
    );
    expect(maybe('w-empty')).toBeNull();
  });
});
