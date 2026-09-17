/**
 * @jest-environment jsdom
 *
 * The listing-editor parts through the REAL react-native-web, so the
 * assertions read the emitted DOM: which offering cards expand, the fields
 * they report, the computed price per area, the radio and checkbox semantics,
 * the quality score and the preview toggle.
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

import {
  AddressPrecisionPicker,
  DEFAULT_PROPERTY_TYPES,
  ListingPreviewPane,
  ListingQualityMeter,
  listingQualityScore,
  OfferingEditor,
  PropertyTypeSelector,
} from '../listing-editor';
import type { AddressPrecision, OfferingValue } from '../listing-editor';
import type { PropertyType } from '../stay-filters';
import { pricePerArea, sanitizeAmount, toggleOfferingKind } from '../listing-editor/OfferingEditor';
import { propertyTypeColumns } from '../listing-editor/PropertyTypeSelector';
import { resolveSelectionPaint } from '../listing-editor/SelectionCard';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import type { Theme } from '../theme/types';
import { useTheme } from '../theme/use-theme';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;
let theme: Theme;

function ReadTheme() {
  theme = useTheme();
  return null;
}

async function mount(ui: React.ReactElement, mode: 'light' | 'dark' = 'light') {
  act(() => {
    root.render(
      <BloomThemeProvider mode={mode} colorPreset="teal">
        <ReadTheme />
        {ui}
      </BloomThemeProvider>,
    );
  });
  await act(async () => {
    resizeCallback?.(Array.from(observed).map((target) => ({ target })));
    await new Promise((resolve) => setTimeout(resolve, 5));
  });
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

function normalise(color: string): string {
  const probe = document.createElement('div');
  probe.style.borderColor = color;
  return probe.style.borderColor;
}

function typeInto(id: string, text: string) {
  const input = byTestId(id) as HTMLInputElement;
  act(() => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    setter?.call(input, text);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

// ---------------------------------------------------------------------------
//  OfferingEditor
// ---------------------------------------------------------------------------

let lastOffering: OfferingValue | null = null;

function OfferingHarness({ initial, area }: { initial: OfferingValue; area?: number }) {
  const [value, setValue] = useState(initial);
  return (
    <OfferingEditor
      value={value}
      onValueChange={(next) => {
        lastOffering = next;
        setValue(next);
      }}
      area={area}
      testID="o"
    />
  );
}

describe('offering maths', () => {
  it('keeps digits only and computes the price per area', () => {
    expect(sanitizeAmount('€ 385.000,50')).toBe('38500050');
    expect(pricePerArea('385000', 96)).toBeCloseTo(4010.4, 1);
    expect(pricePerArea('', 96)).toBeNull();
    expect(pricePerArea('1000', 0)).toBeNull();
    expect(pricePerArea('1000', undefined)).toBeNull();
  });

  it('toggles a kind and keeps the fields of a deselected kind', () => {
    const value: OfferingValue = { kinds: ['rent'], rent: { amount: '900' } };
    const off = toggleOfferingKind(value, 'rent');
    expect(off.kinds).toEqual([]);
    expect(off.rent).toEqual({ amount: '900' });
    expect(toggleOfferingKind(off, 'sale').kinds).toEqual(['sale']);
  });
});

describe('OfferingEditor', () => {
  it('draws four checkbox cards in a named group, collapsed until selected', async () => {
    await mount(<OfferingHarness initial={{ kinds: [] }} />);
    const group = container.querySelector('[role="group"]');
    expect(group?.getAttribute('aria-label')).toBe('How is the home offered?');
    for (const kind of ['rent', 'sale', 'stay', 'swap']) {
      const control = byTestId(`o-${kind}-control`);
      expect(control.getAttribute('role')).toBe('checkbox');
      expect(control.getAttribute('aria-checked')).toBe('false');
      expect(maybe(`o-${kind}-body`)).toBeNull();
    }
    expect(byTestId('o-rent-control').getAttribute('aria-label')).toBe('For rent');
  });

  it('expands a card when selected and collapses it again, keeping others as they are', async () => {
    await mount(<OfferingHarness initial={{ kinds: [] }} />);
    act(() => byTestId('o-rent-control').click());
    expect(lastOffering?.kinds).toEqual(['rent']);
    expect(byTestId('o-rent-control').getAttribute('aria-checked')).toBe('true');
    expect(maybe('o-rent-body')).not.toBeNull();
    expect(maybe('o-rent-amount')).not.toBeNull();
    expect(maybe('o-sale-body')).toBeNull();

    act(() => byTestId('o-swap-control').click());
    expect(lastOffering?.kinds).toEqual(['rent', 'swap']);
    expect(maybe('o-swap-mode')).not.toBeNull();

    act(() => byTestId('o-rent-control').click());
    expect(lastOffering?.kinds).toEqual(['swap']);
    expect(maybe('o-rent-body')).toBeNull();
  });

  it('paints a selected card with a 2px text-primary border and a resting one with 1px', async () => {
    await mount(<OfferingHarness initial={{ kinds: ['sale'] }} />);
    const paint = resolveSelectionPaint(theme);
    const sale = byTestId('o-sale');
    const rent = byTestId('o-rent');
    expect(sale.style.borderTopWidth || sale.style.borderWidth).toBe('2px');
    expect(normalise(sale.style.borderTopColor || sale.style.borderColor)).toBe(normalise(paint.borderSelected));
    expect(rent.style.borderTopWidth || rent.style.borderWidth).toBe('1px');
    expect(normalise(rent.style.borderTopColor || rent.style.borderColor)).toBe(normalise(paint.border));
  });

  it('reports the rent fields: digits-only amount and deposit radios', async () => {
    await mount(<OfferingHarness initial={{ kinds: ['rent'] }} />);
    typeInto('o-rent-amount', '1.450 €');
    expect(lastOffering?.rent?.amount).toBe('1450');
    const deposit = byTestId('o-rent-deposit');
    expect(deposit.getAttribute('role')).toBe('radiogroup');
    expect(deposit.getAttribute('aria-label')).toBe('Deposit');
    const two = byTestId('o-rent-deposit-2');
    expect(two.getAttribute('role')).toBe('radio');
    expect(two.getAttribute('aria-checked')).toBe('false');
    act(() => two.click());
    expect(lastOffering?.rent?.depositMonths).toBe(2);
    expect(byTestId('o-rent-deposit-2').getAttribute('aria-checked')).toBe('true');
    expect(byTestId('o-rent-deposit-0').textContent).toBe('None');
  });

  it('computes the price per area from the sale price and the area', async () => {
    await mount(<OfferingHarness initial={{ kinds: ['sale'], sale: { price: '' } }} area={96} />);
    expect(byTestId('o-sale-per-area').textContent).toContain('Add a price');
    typeInto('o-sale-price', '385000');
    // Grouped with a comma, like every other number in the package. This screen
    // used a non-breaking space until the four copies of the formatter were
    // consolidated, so one screen read `1 200 000` where another read `1,200,000`.
    expect(byTestId('o-sale-per-area').textContent).toContain('€4,010 / m²');
  });

  it('sets the swap mode and the stay fields', async () => {
    await mount(<OfferingHarness initial={{ kinds: ['stay', 'swap'] }} />);
    act(() => byTestId('o-swap-mode-both').click());
    expect(lastOffering?.swap?.mode).toBe('both');
    typeInto('o-stay-nightly', '96');
    expect(lastOffering?.stay?.nightlyRate).toBe('96');
    act(() => byTestId('o-stay-minimum-increment').click());
    expect(lastOffering?.stay?.minimumNights).toBe(2);
  });

  it('shows validation messages under their fields and under the cards', async () => {
    await mount(
      <OfferingEditor
        value={{ kinds: ['rent'] }}
        onValueChange={() => undefined}
        errors={{ kinds: 'Pick one more', 'rent.amount': 'Enter the monthly rent.' }}
        testID="o"
      />,
    );
    expect(byTestId('o-kinds-error').textContent).toBe('Pick one more');
    expect(byTestId('o-rent-body').textContent).toContain('Enter the monthly rent.');
  });

  it('restricts the cards to `kinds`', async () => {
    await mount(<OfferingEditor value={{ kinds: [] }} onValueChange={() => undefined} kinds={['sale', 'rent']} testID="o" />);
    const names = Array.from(container.querySelectorAll('[role="checkbox"]')).map((el) => el.getAttribute('aria-label'));
    expect(names).toEqual(['For sale', 'For rent']);
  });
});

// ---------------------------------------------------------------------------
//  PropertyTypeSelector
// ---------------------------------------------------------------------------

describe('PropertyTypeSelector', () => {
  function Harness({ onChange }: { onChange: (value: PropertyType) => void }) {
    const [value, setValue] = useState<PropertyType | null>(null);
    return (
      <PropertyTypeSelector
        value={value}
        onValueChange={(next) => {
          onChange(next);
          setValue(next);
        }}
        testID="t"
      />
    );
  }

  it('is a named radiogroup of nine radios with aria-checked', async () => {
    await mount(<Harness onChange={() => undefined} />);
    const group = container.querySelector('[role="radiogroup"]');
    expect(group?.getAttribute('aria-label')).toBe('Property type');
    const radios = Array.from(container.querySelectorAll('[role="radio"]'));
    expect(radios).toHaveLength(9);
    expect(radios.map((r) => r.getAttribute('aria-label'))).toEqual(DEFAULT_PROPERTY_TYPES.map((o) => o.label));
    expect(radios.every((r) => r.getAttribute('aria-checked') === 'false')).toBe(true);
  });

  it('selects one tile at a time', async () => {
    const onChange = jest.fn();
    await mount(<Harness onChange={onChange} />);
    act(() => byTestId('t-house').click());
    expect(onChange).toHaveBeenLastCalledWith('house');
    expect(byTestId('t-house').getAttribute('aria-checked')).toBe('true');
    act(() => byTestId('t-studio').click());
    expect(byTestId('t-house').getAttribute('aria-checked')).toBe('false');
    expect(byTestId('t-studio').getAttribute('aria-checked')).toBe('true');
    // Re-choosing the chosen tile is a no-op.
    act(() => byTestId('t-studio').click());
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('sizes the tiles for 4 columns at 720 and 2 at 343', async () => {
    expect(propertyTypeColumns(343)).toBe(2);
    expect(propertyTypeColumns(500)).toBe(3);
    expect(propertyTypeColumns(720)).toBe(4);
    await mount(<Harness onChange={() => undefined} />);
    // (720 - 3 × 12) / 4 = 171
    expect(byTestId('t-room').style.width).toBe('171px');
    expect(byTestId('t-room').style.minHeight).toBe('112px');
  });

  it('shows an error line', async () => {
    await mount(<PropertyTypeSelector value={null} onValueChange={() => undefined} error="Choose one" testID="t" />);
    expect(container.textContent).toContain('Choose one');
  });
});

// ---------------------------------------------------------------------------
//  AddressPrecisionPicker
// ---------------------------------------------------------------------------

describe('AddressPrecisionPicker', () => {
  it('is a radiogroup of three radio cards, one checked, with the explanation as a hint', async () => {
    await mount(<AddressPrecisionPicker value="street" onValueChange={() => undefined} testID="p" />);
    const group = container.querySelector('[role="radiogroup"]');
    expect(group?.getAttribute('aria-label')).toBe('Address precision');
    const radios = Array.from(container.querySelectorAll('[role="radio"]'));
    expect(radios.map((r) => r.getAttribute('aria-label'))).toEqual(['Exact address', 'Street only', 'Approximate area']);
    expect(radios.map((r) => r.getAttribute('aria-checked'))).toEqual(['false', 'true', 'false']);
    expect(container.textContent).toContain('The published map follows this choice.');
  });

  it('reports a new choice and ignores the current one', async () => {
    const onValueChange = jest.fn();
    await mount(<AddressPrecisionPicker value="exact" onValueChange={onValueChange} testID="p" />);
    act(() => byTestId('p-exact-control').click());
    expect(onValueChange).not.toHaveBeenCalled();
    act(() => byTestId('p-approximate-control').click());
    expect(onValueChange).toHaveBeenCalledWith('approximate');
  });

  it('asks the app for each map and hides the footnote with null', async () => {
    const seen: AddressPrecision[] = [];
    await mount(
      <AddressPrecisionPicker
        value="exact"
        onValueChange={() => undefined}
        renderMap={(precision) => {
          seen.push(precision);
          return null;
        }}
        footnote={null}
        testID="p"
      />,
    );
    expect(new Set(seen)).toEqual(new Set(['exact', 'street', 'approximate']));
    expect(container.textContent).not.toContain('The published map follows this choice.');
  });
});

// ---------------------------------------------------------------------------
//  ListingQualityMeter
// ---------------------------------------------------------------------------

describe('ListingQualityMeter', () => {
  const items = [
    { key: 'photos', label: 'Add at least 5 photos', tip: 'You have 3.', done: false, weight: 2 },
    { key: 'kitchen', label: 'Describe the kitchen', done: true },
    { key: 'energy', label: 'Add energy certificate', done: true },
  ];

  it('scores the done share of the weight', () => {
    expect(listingQualityScore(items)).toBe(50);
    expect(listingQualityScore([])).toBe(0);
    expect(listingQualityScore(items.map((i) => ({ ...i, done: true })))).toBe(100);
  });

  it('draws a named progressbar with the score and the summary', async () => {
    await mount(<ListingQualityMeter items={items} testID="q" />);
    const ring = byTestId('q-ring');
    expect(ring.getAttribute('role')).toBe('progressbar');
    expect(ring.getAttribute('aria-label')).toBe('Listing quality score');
    expect(ring.getAttribute('aria-valuenow')).toBe('50');
    expect(ring.getAttribute('aria-valuemin')).toBe('0');
    expect(ring.getAttribute('aria-valuemax')).toBe('100');
    expect(ring.textContent).toBe('50');
    expect(container.textContent).toContain('Good');
  });

  it('names rows with their state, shows open tips, and makes pressable rows buttons', async () => {
    const onPress = jest.fn();
    await mount(
      <ListingQualityMeter
        items={[{ ...items[0]!, onPress }, items[1]!]}
        tips={['Shoot in daylight.']}
        testID="q"
      />,
    );
    const row = byTestId('q-item-photos');
    expect(row.getAttribute('role')).toBe('button');
    expect(row.getAttribute('aria-label')).toBe('Add at least 5 photos, To do');
    act(() => row.click());
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(row.textContent).toContain('You have 3.');
    expect(byTestId('q-item-kitchen').getAttribute('aria-label')).toBe('Describe the kitchen, Done');
    expect(byTestId('q-tips').textContent).toContain('Shoot in daylight.');
  });

  it('takes an explicit score and summary', async () => {
    await mount(<ListingQualityMeter items={items} score={92} summary="Ready" testID="q" />);
    expect(byTestId('q-ring').getAttribute('aria-valuenow')).toBe('92');
    expect(container.textContent).toContain('Ready');
  });
});

// ---------------------------------------------------------------------------
//  ListingPreviewPane
// ---------------------------------------------------------------------------

describe('ListingPreviewPane', () => {
  const listing = {
    photos: ['https://example.com/a.jpg'],
    title: 'Corner flat by the harbour',
    subtitle: '3 bedrooms',
    price: '€1450',
    priceUnit: 'month',
    description: 'Light from two sides.',
    facts: [{ label: '3', accessibilityLabel: '3 bedrooms' }, { label: '2', accessibilityLabel: '2 baths' }],
  };

  it('starts on the card and switches to the page through tabs', async () => {
    await mount(<ListingPreviewPane listing={listing} testID="v" />);
    expect(maybe('v-card')).not.toBeNull();
    expect(byTestId('v-card').textContent).toContain('Corner flat by the harbour');
    const pageTab = byTestId('v-page-tab');
    expect(pageTab.getAttribute('role')).toBe('tab');
    expect(pageTab.getAttribute('aria-selected')).toBe('false');
    act(() => pageTab.click());
    expect(maybe('v-card')).toBeNull();
    const page = byTestId('v-page');
    expect(page.textContent).toContain('3 bedrooms · 2 baths');
    expect(page.textContent).toContain('Light from two sides.');
    expect(byTestId('v-page-tab').getAttribute('aria-selected')).toBe('true');
  });

  it('renders the app page when given', async () => {
    await mount(<ListingPreviewPane listing={listing} defaultMode="page" renderPage={() => null} testID="v" />);
    expect(byTestId('v-page').textContent).toBe('');
  });
});
