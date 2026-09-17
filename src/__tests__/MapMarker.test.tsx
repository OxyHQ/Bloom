/**
 * @jest-environment jsdom
 *
 * The map pieces, rendered through the REAL react-native-web so the assertions
 * read the emitted DOM: names, pressed/checked state, geometry and paint.
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { resolveButtonRamps } from '../button/shared';
import { ImageResolverProvider } from '../image-resolver';
import {
  MapClusterMarker,
  MapListingPreview,
  MapPriceMarker,
  MapSearchAreaButton,
} from '../map-marker';
import { resolveMapMarkerPaint, type MapMarkerPaint } from '../map-marker/shared';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import type { Theme } from '../theme/types';
import { useTheme } from '../theme/use-theme';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;
let theme: Theme;
let paint: MapMarkerPaint;

function ReadTheme() {
  theme = useTheme();
  paint = resolveMapMarkerPaint(theme);
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

function textColor(el: HTMLElement): string {
  return getComputedStyle(el.querySelector('[dir="auto"]') as HTMLElement).color;
}

describe('resolveMapMarkerPaint', () => {
  it.each(['light', 'dark'] as const)('inverts the active pill against the surface (%s)', (mode) => {
    mount(<></>, mode);
    const { neutral: n } = resolveButtonRamps(theme);
    expect(paint.activeFill).toBe(theme.colors.text);
    expect(paint.surface).toBe(mode === 'dark' ? n[800] : theme.colors.card);
    expect(paint.activeLabel).toBe(mode === 'dark' ? n[900] : theme.colors.card);
    expect(paint.visitedFill).not.toBe(paint.surface);
  });
});

describe('MapPriceMarker', () => {
  it('is a named 28px pill button, aria-pressed only when active', () => {
    const onPress = jest.fn();
    mount(<MapPriceMarker price="€120" accessibilityLabel="€120 per night, Valdoria" onPress={onPress} testID="m" />);
    const el = byTestId('m');
    expect(el.getAttribute('role')).toBe('button');
    expect(el.getAttribute('aria-label')).toBe('€120 per night, Valdoria');
    expect(el.getAttribute('aria-pressed')).toBe('false');
    expect(el.textContent).toBe('€120');
    const style = getComputedStyle(el);
    expect(style.height).toBe('28px');
    expect(style.borderTopLeftRadius).toBe('14px');
    act(() => el.click());
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('defaults its name to the price', () => {
    mount(<MapPriceMarker price="€86" testID="m" />);
    expect(byTestId('m').getAttribute('aria-label')).toBe('€86');
  });

  it.each(['light', 'dark'] as const)('paints default, active and visited from the palette (%s)', (mode) => {
    mount(
      <>
        <MapPriceMarker price="€1" testID="d" />
        <MapPriceMarker price="€2" state="active" testID="a" />
        <MapPriceMarker price="€3" state="visited" testID="v" />
      </>,
      mode,
    );
    expect(getComputedStyle(byTestId('d')).backgroundColor).toBe(normalise(paint.surface));
    expect(getComputedStyle(byTestId('d')).borderTopColor).toBe(normalise(paint.border));
    expect(textColor(byTestId('d'))).toBe(normalise(paint.label));

    expect(byTestId('a').getAttribute('aria-pressed')).toBe('true');
    expect(getComputedStyle(byTestId('a')).backgroundColor).toBe(normalise(paint.activeFill));
    expect(textColor(byTestId('a'))).toBe(normalise(paint.activeLabel));

    expect(byTestId('v').getAttribute('aria-pressed')).toBe('false');
    expect(getComputedStyle(byTestId('v')).backgroundColor).toBe(normalise(paint.visitedFill));
    expect(textColor(byTestId('v'))).toBe(normalise(paint.visitedLabel));
  });

  it('draws a 12px heart only when saved', () => {
    mount(<MapPriceMarker price="€1" testID="m" />);
    expect(query('m-saved')).toBeNull();
    mount(<MapPriceMarker price="€1" saved testID="m" />);
    const svg = byTestId('m-saved').querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('12');
  });
});

describe('MapClusterMarker', () => {
  it('is a 36px round named button with the count', () => {
    mount(<MapClusterMarker count={14} testID="c" />);
    const el = byTestId('c');
    expect(el.getAttribute('role')).toBe('button');
    expect(el.getAttribute('aria-label')).toBe('14 stays');
    expect(el.textContent).toBe('14');
    expect(getComputedStyle(el).height).toBe('36px');
    expect(getComputedStyle(el).minWidth).toBe('36px');
    expect(getComputedStyle(el).borderTopLeftRadius).toBe('18px');
  });

  it('active is inverted and pressed; a caller name wins', () => {
    mount(<MapClusterMarker count="99+" state="active" accessibilityLabel="Over 99 homes" testID="c" />);
    const el = byTestId('c');
    expect(el.getAttribute('aria-pressed')).toBe('true');
    expect(el.getAttribute('aria-label')).toBe('Over 99 homes');
    expect(getComputedStyle(el).backgroundColor).toBe(normalise(paint.activeFill));
  });
});

describe('MapListingPreview', () => {
  const base = {
    title: 'Cabin by the pines',
    rating: 4.92,
    reviewCount: 128,
    subtitle: 'Entire cabin · 2 beds',
    price: '€120',
    priceDetail: 'night',
  };

  it('a 327 card with a 200px photo, title, rating, subtitle and price line', () => {
    mount(<MapListingPreview {...base} image="https://example.com/a.jpg" testID="p" />);
    const card = byTestId('p');
    expect(getComputedStyle(card).width).toBe('327px');
    expect(getComputedStyle(card).flexDirection).toBe('column');
    expect(getComputedStyle(card).borderTopLeftRadius).toBe('16px');
    expect(getComputedStyle(card).backgroundColor).toBe(normalise(paint.surface));
    expect(getComputedStyle(byTestId('p-image')).height).toBe('200px');
    expect(card.textContent).toContain('Cabin by the pines');
    expect(card.textContent).toContain('Entire cabin · 2 beds');
    expect(card.textContent).toContain('€120 night');
    expect(card.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe('Rated 4.92 out of 5, 128 reviews');
    // The card itself never clips, so the native shadow survives.
    const clips = (el: HTMLElement) =>
      [el.style.overflow, el.style.overflowX, getComputedStyle(el).overflow, getComputedStyle(el).overflowX].includes('hidden');
    expect(clips(card)).toBe(false);
    expect(clips(byTestId('p-image'))).toBe(true);
  });

  it('compact puts the photo on the left', () => {
    mount(<MapListingPreview {...base} layout="compact" testID="p" />);
    expect(getComputedStyle(byTestId('p')).flexDirection).toBe('row');
    expect(getComputedStyle(byTestId('p-image')).width).toBe('112px');
  });

  it('resolves an image id through the ImageResolver', () => {
    const resolver = jest.fn(() => 'https://cdn.example.com/resolved.jpg');
    mount(
      <ImageResolverProvider value={resolver}>
        <MapListingPreview {...base} image="photo-42" imageVariant="thumb" testID="p" />
      </ImageResolverProvider>,
    );
    expect(resolver).toHaveBeenCalledWith('photo-42', 'thumb');
  });

  it('close, heart and open are separate named buttons, shown only with their handlers', () => {
    mount(<MapListingPreview {...base} testID="p" />);
    expect(query('p-close')).toBeNull();
    expect(query('p-favorite')).toBeNull();
    expect(query('p-open')).toBeNull();

    const onClose = jest.fn();
    const onPress = jest.fn();
    const onFavoriteChange = jest.fn();
    mount(
      <MapListingPreview
        {...base}
        onClose={onClose}
        onPress={onPress}
        favorite={false}
        onFavoriteChange={onFavoriteChange}
        testID="p"
      />,
    );
    const open = byTestId('p-open');
    expect(open.getAttribute('role')).toBe('button');
    expect(open.getAttribute('aria-label')).toBe('Cabin by the pines');
    // No button nests inside another.
    expect(open.contains(byTestId('p-close'))).toBe(false);
    expect(open.contains(byTestId('p-favorite'))).toBe(false);

    const fav = byTestId('p-favorite');
    expect(fav.getAttribute('aria-label')).toBe('Save');
    expect(fav.getAttribute('aria-pressed')).toBe('false');
    expect(getComputedStyle(fav).width).toBe('24px');
    act(() => fav.click());
    expect(onFavoriteChange).toHaveBeenCalledWith(true);

    expect(byTestId('p-close').getAttribute('aria-label')).toBe('Close');
    act(() => byTestId('p-close').click());
    expect(onClose).toHaveBeenCalledTimes(1);
    act(() => open.click());
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('a saved listing presses the heart and paints it red', () => {
    mount(<MapListingPreview {...base} favorite onFavoriteChange={() => {}} testID="p" />);
    const fav = byTestId('p-favorite');
    expect(fav.getAttribute('aria-pressed')).toBe('true');
    expect(fav.querySelector('path')?.getAttribute('fill') ?? fav.querySelector('svg')?.getAttribute('fill')).toBe(
      paint.heart,
    );
  });
});

describe('MapSearchAreaButton', () => {
  it('toggle: a named 40px pill checkbox with aria-checked', () => {
    const onCheckedChange = jest.fn();
    mount(<MapSearchAreaButton variant="toggle" checked={false} onCheckedChange={onCheckedChange} testID="s" />);
    const el = byTestId('s');
    expect(el.getAttribute('role')).toBe('checkbox');
    expect(el.getAttribute('aria-checked')).toBe('false');
    expect(el.getAttribute('aria-label')).toBe('Search as I move the map');
    expect(getComputedStyle(el).height).toBe('40px');
    expect(getComputedStyle(el).borderTopLeftRadius).toBe('20px');
    act(() => el.click());
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    mount(<MapSearchAreaButton variant="toggle" checked onCheckedChange={onCheckedChange} testID="s" />);
    expect(byTestId('s').getAttribute('aria-checked')).toBe('true');
  });

  it('button: "Search this area", and inert when disabled', () => {
    const onPress = jest.fn();
    mount(<MapSearchAreaButton onPress={onPress} testID="s" />);
    const el = byTestId('s');
    expect(el.getAttribute('role')).toBe('button');
    expect(el.textContent).toBe('Search this area');
    act(() => el.click());
    expect(onPress).toHaveBeenCalledTimes(1);

    mount(<MapSearchAreaButton onPress={onPress} disabled label="Search here" testID="s" />);
    const disabled = byTestId('s');
    expect(disabled.getAttribute('aria-disabled')).toBe('true');
    expect(disabled.getAttribute('aria-label')).toBe('Search here');
    act(() => disabled.click());
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
