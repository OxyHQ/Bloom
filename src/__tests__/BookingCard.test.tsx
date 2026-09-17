/**
 * @jest-environment jsdom
 *
 * The booking family — `BookingCard`, `PriceBreakdown`, `GuestSelect`,
 * `BookingBar`, `TripCard` — rendered through the REAL react-native-web, so the
 * assertions read emitted DOM attributes and computed styles rather than props.
 */
import React, { useState } from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { ImageResolverProvider } from '../image-resolver/context';
import { resolveAccentColors } from '../theme/accent-colors';
import {
  BookingBar,
  BookingCard,
  DEFAULT_GUEST_CATEGORIES,
  GuestSelect,
  PriceBreakdown,
  TRIP_STATUS,
  TripCard,
} from '../booking';
import type { GuestCounts } from '../booking';
import { GuestSelectCloseProvider } from '../booking/context';
import { discountAmount, priceAccessibilityName, resolveBookingPalette } from '../booking/shared';
import { useTheme } from '../theme/use-theme';
import type { Theme } from '../theme/types';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;
let lastTheme: Theme | null = null;

function ThemeProbe() {
  lastTheme = useTheme();
  return null;
}

function mount(ui: React.ReactElement, mode: 'light' | 'dark' = 'light'): HTMLElement {
  act(() => {
    root.render(
      <BloomThemeProvider mode={mode} colorPreset="teal">
        <ThemeProbe />
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
  const el = document.querySelector(`[data-testid="${id}"]`);
  if (!(el instanceof HTMLElement)) throw new Error(`No element for testID "${id}"`);
  return el;
}

function queryTestId(id: string): HTMLElement | null {
  return document.querySelector(`[data-testid="${id}"]`);
}

function byLabel(label: string): HTMLElement {
  const el = document.querySelector(`[aria-label="${label}"]`);
  if (!(el instanceof HTMLElement)) throw new Error(`No element labelled "${label}"`);
  return el;
}

function click(el: HTMLElement) {
  act(() => {
    el.click();
  });
}

/** A colour as the DOM serialises it, for comparing against a computed style. */
function css(color: string): string {
  const probe = document.createElement('div');
  probe.style.color = color;
  return probe.style.color;
}

function theme(): Theme {
  if (!lastTheme) throw new Error('theme not captured');
  return lastTheme;
}

const BREAKDOWN = {
  rows: [
    { label: '$180 x 5 nights', amount: '$900' },
    { label: 'Cleaning fee', amount: '$45' },
  ],
  total: '$945',
};

describe('booking helpers', () => {
  it('prefixes a discount with a typographic minus, once', () => {
    expect(discountAmount('$42')).toBe('−$42');
    expect(discountAmount('-$42')).toBe('−$42');
    expect(discountAmount('−$42')).toBe('−$42');
  });

  it('speaks a price with its unit and earlier price', () => {
    expect(priceAccessibilityName('$180', 'night')).toBe('$180 per night');
    expect(priceAccessibilityName('$162', 'night', '$180')).toBe('$162 per night, originally $180');
    expect(priceAccessibilityName('$900')).toBe('$900');
  });

  it('paints from the theme in both modes', () => {
    mount(<></>, 'light');
    const lightTheme = theme();
    const lightPalette = resolveBookingPalette(lightTheme);
    mount(<></>, 'dark');
    const darkPalette = resolveBookingPalette(theme());
    expect(theme().isDark).toBe(true);
    expect(lightPalette.surface).toBe(lightTheme.colors.card);
    expect(lightPalette.active).toBe(lightTheme.colors.text);
    expect(darkPalette.surface).not.toBe(lightPalette.surface);
    expect(darkPalette.fieldBorder).not.toBe(lightPalette.fieldBorder);
    expect(darkPalette.discount).toBe(resolveAccentColors(theme().colors, 'success', 'outlined').foreground);
  });

  it('ships four default guest categories, infants and pets outside the cap', () => {
    expect(DEFAULT_GUEST_CATEGORIES.map((c) => c.key)).toEqual(['adults', 'children', 'infants', 'pets']);
    expect(DEFAULT_GUEST_CATEGORIES[0]?.min).toBe(1);
    expect(DEFAULT_GUEST_CATEGORIES.filter((c) => c.countsTowardMax === false).map((c) => c.key)).toEqual([
      'infants',
      'pets',
    ]);
  });
});

describe('BookingCard', () => {
  it('has the card geometry: max 372, radius 16, padding 24, 1px border', () => {
    mount(<BookingCard testID="card" price="$180" priceUnit="night" guests="1 guest" />);
    const s = getComputedStyle(byTestId('card'));
    expect(s.maxWidth).toBe('372px');
    expect(s.borderTopLeftRadius).toBe('16px');
    expect(s.paddingTop).toBe('24px');
    expect(s.paddingLeft).toBe('24px');
    expect(s.borderTopWidth).toBe('1px');
    const palette = resolveBookingPalette(theme());
    expect(s.backgroundColor).toBe(css(palette.surface));
    expect(s.borderTopColor).toBe(css(palette.border));
  });

  it('without dates: placeholders, "Check availability", no note', () => {
    mount(<BookingCard testID="card" price="$180" priceUnit="night" guests="1 guest" rating={4.92} reviewCount={128} />);
    expect(byTestId('card-reserve').textContent).toBe('Check availability');
    expect(byTestId('card-check-in').getAttribute('aria-label')).toBe('Check-in: Add date');
    expect(byTestId('card-check-out').getAttribute('aria-label')).toBe('Checkout: Add date');
    expect(byTestId('card-guests').getAttribute('aria-label')).toBe('Guests: 1 guest');
    expect(container.textContent).not.toContain("You won't be charged yet");
    expect(byLabel('Rated 4.92 out of 5, 128 reviews').getAttribute('role')).toBe('img');
  });

  it('with dates: "Reserve", the note and the breakdown', () => {
    mount(
      <BookingCard
        testID="card"
        price="$180"
        priceUnit="night"
        checkIn="10/12/2026"
        checkOut="10/17/2026"
        guests="2 guests"
        breakdown={BREAKDOWN}
      />,
    );
    expect(byTestId('card-reserve').textContent).toBe('Reserve');
    expect(container.textContent).toContain("You won't be charged yet");
    expect(container.textContent).toContain('$945');
    expect(byTestId('card-check-in').getAttribute('aria-label')).toBe('Check-in: 10/12/2026');
  });

  it('honours reserveLabel and a null note', () => {
    mount(
      <BookingCard
        testID="card"
        price="$180"
        checkIn="a"
        checkOut="b"
        guests="2 guests"
        reserveLabel="Request to book"
        note={null}
      />,
    );
    expect(byTestId('card-reserve').textContent).toBe('Request to book');
    expect(container.textContent).not.toContain("You won't be charged yet");
  });

  it('names the price as one image, with the earlier price spoken', () => {
    mount(<BookingCard testID="card" price="$162" originalPrice="$180" priceUnit="night" guests="1 guest" />);
    const price = byTestId('card-price');
    expect(price.getAttribute('role')).toBe('img');
    expect(price.getAttribute('aria-label')).toBe('$162 per night, originally $180');
  });

  it('calls onPressDates with the field, onPressGuests and onReserve', () => {
    const dates = jest.fn();
    const guests = jest.fn();
    const reserve = jest.fn();
    mount(
      <BookingCard
        testID="card"
        price="$180"
        guests="1 guest"
        onPressDates={dates}
        onPressGuests={guests}
        onReserve={reserve}
      />,
    );
    click(byTestId('card-check-in'));
    click(byTestId('card-check-out'));
    click(byTestId('card-guests'));
    click(byTestId('card-reserve'));
    expect(dates.mock.calls).toEqual([['checkIn'], ['checkOut']]);
    expect(guests).toHaveBeenCalledTimes(1);
    expect(reserve).toHaveBeenCalledTimes(1);
  });

  it('ignores Reserve while loading or disabled', () => {
    const reserve = jest.fn();
    mount(<BookingCard testID="card" price="$180" guests="1 guest" onReserve={reserve} loading />);
    click(byTestId('card-reserve'));
    mount(<BookingCard testID="card" price="$180" guests="1 guest" onReserve={reserve} reserveDisabled />);
    click(byTestId('card-reserve'));
    expect(reserve).not.toHaveBeenCalled();
  });

  it('outlines the active field (2px text colour) and announces expanded state only when known', () => {
    mount(<BookingCard testID="card" price="$180" guests="1 guest" />);
    expect(byTestId('card-check-in').hasAttribute('aria-expanded')).toBe(false);
    expect(queryTestId('card-check-in-active')).toBeNull();

    mount(<BookingCard testID="card" price="$180" guests="1 guest" activeField="checkOut" />);
    expect(byTestId('card-check-in').getAttribute('aria-expanded')).toBe('false');
    expect(byTestId('card-check-out').getAttribute('aria-expanded')).toBe('true');
    expect(byTestId('card-guests').getAttribute('aria-expanded')).toBe('false');
    expect(queryTestId('card-check-in-active')).toBeNull();
    const outline = getComputedStyle(byTestId('card-check-out-active'));
    expect(outline.borderTopWidth).toBe('2px');
    expect(outline.borderTopColor).toBe(css(theme().colors.text));
    expect(outline.borderTopLeftRadius).toBe('12px');
  });

  it('draws the field cells with the focus hook and uppercase labels', () => {
    mount(<BookingCard testID="card" price="$180" guests="1 guest" />);
    const cell = byTestId('card-check-in');
    expect(cell.getAttribute('data-bloom-booking-focus')).toBe('');
    expect(cell.getAttribute('role')).toBe('button');
    expect(getComputedStyle(byTestId('card-fields')).borderTopLeftRadius).toBe('12px');
  });

  it('turns the guests cell into a popover trigger that keeps its name', () => {
    function Harness() {
      const [counts, setCounts] = useState<GuestCounts>({ adults: 2 });
      return (
        <BookingCard
          testID="card"
          price="$180"
          guests="2 guests"
          guestSelect={<GuestSelect value={counts} onValueChange={setCounts} />}
        />
      );
    }
    mount(<Harness />);
    const cell = byTestId('card-guests');
    expect(cell.getAttribute('aria-label')).toBe('Guests: 2 guests');
    expect(cell.getAttribute('aria-haspopup')).toBe('dialog');
    expect(cell.getAttribute('aria-expanded')).toBe('false');
  });
});

describe('PriceBreakdown', () => {
  it('draws rows, a discount in the success colour with a minus, and a bold total', () => {
    mount(
      <PriceBreakdown
        testID="pb"
        rows={[
          { label: '$180 x 5 nights', amount: '$900' },
          { label: 'Weekly discount', amount: '$90', tone: 'discount' },
        ]}
        totalLabel="Total (USD)"
        total="$810"
      />,
    );
    const text = byTestId('pb').textContent ?? '';
    expect(text).toContain('−$90');
    expect(text).toContain('Total (USD)');
    const discount = [...byTestId('pb').querySelectorAll('div')].find((d) => d.textContent === '−$90');
    expect(discount).toBeDefined();
    expect(getComputedStyle(discount as HTMLElement).color).toBe(
      css(resolveAccentColors(theme().colors, 'success', 'outlined').foreground),
    );
  });

  it('makes a label with onPressLabel an underlined, named button', () => {
    const onPress = jest.fn();
    mount(<PriceBreakdown testID="pb" rows={[{ label: 'Service fee', amount: '$20', onPressLabel: onPress }]} />);
    const link = byLabel('Service fee');
    expect(link.getAttribute('role')).toBe('button');
    click(link);
    expect(onPress).toHaveBeenCalledTimes(1);
    const label = [...link.querySelectorAll('div')].find((d) => d.textContent === 'Service fee') ?? link;
    expect(getComputedStyle(label).textDecorationLine || getComputedStyle(label).textDecoration).toContain('underline');
  });

  it('makes a label with details a popover trigger', () => {
    mount(<PriceBreakdown testID="pb" rows={[{ label: 'Service fee', amount: '$20', details: 'Why' }]} />);
    const link = byLabel('Service fee');
    expect(link.getAttribute('aria-haspopup')).toBe('dialog');
    expect(link.getAttribute('aria-expanded')).toBe('false');
  });

  it('leaves a plain label as text and omits the total without one', () => {
    mount(<PriceBreakdown testID="pb" rows={[{ label: 'Cleaning fee', amount: '$45' }]} />);
    expect(document.querySelector('[role="button"]')).toBeNull();
    expect(byTestId('pb').textContent).toBe('Cleaning fee$45');
  });
});

describe('GuestSelect', () => {
  function Harness({ onChange, maxGuests, onClose }: { onChange?: (c: GuestCounts) => void; maxGuests?: number; onClose?: () => void }) {
    const [counts, setCounts] = useState<GuestCounts>({ adults: 2, children: 1, infants: 0, pets: 0 });
    return (
      <GuestSelect
        testID="gs"
        value={counts}
        maxGuests={maxGuests}
        onClose={onClose}
        note="Max 4 guests"
        onValueChange={(next) => {
          onChange?.(next);
          setCounts(next);
        }}
      />
    );
  }

  it('renders a named stepper per category and merges changes', () => {
    const onChange = jest.fn();
    mount(<Harness onChange={onChange} />);
    expect(byTestId('gs-adults').getAttribute('aria-label')).toBe('Adults');
    expect(byTestId('gs-pets').getAttribute('aria-label')).toBe('Pets');
    click(byTestId('gs-infants-increment'));
    expect(onChange).toHaveBeenLastCalledWith({ adults: 2, children: 1, infants: 1, pets: 0 });
    expect(byTestId('gs-adults-value').getAttribute('aria-valuemin')).toBe('1');
  });

  it('caps the counted categories at maxGuests, leaving infants and pets free', () => {
    mount(<Harness maxGuests={4} />);
    expect(byTestId('gs-adults-increment').getAttribute('aria-disabled')).not.toBe('true');
    click(byTestId('gs-children-increment'));
    expect(byTestId('gs-children-value').getAttribute('aria-valuenow')).toBe('2');
    expect(byTestId('gs-adults-increment').getAttribute('aria-disabled')).toBe('true');
    expect(byTestId('gs-children-increment').getAttribute('aria-disabled')).toBe('true');
    expect(byTestId('gs-infants-increment').getAttribute('aria-disabled')).not.toBe('true');
    expect(byTestId('gs-adults-value').getAttribute('aria-valuemax')).toBe('2');
  });

  it('shows Close only with onClose or inside a card popover', () => {
    mount(<Harness />);
    expect(queryTestId('gs-close')).toBeNull();

    const onClose = jest.fn();
    mount(<Harness onClose={onClose} />);
    click(byTestId('gs-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(byTestId('gs-close').getAttribute('aria-label')).toBe('Close');

    const fromCard = jest.fn();
    mount(
      <GuestSelectCloseProvider value={fromCard}>
        <Harness />
      </GuestSelectCloseProvider>,
    );
    click(byTestId('gs-close'));
    expect(fromCard).toHaveBeenCalledTimes(1);
  });
});

describe('BookingBar', () => {
  it('adds the bottom inset from the safe-area context, or the prop', () => {
    const insets = { top: 0, left: 0, right: 0, bottom: 34 };
    mount(
      <SafeAreaInsetsContext.Provider value={insets}>
        <BookingBar testID="bar" price="$180" priceUnit="night" />
      </SafeAreaInsetsContext.Provider>,
    );
    let s = getComputedStyle(byTestId('bar'));
    expect(s.paddingBottom).toBe('46px');
    expect(s.paddingTop).toBe('12px');
    expect(s.borderTopWidth).toBe('1px');

    mount(<BookingBar testID="bar" price="$180" priceUnit="night" bottomInset={8} />);
    s = getComputedStyle(byTestId('bar'));
    expect(s.paddingBottom).toBe('20px');

    mount(<BookingBar testID="bar" price="$180" />);
    expect(getComputedStyle(byTestId('bar')).paddingBottom).toBe('12px');
  });

  it('draws the price, a dates button and Reserve', () => {
    const dates = jest.fn();
    const reserve = jest.fn();
    mount(
      <BookingBar
        testID="bar"
        price="$180"
        priceUnit="night"
        dates="Oct 12 – 17"
        onPressDates={dates}
        onReserve={reserve}
      />,
    );
    expect(byTestId('bar-price').getAttribute('aria-label')).toBe('$180 per night');
    const datesButton = byTestId('bar-dates');
    expect(datesButton.getAttribute('role')).toBe('button');
    expect(datesButton.getAttribute('aria-label')).toBe('Oct 12 – 17');
    click(datesButton);
    click(byTestId('bar-reserve'));
    expect(dates).toHaveBeenCalledTimes(1);
    expect(reserve).toHaveBeenCalledTimes(1);
    expect(byTestId('bar-reserve').textContent).toBe('Reserve');
  });
});

describe('TripCard', () => {
  it('maps each status to its badge tone and label', () => {
    expect(TRIP_STATUS.confirmed.tone).toBe('success');
    expect(TRIP_STATUS.pending.tone).toBe('warning');
    expect(TRIP_STATUS.cancelled.tone).toBe('error');
    expect(TRIP_STATUS.completed.tone).toBe('default');
    mount(<TripCard testID="trip" title="Cabin" status="cancelled" />);
    const badge = byTestId('trip-status');
    expect(badge.textContent).toBe('Cancelled');
    expect(getComputedStyle(badge).backgroundColor).toBe(
      css(resolveAccentColors(theme().colors, 'error', 'subtle').background),
    );
  });

  it('is one named button over hidden content, with actions still separately pressable', () => {
    const onPress = jest.fn();
    const onAction = jest.fn();
    mount(
      <TripCard
        testID="trip"
        title="Cliffside cabin"
        subtitle="Hosted by Marisol"
        dates="Oct 12 – 17, 2026"
        status="confirmed"
        onPress={onPress}
        actions={
          <button type="button" data-testid="action" onClick={onAction}>
            Message host
          </button>
        }
      />,
    );
    const press = byTestId('trip-press');
    expect(press.getAttribute('role')).toBe('button');
    expect(press.getAttribute('aria-label')).toBe('Cliffside cabin, Oct 12 – 17, 2026, Confirmed');
    expect(press.getAttribute('data-bloom-booking-focus')).toBe('');
    expect(byTestId('trip-image').getAttribute('aria-hidden')).toBe('true');
    expect(byTestId('trip-status').closest('[aria-hidden="true"]')).not.toBeNull();
    expect(byTestId('trip-actions').closest('[aria-hidden="true"]')).toBeNull();
    // The action is not inside the button.
    expect(press.contains(byTestId('action'))).toBe(false);
    click(byTestId('action'));
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onPress).not.toHaveBeenCalled();
    click(press);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('hides nothing and renders no button without onPress', () => {
    mount(<TripCard testID="trip" title="Cabin" dates="Jul 1" />);
    expect(queryTestId('trip-press')).toBeNull();
    expect(byTestId('trip-image').hasAttribute('aria-hidden')).toBe(false);
  });

  it('lays out horizontally or vertically', () => {
    mount(<TripCard testID="trip" title="Cabin" orientation="horizontal" />);
    expect(getComputedStyle(byTestId('trip-layout')).flexDirection).toBe('row');
    expect(getComputedStyle(byTestId('trip-image')).width).toBe('176px');
    expect(getComputedStyle(byTestId('trip-image')).borderTopLeftRadius).toBe('12px');
    mount(<TripCard testID="trip" title="Cabin" orientation="vertical" />);
    expect(getComputedStyle(byTestId('trip-layout')).flexDirection).toBe('column');
    // `auto` starts vertical until it has measured itself.
    mount(<TripCard testID="trip" title="Cabin" />);
    expect(getComputedStyle(byTestId('trip-layout')).flexDirection).toBe('column');
    expect(getComputedStyle(byTestId('trip')).borderTopLeftRadius).toBe('16px');
  });

  it('passes a URL through and resolves an id', () => {
    const resolver = jest.fn((id: string, variant?: string) => `https://cdn.test/${id}/${variant ?? 'full'}.jpg`);
    mount(
      <ImageResolverProvider value={resolver}>
        <TripCard testID="a" title="A" image="file-123" imageVariant="medium" />
        <TripCard testID="b" title="B" image="https://cdn.test/direct.jpg" />
      </ImageResolverProvider>,
    );
    expect(resolver).toHaveBeenCalledWith('file-123', 'medium');
    expect(resolver.mock.calls.every(([id]) => id === 'file-123')).toBe(true);
  });
});
