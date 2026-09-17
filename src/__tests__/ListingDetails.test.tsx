/**
 * @jest-environment jsdom
 *
 * The listing-details parts rendered through the REAL react-native-web, so the
 * assertions read the emitted DOM: geometry, colours and accessibility
 * attributes. The width-driven layouts (`auto`) need `onLayout`, which
 * react-native-web drives from a ResizeObserver jsdom does not have — those are
 * pinned in `ListingDetailsLayout.test.tsx`; here every part is given an
 * explicit layout.
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import type { Theme } from '../theme/types';
import { RiKey2Line, RiShareLine, RiWifiLine } from '../icons/remix';
import {
  AmenityList,
  HostCard,
  ListingHeader,
  ListingHeaderAction,
  ListingHighlights,
  ListingPhotoGrid,
  ListingSection,
  ReviewCard,
  ReviewSummary,
} from '../listing-details';
import { resolveListingPalette } from '../listing-details/shared';

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

const queryTestId = (id: string) => container.querySelector(`[data-testid="${id}"]`);

function normalise(color: string): string {
  const probe = document.createElement('div');
  probe.style.color = color;
  return probe.style.color;
}

const PHOTOS = Array.from({ length: 7 }, (_, i) => ({
  source: `https://example.test/photo-${i}.jpg`,
  alt: `Room ${i + 1}`,
}));

// ---------------------------------------------------------------------------

describe('ListingPhotoGrid — grid', () => {
  it('draws a large photo plus a 2×2 grid, 8px apart, in a frame rounded 16 that clips', () => {
    mount(<ListingPhotoGrid photos={PHOTOS} layout="grid" onPressPhoto={() => {}} testID="g" />);
    const grid = byTestId('g-grid');
    const style = getComputedStyle(grid);
    expect(style.borderTopLeftRadius).toBe('16px');
    expect(style.borderBottomRightRadius).toBe('16px');
    expect(style.overflowX).toBe('hidden');
    expect(style.columnGap || style.gap).toBe('8px');
    expect(style.flexDirection).toBe('row');
    // Five tiles regardless of how many photos exist; the tiles themselves are square-cornered.
    expect(queryTestId('g-photo-4')).not.toBeNull();
    expect(queryTestId('g-photo-5')).toBeNull();
    expect(getComputedStyle(byTestId('g-photo-1')).borderTopLeftRadius).toBe('');
  });

  it('names each photo as a button and reports its index on press', () => {
    const onPressPhoto = jest.fn();
    mount(<ListingPhotoGrid photos={PHOTOS} layout="grid" onPressPhoto={onPressPhoto} testID="g" />);
    const third = byTestId('g-photo-2');
    expect(third.getAttribute('role')).toBe('button');
    expect(third.getAttribute('aria-label')).toBe('Room 3, photo 3 of 7');
    expect(byTestId('g-grid').getAttribute('aria-label')).toBe('Listing photos');
    act(() => third.click());
    expect(onPressPhoto).toHaveBeenCalledWith(2);
  });

  it('draws "Show all photos" only with onShowAll, and calls it', () => {
    mount(<ListingPhotoGrid photos={PHOTOS} layout="grid" testID="g" />);
    expect(queryTestId('g-show-all')).toBeNull();
    const onShowAll = jest.fn();
    mount(<ListingPhotoGrid photos={PHOTOS} layout="grid" onShowAll={onShowAll} showAllLabel="All 7" testID="g" />);
    const button = byTestId('g-show-all');
    expect(button.textContent).toContain('All 7');
    expect(button.querySelector('svg')).not.toBeNull();
    act(() => button.click());
    expect(onShowAll).toHaveBeenCalledTimes(1);
  });

  it.each([1, 2, 3, 4])('degrades to %i tile(s) for %i photo(s)', (count) => {
    mount(<ListingPhotoGrid photos={PHOTOS.slice(0, count)} layout="grid" onPressPhoto={() => {}} testID="g" />);
    for (let i = 0; i < count; i++) expect(queryTestId(`g-photo-${i}`)).not.toBeNull();
    expect(queryTestId(`g-photo-${count}`)).toBeNull();
  });

  it('without onPressPhoto a photo is a named image, not a button', () => {
    mount(<ListingPhotoGrid photos={PHOTOS} layout="grid" testID="g" />);
    const tile = byTestId('g-photo-0');
    expect(tile.getAttribute('role')).toBe('img');
    expect(tile.getAttribute('aria-label')).toBe('Room 1, photo 1 of 7');
  });

  it('the hover scrim is hidden at rest and painted neutral-950', () => {
    mount(<ListingPhotoGrid photos={PHOTOS} layout="grid" onPressPhoto={() => {}} testID="g" />);
    const scrim = byTestId('g-photo-0-scrim');
    expect(getComputedStyle(scrim).opacity).toBe('0');
    expect(getComputedStyle(scrim).backgroundColor).toBe(normalise(resolveListingPalette(theme).scrim));
    expect(scrim.getAttribute('data-bloom-listing-scrim')).toBe('');
  });
});

describe('ListingPhotoGrid — carousel', () => {
  it('pages the photos in a named carousel with an aria-hidden "1 / N" pill', () => {
    mount(<ListingPhotoGrid photos={PHOTOS} layout="carousel" onPressPhoto={() => {}} testID="g" />);
    const carousel = byTestId('g-carousel');
    expect(carousel.getAttribute('aria-roledescription')).toBe('carousel');
    expect(carousel.getAttribute('aria-label')).toBe('Listing photos');
    const counter = byTestId('g-counter');
    expect(counter.textContent).toBe('1 / 7');
    expect(counter.getAttribute('aria-hidden')).toBe('true');
    // No arrows or dots: the photo IS the control.
    expect(container.querySelector('[aria-label="Next slide"]')).toBeNull();
    expect(queryTestId('g-grid')).toBeNull();
  });

  it('formatCounter translates the pill; one photo draws none', () => {
    mount(
      <ListingPhotoGrid photos={PHOTOS} layout="carousel" formatCounter={(n, t) => `${n} de ${t}`} testID="g" />,
    );
    expect(byTestId('g-counter').textContent).toBe('1 de 7');
    mount(<ListingPhotoGrid photos={PHOTOS.slice(0, 1)} layout="carousel" testID="g" />);
    expect(queryTestId('g-counter')).toBeNull();
  });
});

describe('ListingHeader', () => {
  it('draws a level-1 heading, a joined subtitle and a meta row of rating and links', () => {
    const onPressReviews = jest.fn();
    mount(
      <ListingHeader
        title="Sunlit flat"
        subtitle={['Entire rental unit in Porto', '4 guests', '1 bath']}
        rating={4.92}
        reviewsLabel="128 reviews"
        onPressReviews={onPressReviews}
        location="Porto, Portugal"
        testID="h"
      />,
    );
    const title = byTestId('h-title');
    expect(title.tagName).toBe('H1');
    expect(title.getAttribute('role')).toBe('heading');
    expect(getComputedStyle(title).fontSize).toBe('24px');
    expect(byTestId('h-subtitle').textContent).toBe('Entire rental unit in Porto · 4 guests · 1 bath');
    expect(byTestId('h-rating').getAttribute('aria-label')).toBe('Rated 4.92 out of 5');

    const reviews = byTestId('h-reviews');
    expect(reviews.getAttribute('role')).toBe('link');
    expect(reviews.getAttribute('aria-label')).toBe('128 reviews');
    act(() => reviews.click());
    expect(onPressReviews).toHaveBeenCalled();
    // Without a handler the location is plain text, not a control.
    expect(byTestId('h-location').getAttribute('role')).toBeNull();
    expect(byTestId('h-meta').textContent).toBe('4.92·128 reviews·Porto, Portugal');
  });

  it('size="medium" is title-2', () => {
    mount(<ListingHeader title="Cottage" size="medium" testID="h" />);
    expect(getComputedStyle(byTestId('h-title')).fontSize).toBe('20px');
  });

  it('a toggled action carries aria-pressed and its name', () => {
    mount(<ListingHeaderAction label="Save" icon={RiShareLine} pressed onPress={() => {}} testID="a" />);
    const action = byTestId('a');
    expect(action.getAttribute('role')).toBe('button');
    expect(action.getAttribute('aria-label')).toBe('Save');
    expect(action.getAttribute('aria-pressed')).toBe('true');
    mount(<ListingHeaderAction label="Share" icon={RiShareLine} iconOnly testID="a" />);
    expect(byTestId('a').getAttribute('aria-pressed')).toBeNull();
    expect(byTestId('a').textContent).toBe('');
    expect(byTestId('a').getAttribute('aria-label')).toBe('Share');
  });
});

describe('ListingHighlights', () => {
  it('draws icon, title and description rows as a list', () => {
    mount(
      <ListingHighlights
        items={[{ icon: RiKey2Line, title: 'Self check-in', description: 'Use the lockbox.' }]}
        iconSize={32}
        testID="hl"
      />,
    );
    expect(byTestId('hl').getAttribute('role')).toBe('list');
    const row = byTestId('hl-item-0');
    expect(row.getAttribute('role')).toBe('listitem');
    expect(row.textContent).toBe('Self check-inUse the lockbox.');
    expect(row.querySelector('svg')?.getAttribute('width')).toBe('32');
  });
});

describe('AmenityList', () => {
  const items = [
    { icon: RiWifiLine, label: 'Wifi' },
    { icon: RiKey2Line, label: 'Lockbox' },
    { icon: RiWifiLine, label: 'Air conditioning', available: false },
  ];

  it('strikes an unavailable amenity through, mutes its icon and prefixes its name', () => {
    mount(<AmenityList items={items} columns={1} testID="am" />);
    const palette = resolveListingPalette(theme);
    const label = byTestId('am-item-2-label');
    expect(getComputedStyle(label).textDecorationLine || getComputedStyle(label).textDecoration).toContain(
      'line-through',
    );
    expect(byTestId('am-item-2').getAttribute('aria-label')).toBe('Unavailable: Air conditioning');
    expect(byTestId('am-item-2').querySelector('svg path')?.getAttribute('fill')).toBe(palette.muted);
    expect(byTestId('am-item-0').getAttribute('aria-label')).toBe('Wifi');
    expect(byTestId('am-item-0').querySelector('svg path')?.getAttribute('fill')).toBe(palette.text);
  });

  it('limit hides the rest and "Show all N amenities" counts `total`', () => {
    const onShowAll = jest.fn();
    mount(<AmenityList items={items} columns={1} limit={2} total={42} onShowAll={onShowAll} testID="am" />);
    expect(queryTestId('am-item-2')).toBeNull();
    const button = byTestId('am-show-all');
    expect(button.textContent).toContain('Show all 42 amenities');
    act(() => button.click());
    expect(onShowAll).toHaveBeenCalled();
  });

  it('no button when everything is drawn', () => {
    mount(<AmenityList items={items} columns={1} onShowAll={() => {}} testID="am" />);
    expect(queryTestId('am-show-all')).toBeNull();
  });

  it('one column is full width', () => {
    mount(<AmenityList items={items} columns={1} testID="am" />);
    expect(getComputedStyle(byTestId('am-item-0')).width).toBe('100%');
  });
});

describe('HostCard', () => {
  const stats = [
    { value: '214', label: 'Reviews' },
    { value: '4.92', label: 'Rating', star: true },
    { value: '7', label: 'Years hosting' },
  ];

  it('a verified badge, hairlines between the stats, and a message button', () => {
    const onMessage = jest.fn();
    mount(<HostCard name="Marta" verified label="Top host" stats={stats} onMessage={onMessage} testID="host" />);
    const badge = byTestId('host-verified');
    expect(badge.getAttribute('aria-label')).toBe('Verified');
    expect(getComputedStyle(badge).backgroundColor).toBe(normalise(theme.colors.primary));

    expect(getComputedStyle(byTestId('host-stat-0')).borderTopWidth).toBe('0px');
    const second = getComputedStyle(byTestId('host-stat-1'));
    expect(second.borderTopWidth).toBe('1px');
    expect(second.borderTopColor).toBe(normalise(resolveListingPalette(theme).hairline));
    expect(byTestId('host-stat-1').querySelector('svg')).not.toBeNull();

    const card = getComputedStyle(byTestId('host-card'));
    expect(card.borderTopLeftRadius).toBe('20px');

    act(() => byTestId('host-message').click());
    expect(onMessage).toHaveBeenCalled();
    expect(byTestId('host-message').textContent).toContain('Message host');
  });

  it('a pressable card reads as one button naming the host and the stats', () => {
    mount(<HostCard name="Marta" label="Top host" stats={stats} onPressProfile={() => {}} testID="host" />);
    const card = byTestId('host-card');
    expect(card.getAttribute('role')).toBe('button');
    expect(card.getAttribute('aria-label')).toBe('Marta, Top host, 214 Reviews, 4.92 Rating, 7 Years hosting');
  });

  it('without a handler the card is not a control and there is no button', () => {
    mount(<HostCard name="Duarte" testID="host" />);
    expect(byTestId('host-card').getAttribute('role')).toBeNull();
    expect(queryTestId('host-message')).toBeNull();
    expect(queryTestId('host-verified')).toBeNull();
  });
});

describe('ReviewSummary', () => {
  it('a named score, category progressbars and a 5→1 distribution', () => {
    mount(
      <ReviewSummary
        rating={4.9}
        title="Loved by guests"
        categories={[
          { label: 'Cleanliness', value: 4.9, icon: RiKey2Line },
          { label: 'Value', value: 4.5, display: '4.5' },
        ]}
        distribution={[
          { label: '5', value: 0.8 },
          { label: '4', value: 0.2 },
        ]}
        testID="s"
      />,
    );
    const score = byTestId('s-score');
    expect(score.getAttribute('role')).toBe('img');
    expect(score.getAttribute('aria-label')).toBe('Rated 4.9 out of 5, Loved by guests');
    expect(getComputedStyle(byTestId('s-value')).fontSize).toBe('48px');

    const cleanliness = byTestId('s-category-0-bar');
    expect(cleanliness.getAttribute('role')).toBe('progressbar');
    expect(cleanliness.getAttribute('aria-valuenow')).toBe('4.9');
    expect(cleanliness.getAttribute('aria-valuetext')).toBe('4.9');

    const five = byTestId('s-distribution-0-bar');
    expect(five.getAttribute('aria-valuemax')).toBe('1');
    expect(five.getAttribute('aria-valuenow')).toBe('0.8');
    expect(byTestId('s-distribution').textContent).toContain('Overall rating');
  });
});

describe('ReviewCard', () => {
  it('stars as one named image, the date, and a host response', () => {
    mount(
      <ReviewCard
        name="Inês"
        subtitle="Lisbon"
        rating={4}
        date="August 2026"
        text="Lovely."
        hostResponse={{ title: 'Response from Marta', text: 'Thank you!' }}
        testID="rv"
      />,
    );
    const stars = byTestId('rv-stars');
    expect(stars.getAttribute('role')).toBe('img');
    expect(stars.getAttribute('aria-label')).toBe('Rated 4 out of 5');
    const palette = resolveListingPalette(theme);
    const fills = Array.from(stars.querySelectorAll('svg path')).map((p) => p.getAttribute('fill'));
    expect(fills).toEqual([palette.text, palette.text, palette.text, palette.text, palette.starEmpty]);
    expect(byTestId('rv-response').textContent).toBe('Response from MartaThank you!');
    expect(getComputedStyle(byTestId('rv-response')).borderTopLeftRadius).toBe('12px');
  });

  it('clamps the text to numberOfLines and draws no toggle before it is measured as clamped', () => {
    mount(<ReviewCard name="Inês" text="Short." numberOfLines={3} testID="rv" />);
    expect(byTestId('rv-text').getAttribute('style')).toContain('-webkit-line-clamp: 3');
    expect(queryTestId('rv-toggle')).toBeNull();
  });
});

describe('ListingSection', () => {
  it('a level-2 heading, a top hairline and 32 above and below', () => {
    mount(
      <ListingSection title="What this place offers" subtitle="42 amenities" testID="sec">
        {null}
      </ListingSection>,
    );
    const style = getComputedStyle(byTestId('sec'));
    expect(style.borderTopWidth).toBe('1px');
    expect(style.borderTopColor).toBe(normalise(resolveListingPalette(theme).hairline));
    expect(style.paddingTop).toBe('32px');
    expect(style.paddingBottom).toBe('32px');
    const title = byTestId('sec-title');
    expect(title.tagName).toBe('H2');
    expect(getComputedStyle(title).fontSize).toBe('18px');
  });

  it('divider={false} drops the hairline; size="small" is headline', () => {
    mount(<ListingSection title="Rules" size="small" divider={false} testID="sec" />, 'dark');
    expect(getComputedStyle(byTestId('sec')).borderTopWidth).toBe('0px');
    expect(getComputedStyle(byTestId('sec-title')).fontSize).toBe('16px');
  });
});

describe('palette', () => {
  it.each(['light', 'dark'] as const)('reads the theme text colours (%s)', (mode) => {
    mount(<ListingSection title="x" testID="sec" />, mode);
    expect(getComputedStyle(byTestId('sec-title')).color).toBe(normalise(theme.colors.text));
    const palette = resolveListingPalette(theme);
    expect(palette.hairline).not.toBe(palette.card);
  });
});
