/**
 * @jest-environment jsdom
 *
 * The housing additions to listing-details — `PropertyFacts`, `ContactCard`
 * (and `HostCard` as its host preset) and `FloorPlan` — through the REAL
 * react-native-web. Width-driven layouts are in `PropertyInsightsLayout.test.tsx`.
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { RiHotelBedLine, RiRulerLine, RiTranslate2 } from '../icons/remix';
import { ContactCard, FloorPlan, HostCard, PropertyFacts } from '../listing-details';
import { resolvePropertyFactsColumns } from '../listing-details/PropertyFacts';
import { resolveListingPalette } from '../listing-details/shared';
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
const queryTestId = (id: string) => container.querySelector(`[data-testid="${id}"]`);

function normalise(color: string): string {
  const probe = document.createElement('div');
  probe.style.color = color;
  return probe.style.color;
}

// ---------------------------------------------------------------------------

describe('PropertyFacts', () => {
  const items = [
    { icon: RiRulerLine, label: 'Built area', value: '138 m²' },
    { icon: RiHotelBedLine, label: 'Bedrooms', value: '3' },
    { label: 'Floor', value: '3rd of 5' },
    { label: 'Elevator', value: 'Yes' },
    { label: 'Year built', value: '1962' },
  ];

  it('columns are equal shares with a 16px gutter; each fact is a named list item', () => {
    mount(<PropertyFacts items={items} columns={4} testID="pf" />);
    const grid = byTestId('pf-grid');
    expect(grid.getAttribute('role')).toBe('list');
    expect(grid.getAttribute('aria-label')).toBe('Property features');
    const cell = byTestId('pf-item-0');
    expect(getComputedStyle(cell).width).toBe('25%');
    expect(getComputedStyle(cell).paddingRight).toBe('16px');
    expect(cell.getAttribute('role')).toBe('listitem');
    expect(cell.getAttribute('aria-label')).toBe('Built area: 138 m²');
    expect(cell.querySelector('svg')?.getAttribute('width')).toBe('24');
    const value = byTestId('pf-item-0-value');
    expect(getComputedStyle(value).fontSize).toBe('16px');
    expect(getComputedStyle(value).fontWeight).toBe('600');
    expect(getComputedStyle(value).color).toBe(normalise(resolveListingPalette(theme).text));
  });

  it('limit + onShowAll draws "Show all N features" counting total', () => {
    const onShowAll = jest.fn();
    mount(<PropertyFacts items={items} columns={2} limit={2} total={12} onShowAll={onShowAll} testID="pf" />);
    expect(queryTestId('pf-item-2')).toBeNull();
    const button = byTestId('pf-show-all');
    expect(button.textContent).toBe('Show all 12 features');
    act(() => button.click());
    expect(onShowAll).toHaveBeenCalled();
    mount(<PropertyFacts items={items} columns={2} onShowAll={onShowAll} testID="pf" />);
    expect(queryTestId('pf-show-all')).toBeNull();
  });

  it('auto picks 2 / 3 / 4 columns at 480 and 720', () => {
    expect(resolvePropertyFactsColumns(null)).toBe(2);
    expect(resolvePropertyFactsColumns(479)).toBe(2);
    expect(resolvePropertyFactsColumns(480)).toBe(3);
    expect(resolvePropertyFactsColumns(719)).toBe(3);
    expect(resolvePropertyFactsColumns(720)).toBe(4);
  });
});

describe('ContactCard', () => {
  it('role labels the card when no label is given; a host draws none', () => {
    mount(<ContactCard role="agent" name="Leonor" testID="c" />);
    expect(byTestId('c-label').textContent).toBe('Agent');
    mount(<ContactCard role="landlord" name="Artur" roleLabel="Owner" testID="c" />);
    expect(byTestId('c-label').textContent).toBe('Owner');
    mount(<ContactCard role="host" name="Marta" testID="c" />);
    expect(queryTestId('c-label')).toBeNull();
  });

  it('agency row, response time, active listings link and the detail rows', () => {
    const onPressListings = jest.fn();
    mount(
      <ContactCard
        role="agent"
        name="Leonor"
        agency="Casa Ribeirinha"
        logo="https://example.test/logo.png"
        details={[{ icon: RiTranslate2, text: 'Speaks Portuguese' }]}
        responseTime="Usually responds within an hour"
        activeListings={12}
        onPressListings={onPressListings}
        testID="c"
      />,
    );
    const agency = byTestId('c-agency');
    expect(agency.getAttribute('aria-label')).toBe('Casa Ribeirinha');
    const logo = byTestId('c-logo');
    expect(getComputedStyle(logo).width).toBe('40px');
    expect(getComputedStyle(logo).borderTopLeftRadius).toBe('10px');
    expect(byTestId('c-response-time').textContent).toBe('Usually responds within an hour');
    const listings = byTestId('c-listings').querySelector('[role="link"]') as HTMLElement;
    expect(listings.getAttribute('aria-label')).toBe('12 active listings');
    act(() => listings.click());
    expect(onPressListings).toHaveBeenCalled();
    expect(byTestId('c-detail-0').textContent).toBe('Speaks Portuguese');
  });

  it('one active listing is singular and plain text without a handler', () => {
    mount(<ContactCard role="landlord" name="Artur" activeListings={1} testID="c" />);
    expect(byTestId('c-listings').textContent).toBe('1 active listing');
    expect(byTestId('c-listings').querySelector('[role="link"]')).toBeNull();
  });

  it('an agency without an avatar uses its logo as the avatar and draws no separate agency row', () => {
    mount(<ContactCard role="agency" name="Casa Ribeirinha" agency="Casa Ribeirinha" logo="https://example.test/l.png" testID="c" />);
    expect(queryTestId('c-agency')).toBeNull();
    expect(byTestId('c-label').textContent).toBe('Agency');
  });

  it('actions: Message is primary for an agent, Call calls, "Show phone" reveals the number then calls', () => {
    const onMessage = jest.fn();
    const onCall = jest.fn();
    const onPhoneRevealedChange = jest.fn();
    mount(
      <ContactCard
        role="agent"
        name="Leonor"
        phone="+351 912 480 316"
        onMessage={onMessage}
        onCall={onCall}
        onPhoneRevealedChange={onPhoneRevealedChange}
        testID="c"
      />,
    );
    expect(byTestId('c-message').textContent).toBe('Message');
    expect(getComputedStyle(byTestId('c-message')).backgroundImage || getComputedStyle(byTestId('c-message')).backgroundColor).toBeTruthy();
    act(() => byTestId('c-call').click());
    expect(onCall).toHaveBeenCalledTimes(1);

    const phone = byTestId('c-phone');
    expect(phone.textContent).toBe('Show phone');
    expect(container.textContent).not.toContain('+351');
    act(() => phone.click());
    expect(onPhoneRevealedChange).toHaveBeenCalledWith(true);
    expect(byTestId('c-phone').textContent).toBe('+351 912 480 316');
    expect(byTestId('c-phone').parentElement?.getAttribute('aria-live')).toBe('polite');
    act(() => byTestId('c-phone').click());
    expect(onCall).toHaveBeenCalledTimes(2);
  });

  it('a revealed number with nothing to call is text, not a button', () => {
    mount(<ContactCard role="landlord" name="Artur" phone="+351 934 118 502" phoneRevealed testID="c" />);
    const phone = byTestId('c-phone');
    expect(phone.tagName).not.toBe('BUTTON');
    expect(phone.getAttribute('role')).toBeNull();
    expect(phone.textContent).toBe('+351 934 118 502');
  });

  it('HostCard stays the host preset: "Message host", no role label', () => {
    const onMessage = jest.fn();
    mount(<HostCard name="Marta" onMessage={onMessage} testID="h" />);
    expect(byTestId('h-message').textContent).toBe('Message host');
    expect(queryTestId('h-label')).toBeNull();
    act(() => byTestId('h-message').click());
    expect(onMessage).toHaveBeenCalled();
  });
});

describe('FloorPlan', () => {
  const plans = [
    { source: 'https://example.test/a.png', label: 'Main floor · 96 m²', description: '3 bedrooms' },
    { source: 'https://example.test/b.png', label: 'Upper floor', alt: 'Upper floor plan' },
  ];

  it('pressable tiles are buttons named "<alt>, floor plan N of M" and report their index', () => {
    const onPressPlan = jest.fn();
    mount(<FloorPlan plans={plans} columns={2} onPressPlan={onPressPlan} testID="fp" />);
    const second = byTestId('fp-plan-1');
    expect(second.getAttribute('role')).toBe('button');
    expect(second.getAttribute('aria-label')).toBe('Upper floor plan, floor plan 2 of 2');
    expect(byTestId('fp-plan-0').getAttribute('aria-label')).toBe('Main floor · 96 m², floor plan 1 of 2');
    act(() => second.click());
    expect(onPressPlan).toHaveBeenCalledWith(1);
    expect(queryTestId('fp-plan-0-expand')).not.toBeNull();
  });

  it('tile geometry: radius 16, hairline border, a light sheet in both modes, contained image', () => {
    mount(<FloorPlan plans={plans} columns={2} testID="fp" />, 'dark');
    const tile = byTestId('fp-plan-0');
    const style = getComputedStyle(tile);
    expect(style.borderTopLeftRadius).toBe('16px');
    expect(style.borderTopWidth).toBe('1px');
    expect(style.overflowX).toBe('hidden');
    expect(tile.getAttribute('role')).toBe('img');
    expect(queryTestId('fp-plan-0-expand')).toBeNull();
    // Two columns split the 16px gutter.
    expect(getComputedStyle(byTestId('fp-item-0')).width).toBe('50%');
    expect(getComputedStyle(byTestId('fp-item-0')).paddingRight).toBe('8px');
    expect(getComputedStyle(byTestId('fp-item-1')).paddingLeft).toBe('8px');
    expect(byTestId('fp-plan-0-label').textContent).toBe('Main floor · 96 m²');
    // The sheet is light even in dark mode (a plan is dark line work).
    const bg = getComputedStyle(tile).backgroundColor;
    const [r, g, b] = bg.match(/\d+/g)!.map(Number);
    expect(r! + g! + b!).toBeGreaterThan(700);
  });

  it('a single plan spans the width even with columns={2}', () => {
    mount(<FloorPlan plans={plans.slice(0, 1)} columns={2} testID="fp" />);
    expect(getComputedStyle(byTestId('fp-item-0')).width).toBe('100%');
  });
});
