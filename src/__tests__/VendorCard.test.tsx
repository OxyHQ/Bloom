/**
 * @jest-environment jsdom
 *
 * `VendorCard` through the REAL react-native-web.
 *
 * Two properties this file exists for, neither of which a prop-level test can
 * see. The first is that the card REUSES `listing-card` rather than redrawing
 * it: the wash, the status pill and the paint are asserted against
 * `resolveListingCardPaint`'s own values, so a second colour table added here
 * goes red. The second is the split between what is DRAWN and what is SAID —
 * the pill row clips, and the accessible name must still carry every cuisine.
 */
import React from 'react';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { resolveListingCardPaint, STATUS_WASH_OPACITY } from '../listing-card/shared';
import { VendorCard } from '../vendor-card';
import { VENDOR_CUISINE_LIMIT, VENDOR_FACT_LABELS } from '../vendor-card/constants';
import {
  availabilityLabelFor,
  composeVendorName,
  vendorCuisines,
  vendorFacts,
} from '../vendor-card/shared';
import type { VendorCardProps } from '../vendor-card';
import { byTestId, css, mount, queryTestId, setupHarness, theme } from './support/commerce-harness';

setupHarness();

const VENDOR: VendorCardProps = {
  name: 'Fig & Ember',
  cuisines: ['Wood-fired', 'Flatbread', 'Small plates', 'Wine', 'Desserts', 'Coffee'],
  rating: 4.8,
  reviewCount: 214,
  deliveryTime: '25–35 min',
  deliveryFee: '€1.90',
  distance: '1.2 km',
  minimumOrder: '€14',
  promo: '2 for 1',
};

describe('the readings are drawn one way and said another', () => {
  it('keeps the order, and gives each reading the word it is announced with', () => {
    const facts = vendorFacts(VENDOR);
    expect(facts.map((f) => f.label)).toEqual(['25–35 min', '€1.90', '1.2 km', '€14']);
    expect(facts.map((f) => f.accessibilityLabel)).toEqual([
      `${VENDOR_FACT_LABELS.deliveryTime} 25–35 min`,
      `${VENDOR_FACT_LABELS.deliveryFee} €1.90`,
      `${VENDOR_FACT_LABELS.distance} 1.2 km`,
      `${VENDOR_FACT_LABELS.minimumOrder} €14`,
    ]);
  });

  it('leaves out a reading the app did not give, rather than drawing a gap', () => {
    expect(vendorFacts({ deliveryTime: '10 min' }).map((f) => f.label)).toEqual(['10 min']);
    expect(vendorFacts({})).toEqual([]);
  });

  it('lets one prop translate all four words', () => {
    const facts = vendorFacts({ deliveryFee: '€1.90', factLabels: { deliveryFee: 'Envío' } });
    expect(facts[0]?.accessibilityLabel).toBe('Envío €1.90');
  });

  it('draws every reading it was given', () => {
    mount(<VendorCard {...VENDOR} testID="v" />);
    expect(byTestId('v-facts-0').textContent).toContain('25–35 min');
    expect(byTestId('v-facts-3').textContent).toContain('€14');
  });
});

describe('the pill row clips; the name does not', () => {
  it('caps the pills at the density’s limit, de-duplicated', () => {
    expect(vendorCuisines(['a', 'b', 'a', 'c', 'd', 'e'], 'comfortable')).toHaveLength(
      VENDOR_CUISINE_LIMIT.comfortable,
    );
    expect(vendorCuisines(['a', 'b', 'a', 'c', 'd', 'e'], 'compact')).toHaveLength(
      VENDOR_CUISINE_LIMIT.compact,
    );
    expect(vendorCuisines(['a', 'b', 'a'], 'comfortable')).toEqual(['a', 'b']);
  });

  it('still says every cuisine, including the ones that were not drawn', () => {
    const name = composeVendorName(VENDOR);
    for (const cuisine of VENDOR.cuisines!) expect(name).toContain(cuisine);
    // The row drew four; the sentence carries six.
    mount(<VendorCard {...VENDOR} testID="v" />);
    const drawn = byTestId('v-cuisines').textContent ?? '';
    expect(drawn).not.toContain('Coffee');
    expect(byTestId('v-link').getAttribute('aria-label')).toContain('Coffee');
  });

  it('hides the drawn pills from assistive technology, so nothing is said twice', () => {
    mount(<VendorCard {...VENDOR} testID="v" />);
    expect(byTestId('v-cuisines').getAttribute('aria-hidden')).toBe('true');
  });
});

describe('availability', () => {
  it('draws nothing for a vendor that is taking orders', () => {
    expect(availabilityLabelFor('open')).toBeNull();
    expect(availabilityLabelFor(undefined)).toBeNull();
    mount(<VendorCard {...VENDOR} testID="v" />);
    expect(queryTestId('v-status')).toBeNull();
    expect(queryTestId('v-wash')).toBeNull();
  });

  it('washes the cover and pills the status for paused and for closed', () => {
    for (const [availability, label] of [
      ['paused', 'Paused'],
      ['closed', 'Closed'],
    ] as const) {
      mount(<VendorCard {...VENDOR} availability={availability} testID="v" />);
      expect(byTestId('v-status').textContent).toBe(label);
      const wash = getComputedStyle(byTestId('v-wash'));
      expect(wash.backgroundColor).toBe(css(resolveListingCardPaint(theme()).statusWash));
      expect(wash.opacity).toBe(String(STATUS_WASH_OPACITY));
    }
  });

  it('draws the reopening line ONLY while the vendor is not open', () => {
    mount(<VendorCard {...VENDOR} opensAt="Opens at 07:30" testID="v" />);
    expect(queryTestId('v-opens-at')).toBeNull();
    mount(<VendorCard {...VENDOR} availability="closed" opensAt="Opens at 07:30" testID="v" />);
    expect(byTestId('v-opens-at').textContent).toBe('Opens at 07:30');
  });

  it('takes a translated status word', () => {
    mount(<VendorCard {...VENDOR} availability="closed" availabilityLabel="Cerrado" testID="v" />);
    expect(byTestId('v-status').textContent).toBe('Cerrado');
  });
});

describe('the heart is a sibling of the link, not its child', () => {
  it('keeps the control outside the pressable, in both densities', () => {
    for (const density of ['comfortable', 'compact'] as const) {
      mount(
        <VendorCard {...VENDOR} density={density} favorite onFavoriteChange={() => undefined} testID="v" />,
      );
      const link = byTestId('v-link');
      const heart = byTestId('v-favorite');
      expect(link.contains(heart)).toBe(false);
    }
  });

  it('draws no heart at all without a handler', () => {
    mount(<VendorCard {...VENDOR} testID="v" />);
    expect(queryTestId('v-favorite')).toBeNull();
  });
});

describe('the promo mark', () => {
  it('is drawn, and is in the name', () => {
    mount(<VendorCard {...VENDOR} testID="v" />);
    expect(byTestId('v-promo').textContent).toContain('2 for 1');
    expect(byTestId('v-link').getAttribute('aria-label')).toContain('2 for 1');
  });

  it('is gone when there is no promotion', () => {
    mount(<VendorCard {...VENDOR} promo={undefined} testID="v" />);
    expect(queryTestId('v-promo')).toBeNull();
  });
});

describe('the name is the whole card, in reading order', () => {
  it('says the status, the promo, the cuisines, the rating and the readings', () => {
    const name = composeVendorName({ ...VENDOR, availability: 'closed', opensAt: 'Opens at 07:30' });
    expect(name.indexOf('Fig & Ember')).toBeLessThan(name.indexOf('Closed'));
    expect(name.indexOf('Closed')).toBeLessThan(name.indexOf('Opens at 07:30'));
    expect(name).toContain('Rated 4.8 out of 5, 214 reviews');
    expect(name).toContain(`${VENDOR_FACT_LABELS.deliveryTime} 25–35 min`);
  });

  it('says "New" rather than a rating when there is none', () => {
    expect(composeVendorName({ name: 'X', price: undefined, rating: null } as VendorCardProps)).toContain('New');
    expect(composeVendorName({ name: 'X', rating: null, newLabel: 'Nuevo' } as VendorCardProps)).toContain('Nuevo');
  });

  it('is replaced whole by an explicit one', () => {
    mount(<VendorCard {...VENDOR} accessibilityLabel="Todo en uno" testID="v" />);
    expect(byTestId('v-link').getAttribute('aria-label')).toBe('Todo en uno');
  });
});

describe('loading', () => {
  it('draws a busy placeholder and none of the vendor', () => {
    mount(<VendorCard {...VENDOR} loading testID="v" />);
    expect(byTestId('v').getAttribute('aria-busy')).toBe('true');
    expect(queryTestId('v-name')).toBeNull();
    expect(queryTestId('v-link')).toBeNull();
  });
});
