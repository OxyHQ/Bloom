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
import { resolveMenuPalette } from '../floating/menu-palette';
import { ImageResolverProvider } from '../image-resolver';
import {
  MapAreaCircle,
  MapClusterMarker,
  MapListingPreview,
  MapPriceMarker,
  MapSearchAreaButton,
} from '../map-marker';
import { AREA_FILL_OPACITY, resolveMapMarkerPaint, type MapMarkerPaint } from '../map-marker/shared';
import { RiHotelBedLine } from '../icons/remix/RiHotelBedLine';
import { resolveOfferingBadgePaint } from '../offering-badge/shared';
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
    expect(paint.activeFill).toBe(theme.colors.text);
    expect(paint.surface).toBe(resolveMenuPalette(theme).surface);
    expect(paint.activeLabel).toBe(theme.colors.background);
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

// ---------------------------------------------------------------------------
//  Housing additions
// ---------------------------------------------------------------------------


describe('MapPriceMarker — compact size', () => {
  it('is 22 tall with 8px sides, caption text and a 10px heart', () => {
    mount(<MapPriceMarker price="€240K" size="compact" saved testID="m" />);
    const style = getComputedStyle(byTestId('m'));
    expect(style.height).toBe('22px');
    expect(style.borderTopLeftRadius).toBe('11px');
    expect(style.paddingRight).toBe('8px');
    expect(style.paddingLeft).toBe('6px');
    expect(getComputedStyle(byTestId('m').querySelector('[dir="auto"]') as HTMLElement).fontSize).toBe('12px');
    expect(byTestId('m-saved').querySelector('svg')?.getAttribute('width')).toBe('10');
    expect(byTestId('m').textContent).toBe('€240K');
  });

  it('keeps the default size unchanged', () => {
    mount(<MapPriceMarker price="€950/mo" testID="m" />);
    expect(getComputedStyle(byTestId('m')).height).toBe('28px');
    expect(getComputedStyle(byTestId('m')).paddingLeft).toBe('10px');
  });
});

describe('MapAreaCircle', () => {
  it.each(['light', 'dark'] as const)('a 2r round circle: accent fill at 15%%, a solid 1.5px accent edge (%s)', (mode) => {
    mount(<MapAreaCircle radius={60} testID="a" />, mode);
    const { accent } = resolveButtonRamps(theme);
    expect(paint.area).toBe(mode === 'dark' ? accent[400] : accent[500]);
    const el = byTestId('a');
    expect(getComputedStyle(el).width).toBe('120px');
    expect(getComputedStyle(el).height).toBe('120px');
    expect(getComputedStyle(el).borderTopLeftRadius).toBe('60px');
    expect(getComputedStyle(el).pointerEvents).toBe('none');
    const fill = getComputedStyle(byTestId('a-fill'));
    expect(fill.backgroundColor).toBe(normalise(paint.area));
    expect(fill.opacity).toBe(String(AREA_FILL_OPACITY));
    const edge = getComputedStyle(byTestId('a-edge'));
    expect(edge.borderTopWidth).toBe('1.5px');
    expect(edge.borderTopColor).toBe(normalise(paint.area));
    expect(edge.opacity === '' || edge.opacity === '1').toBe(true);
  });

  it('decorative without a name; an img with one; a centred surface label', () => {
    mount(<MapAreaCircle radius={40} testID="a" />);
    expect(byTestId('a').getAttribute('role')).toBeNull();
    expect(query('a-label')).toBeNull();
    mount(<MapAreaCircle radius={40} label="~300 m" accessibilityLabel="Approximate location, within 300 metres" testID="a" />);
    expect(byTestId('a').getAttribute('role')).toBe('img');
    expect(byTestId('a').getAttribute('aria-label')).toBe('Approximate location, within 300 metres');
    const label = byTestId('a-label');
    expect(label.textContent).toBe('~300 m');
    expect(getComputedStyle(label).backgroundColor).toBe(normalise(paint.surface));
    expect(getComputedStyle(byTestId('a')).justifyContent).toBe('center');
  });

  it('a negative radius draws nothing rather than a negative box', () => {
    mount(<MapAreaCircle radius={-5} testID="a" />);
    expect(getComputedStyle(byTestId('a')).width).toBe('0px');
  });
});

describe('MapListingPreview — housing', () => {
  const home = {
    title: 'Villa above the bay',
    offerings: ['sale', 'long_term_rent'] as const,
    priceLines: [{ price: '€4,800', unit: '/ month' }, { price: '€1,200,000', secondary: '€6,000/m²' }],
    facts: [{ icon: RiHotelBedLine, label: '5' }, { label: '200 m²' }],
  };

  it('draws the card\'s parts at the small size: tinted offerings, stacked prices, facts', () => {
    mount(<MapListingPreview {...home} testID="p" />);
    const offerings = byTestId('p-offerings');
    expect(Array.from(offerings.children).map((el) => el.textContent)).toEqual(['For sale', 'For rent']);
    expect(getComputedStyle(byTestId('p-offerings-sale')).height).toBe('20px');
    expect(getComputedStyle(byTestId('p-offerings-sale')).backgroundColor).toBe(
      normalise(resolveOfferingBadgePaint(theme, 'sale', 'tinted').background),
    );
    expect(byTestId('p-price-0').textContent).toBe('€4,800 / month');
    expect(byTestId('p-price-1').textContent).toBe('€1,200,000 · €6,000/m²');
    expect(getComputedStyle(byTestId('p-price-1').querySelector('span') as HTMLElement).fontSize).toBe('13px');
    expect(Array.from(byTestId('p-facts').children).map((el) => el.textContent)).toEqual(['5', '200 m²']);
    expect(byTestId('p-facts-0').querySelector('svg')?.getAttribute('width')).toBe('14');
  });

  it('priceLines replace the single price line; neither draws none', () => {
    mount(<MapListingPreview {...home} price="€9" priceDetail="night" testID="p" />);
    expect(byTestId('p').textContent).not.toContain('€9 night');
    mount(<MapListingPreview title="Garden cottage" testID="p" />);
    expect(query('p-price')).toBeNull();
    expect(byTestId('p').textContent).toBe('Garden cottage');
  });
});
